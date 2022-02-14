
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


class CancelToken {
  constructor(executor) {
    this.executor = executor;
  }
  cancel(msg) {
    this.cancelMsg = msg;
  }
  source() {
    return {
      token: null
    }
  }
}