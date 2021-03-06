### clearTimeout

#### \# 前言

一个夜黑风高的晚上，测试跑过来说，这个页面为什么发现的请求这么多。是不是你改了哪里- -！

#### 一、查看相关代码

```javascript
// 源码
{
    beforeDestroy() {
      clearInterval(this.ticker);
    },
    mounted() {
      this.startTicker();
    },
    methods: {
      async startTicker() {
        clearTimeout(this.ticker);
        if (this.ticker) {
          this.ticker = null;
        }
        if (!this.getting) {
          this.getting = true;
          await this.getData();
          await this.getItems();
          this.getting = false;
        }
        const v = this;
        this.ticker = setTimeout(async () => {
          await v.startTicker();
        }, 5000);
      },
    }
}

```
大概分析原本需求：
1、vue实例mounted后调用 startTicker, startTicker里面等待两个promise请求后，setTimeout 5秒再调用自己。
2、beforeDestroy做clearInterval处理。

精减代码
```javascript
  let timer = null;
  const ticker = async () => {
    console.log(Date.now())
    await sleep(1000);
    timer = setTimeout(ticker);
  }

  const sleep = (timeout) => {
    return new Promise((resolve) => {
      setTimeout(resolve, timeout);
    })
  }
  ticker();
  console.log(timer)
  clearTimeout(timer);  // bug: 执行到这里的时候，timer还没赋值
```

#### 二、bug fix

> 添加状态变量控制，最小修改成本，修改业务逻辑容易出未知bug。

```javascript
{
    beforeDestroy() {
      // 状态控制
      this.isDestroy = true;
      clearInterval(this.ticker);
    },
    mounted() {
      this.startTicker();
    },
    methods: {
      async startTicker() {
        clearTimeout(this.ticker);
        if (this.ticker) {
          this.ticker = null;
        }
        if (!this.getting) {
          this.getting = true;
          await this.getData();
          await this.getItems();
          this.getting = false;
        }
        // 状态控制
        if (this.isDestroy) return ;
        this.ticker = setTimeout(async () => {
          await this.startTicker();
        }, 5000);
      },
    }
}
```

> 所有等待的promise 都添加abort函数。

```javascript

  let timer = null;
  const noop = () => {}

  const ticker = async () => {
    console.log(Date.now())
    await sleep(5000).catch(noop);
    timer = setTimeout(ticker);
  }

  const sleep = (timeout) => {
    return new Promise((resolve, reject) => {
      const timerId = setTimeout(resolve, timeout);
      // 异步promise 请求都添加一个取消函数
      // 如果是axios请求，记录axios.CancelToken.source()
      this.abort = () => {
        clearTimeout(timerId);
        reject('abort')
      }
    })
  }

  const promise = ticker();
  this.abort();
  promise.then(() => {
    clearTimeout(timer);
  });


  // 回到源码修改
  {
    // 如果有keep-alive deactivated钩子也要取消
    beforeDestroy() {
      this.abort();
      this.promiseTick.then(() => {
        clearInterval(this.ticker);
      })
    },
    mounted() {
      this.promiseTick = this.startTicker();
    },
    methods: {
      async startTicker() {
        clearTimeout(this.ticker);
        if (this.ticker) {
          this.ticker = null;
        }
        if (!this.getting) {
          this.getting = true;
          await this.getData();
          await this.getItems();
          this.getting = false;
        }

        this.ticker = setTimeout(async () => {
          await this.startTicker();
        }, 5000);
      },
      // getData getItems 里面添加axios.CancelToken.source()
      abort(type) {
        if (!type) {
          Object.keys(this.sources).forEach(key => this.sources[key].cancel(CANCEL_MESSAGE));
          this.sources = {};
          return;
        }

        let source = this.sources[type];
        if (source) {
          delete this.sources[type];
          source.cancel(CANCEL_MESSAGE);
        }
    },
    }
}
```

#### 三、总结

1. 开发人员js事件循环不熟悉，导致bug出现。
2. 个人认为修复bug的第1种方法，比第二种好。理由是代码改动小。改别人的代码还是得小心爆雷。

#### 业务解耦一 

```javascript
export class Poll {
  constructor(workPromise, gapTime = 2000) {
    this.workFunc = () => {
      return new Promise(async resolve => {
        await workPromise();
        resolve();
      });
    };
    this.gapTime = gapTime;
    this.timerId = null;
    this.isPolling = false;
    this.missCount = 0;
  }

  polling() {
    if (!this.isPolling) return;

    this.workFunc()
      .then(() => {
        this.timerId = setTimeout(() => {
          this.clear();
          this.polling();
        }, this.gapTime);
      })
      .catch(() => {
        this.missCount++;
        if (this.missCount >= 3) {
          this.destroy();
        } else {
          this.polling();
        }
      });
  }

  start() {
    this.isPolling = true;
    this.polling();
  }

  stop() {
    this.isPolling = false;
  }

  clear() {
    this.timerId && clearTimeout(this.timerId);
  }

  destroy() {
    this.stop();
    this.clear();
  }
}

```

#### 业务解耦二

不封装循环setTimeout逻辑, 让用户自己实现，逻辑更清楚，但需一定的编码

封装一个延时函数即可

```javascript

function sleep(gapTime, ref) {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(() => {
      resolve();
    }, gapTime)

    ref.source =  Axios.CancelToken.source();
    ref.source.cancel = (reason) => {
      clearTimeout(timerId);
      reject(Axios.Cancel(reason))
    }
  })
}


// 业务逻辑
async poll() {
  while(true) {
    const ref = this;
    await sleep(2000, ref);
    await fetchRecordData(ref);
  }
}
fetchRecordData(ref) {
  this.source = Axios.CancelToken.source();
  axios.post('url', {}, {CancelToken: this.source.token}).then(res => {
    this.source = null;
  }).catch(e => {
    // Axios.isCancel(e)
  })
}
abort() {
  this.source.cancel('cancel');
}


```