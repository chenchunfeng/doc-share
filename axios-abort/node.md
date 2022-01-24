### Axios请求取消-代码解读

#### \# 前言
   在常见的搜索框监听用户输入变化请求数据的场景，正常情况下每次变化我们都要请求服务端，一般前端做使用debounce的方案，用户在停下xxx ms下才发送请求。
但是在一些极端的情况下，上一次请求的数据未响应，用户再次改变输入发起新请求，出现新请求先响应，旧请求响应慢。造成用户显示的数据错误。

#### axios解决方案

```javascript
// 每一个请求前，abort上一个请求
function abort() {
  if (this.source) {
    this.source.cancel(CANCEL_MESSAGE);
    this.source = null;
  }
}

function fetchRecords() {
  this.abort();
  this.source = axios.CancelToken.source();
  $http.post('url', params, { cancelToken: this.source.token })
    .then(data => {
      this.source = null;
    })
    .catch(e => {
      if (!axios.isCancel(e)) {
        this.source = null;
      }
    });
}

// CancelToken 另一种用法
const CancelToken = axios.CancelToken;
let cancel;
axios.get('/user/12313', {
  cancelToken: new CancelToken(function executor(c) {
    cancel = c;
  })
});

// 取消请求
cancel();

```

#### axios请求取消需求分析

axios是通过封装const xhr = new XMLHttpRequest(); xhr.send()来实现的， 通过其xhr.abort()可取消。
从上次的使用方法，我们需要实现
1. axios上添加CancelToken对象
2. CancelToken对象上面有source方法， source方法返回的对象有token属性、cancel方法
3. CancelToken的构造函数，可传一个回调函数，可赋值cancel方法。
4. axios上添加isCancel方法

```javascript

class CancelToken {
  constructor(executor) {
    executor((msg) => {
      this.cancel(msg)
    });
  }
  cancel(msg) {
    this.cancelMsg = msg;
  }
  //  
  static source() {
    return {
      token: null,
      cancel: this.cancel
    }
  }
}

// 关键点：异步取消请求,cancelToken添加一个promise
// xhr.js
const { /*....*/ cancelToken } = config

if (cancelToken) {
  cancelToken.promise.then(reason => {
    request.abort()
    reject(reason)
  })
}

// cancelToken.js
class CancelToken {
  constructor(executor) {
    executor((msg) => {
      this.cancel(msg)
    });
    this.promise = new Promise(resolve => {
      this.resolvePromise = resolve;
    })
  }
  cancel(msg) {
    // 这里就会触发xhr.js的request.abort
    this.resolvePromise(msg);
    this.cancelMsg = msg;
  }
  //  
  static source() {
    let cancel = null; // **静态方法，不能使用this.cancel**

    return {
      // 记得这个token 是赋值给cancelToken的
      token: new CancelToken((c) => {
        cancel = c
      }),
      cancel,
    }
  }
}


// 还剩下最后一个isCancel需求

// 首页在xhr.js中使用reject(reason)了
// 哪就是通过axios.isCancel(reason) reason 判断是不是同一个引用
class Cancel() {
  message?: string
  constructor(message?: string) {
    this.message = message
  }
}

function isCancel(reason) {
  return reason instanceof Cancel
}

// cancelToken.js
class CancelToken {
  constructor(executor) {
    executor((msg) => {
      this.cancel(msg)
    });
    this.promise = new Promise(resolve => {
      this.resolvePromise = resolve;
    })
  }
  cancel(msg) {
    // 传递new Cancel(msg) 就可以实现isCancel
    this.resolvePromise(new Cancel(msg));
  }
  static source() {
    return {
      token: new CancelToken(() => {}),
      cancel: this.cancel
    }
  }
}


Axios.isCancel

```

> Note : 可以使用同一个 cancel token 取消多个请求
> 其实就是判断CancelToken里面有没有msg
```javascript
// cancelToken.js
class CancelToken {
  constructor(executor) {
    executor((msg) => {
      this.cancel(msg)
    });
    this.promise = new Promise(resolve => {
      this.resolvePromise = resolve;
    })
  }
  cancel(msg) {
    // 判断reason即可知道cancelToken有没使用过
    this.reason = new Cancel(msg);
    this.resolvePromise(this.reason);
    
  }
  static source() {
    return {
      token: new CancelToken(() => {}),
      cancel: this.cancel
    }
  }
}
```

#### 总结

1. 开发功能前，一定要分析需求，列举功能点。
2. 通过传递promise，异步处理abort调用问题。
3. 通过 instanceof 实现isCancel。






