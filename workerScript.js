onmessage = function(event, data) {
  var params = event.data;
  // var params = JSON.parse(event.data);
  // console.log('message: ', data, params, this, postMessage);

  for (var i = params.ary.length - 1; i >= 0; i--) {
    var actionKey = params.ary[i];
    var keyValue = params.data[actionKey][params.step];
    // console.log(keyValue, 'keyValue');
    // window.TimeLineActions[actionKey](keyValue);
    // webWorker线程属于后台运行，没有window对象
    this.postMessage(JSON.stringify({ actionKey, keyValue, i }));
  }

  // 向线程创建源送回消息
  this.postMessage(JSON.stringify({ page: params.step, end: true }));
}