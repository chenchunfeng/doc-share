onmessage = data => {
  console.log('worker received message')
  postMessage('worker received message')
}