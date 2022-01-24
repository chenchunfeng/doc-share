// function generateRequest() {
//   let ongoing = false;
//   const listeners = [];

//   return function request() {
//     if (!ongoing) {
//       ongoing = true
//       return new Promise(resolve => {
//         console.log('requesting...');

//         setTimeout(() => {
//           const result = 'success';
//           resolve(result);
//           ongoing = false;

//           if (listeners.length <= 0) return;

//           while (listeners.length > 0) {
//             const listener = listeners.shift();
//             listener && listener.resolve(result);
//           }
//         }, 1000);
//       })
//     }

//     return new Promise((resolve, reject) => {
//       listeners.push({ resolve, reject })
//     })
//   }
// }

// const request = generateRequest();

// request().then(data =>console.log(`invoke1 ${data}`));
// request().then(data =>console.log(`invoke2 ${data}`));
// request().then(data =>console.log(`invoke3 ${data}`));


useEffect(() => {
  // 有效性标识
  let didCancel = false;
  const fetchData = async () => {
    const result = await getData(query);
    // 更新数据前判断有效性
    if (!didCancel) {
      setResult(result);
    }
  }
  fetchData();
  return () => {
    // query 变更时设置数据失效
    didCancel = true;
  }
}, [query]);