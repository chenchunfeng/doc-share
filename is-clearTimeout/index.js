const CANCELED_MSG = '主动取消'
const vue = {
  mounted() {
    this.startTick();
  },
  beforeDestroy() {
    this.stopTick();
  },
  // keep-alive
  activated() {
    this.startTick();
  },
  deactivated() {
    this.stopTick();
  },
  method: {
    stopTick() {
      this.abortAllPromise()
    },
    async startTick(timeout = 5000) {
      await task();
      this.timer = setTimeout(startTick, timeout)

    },
    async task() {
      if (!this.getting) {
        this.getting = true;
        await this.getData();
        await this.getItems();
        this.getting = false;
      }
    },
    abortPromiseAll() {
      promiseAll.forEach(item => {
        item.abort();
      })
    },
    sleep(timeout) {
      return new Promise((resolve, reject) => {
        const timerId = setTimeout(resolve, timeout);
        
        this.source = axios.CancelToken.source();
        this.source.cancel = () => {
          clearTimeout(timerId);
          reject(new axios.Cancel(CANCELED_MSG))

        }
      })
    }
  
  }
}


let timer = null;
const ticker = async () => {
  console.log(Date.now())
  await sleep(1000)
  await sleep(1000)
  timer = setTimeout(() => {
    ticker()
  })
}
const sleep = async (timeout) => {
  return new Promise((resolve, reject) => {
    const timerId = setTimeout(resolve, timeout);
    this.cancel = () => {
      clearTimeout(timerId);
      reject('cancel');
      debugger

    }
  })
}
ticker();
this.cancel()
clearTimeout(timer);