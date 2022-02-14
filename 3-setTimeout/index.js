// const worker = new Worker('./worker.js');

// worker.postMessage('hello worker');

// worker.onmessage = (event => {
//   console.log('onmessage', event.data)
// })

// worker生成器
const createWorker = (fn, options) => {
  const blob = new Blob(['(' + fn.toString() + ')()']);
  const url = URL.createObjectURL(blob);
  if (options) {
      return new Worker(url, options);
  }
  return new Worker(url);
} 
// worker 部分
const worker = createWorker(function () {
  onmessage = function (e) {
      const date = Date.now();
      while (true) {
          const now = Date.now();
          if(now - date >= e.data) {
              postMessage(1);
              return;
          }
      }
  }
})

debugger

// let isStart = false;
// function timer() {
//     worker.onmessage = function (e) {
//        cb()
//         if (isStart) {
//             worker.postMessage(speed);
//         } 
//     }
//     worker.postMessage(speed);
// }

// timer()