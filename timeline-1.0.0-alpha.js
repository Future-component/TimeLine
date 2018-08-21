/**
 * TimeLine 1.0.0-alpha
 * Copyright (c) 2018 Beth
 * 无论希望同步什么，该插件都会把这个东西同步到唯一的一个时间轴上
 * depend [no]
 */

 /**
  * 希望解决的问题
  * 1.和时间本身无关，就是要相互同步执行；
  * 2.如果有一个模块慢了，其他模块需要进行自动对齐
  * 3.如果有一个模块快了，自己需要慢下来（以慢的为基准）
  * 4.如何实现链式动画播放
  * 5.如何处理时间差
  * 6.实现链式调用
  * 7.支持监听progress
  * 8.数据为数组对象
  * {
  *   eventType: 'ppt',
  *   startTime: (new Date()).getTime()
  *   data: "{ title: '1' }"
  * }
  * 9.如何实现快放
  */

 (function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
      (global.TimeLine = factory())
})(this, (function() {
  'use strict';

  var Version = 'timeline-1.0.0-alpha';

  var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ?
      'symbol' : typeof obj;
  }

  var defineProperty = function (obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value
    }

    return obj;
  }

  /**
   * Check if a variable is a boolean
   */
  function isBoolean(variable) {
    return variable === true || variable === false;
  }

  /**
   * Check if a variable is a function
   */
  function isFunction(variable) {
    return Object.prototype.toString.call(variable) === '[object Function]';
  }

  /**
   * Check if a variable is an HTMLElement or SVGElement
   */
  function isNode(variable) {
    return !!(variable && variable.nodeType);
  }

  /**
   * Check if a variable is a number
   */
  function isNumber(variable) {
    return typeof variable === 'number';
  }

  /**
   * Check if a variable is a plain object (and not an instance)
   */
  function isPlainObject(variable) {
    if (
      !variable ||
      (typeof variable === 'undefined' ? 'undefined' : _typeof(variable)) !== 'object' ||
      variable.nodeType ||
      Object.prototype.toString.call(variable) !== '[object Object]'
    ) {
      return false;
    }
    var proto = Object.getPrototypeOf(variable);
    return !proto || proto.hasOwnProperty('constructor') && proto.constructor === Object;
  }

  /**
   * Check if a variable is a string
   */
  function isString(variable) {
    return typeof variable === 'string';
  }

  /**
   * Check is a property is an enumerable member of an object
   */
  function propertyIsEnumerable(obj, property) {
    return Object.prototype.propertyIsEnumerable.call(obj, property);
  }

  // Project
  /**
   * Add a single className to an Element
   */
  function addClass(element, className) {
    if (element instanceof Element) {
      if (element.classList) {
        element.classList.add(className);
      } else {
        removeClass(element, className);
        element.className += (element.className.length ? " " : "") + className;
      }
    }
  }

  /**
   * Remove a single className from an Element
   */
  function removeClass(element, className) {
    if (element instanceof Element) {
      if (element.classList) {
        element.classList.remove(className);
      } else {
        // TODO: Need some jsperf tests on performance - can we get rid of the regex and maybe use split / array manipulation?
        element.className = element.className.replace(new RegExp("(^|\\s)" + className + "(\\s|$)", "gi"), " ");
      }
    }
  }

  /**
   * create a classNames
   */
  function classNames () {
    var classes = [];

    for (var i = arguments.length - 1; i >= 0; i--) {
        var arg = arguments[i];
        if (!arg) continue;

        var argType = typeof arg;

        if (argType === 'string' || argType === 'number') {
            classes.push(arg);
        } else if (Array.isArray(arg) && arg.length) {
            var inner = classNames.apply(null, arg);
            if (inner) {
                classes.push(inner);
            }
        } else if (argType === 'object') {
            for (var key in arg) {
                if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
                    classes.push(key);
                }
            }
        }
    }

    return classes.join(' ');
  }

  /**
   * create a styles
   */
  function styleObjToString () {
    var styles = [];

    for (var i = arguments.length - 1; i >= 0; i--) {
        var arg = arguments[i];
        if (!arg) continue;
        var argType = typeof arg;

        if (argType === 'object') {
            for (var key in arg) {
                if (Object.prototype.hasOwnProperty.call(arg, key)) {
                    styles.push(key + ':' + arg[key])
                }
            }
        }
    }

    return styles.join(';');
  }

  /**
   * merge object
   */
  var _extends = Object.assign || function (target) {
    for (var i = arguments.length - 1; i >= 1; i--) {
        var source = arguments[i];
        for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
  };

  /**
   * Clone an array, works for array-like too
   */
  function cloneArray(arrayLike) {
    // prototype.slice.call(arguments) || arguments.toArray().slice()
    return Array.prototype.slice.call(arrayLike, 0);
  }

  function toArray(s) {
    try {
      return Array.prototype.slice.call(s);
    } catch (e) {
      var arr = [];
      for (var i = s.length - 1; i >= 0; i--) {
        // arr.push(s[i])
        arr[i] = s[i];
      }
      return arr;
    }
  }

  /**
   * The <strong><code>defineProperty() </code></strong> function provides a
   * shortcut to defining a property that cannot be accidentally iterated across
   */
  function defineProperty$1(proto, name, value, readonly) {
    if (proto) {
      Object.defineProperty(proto, name, {
        configurable: !readonly,
        writable: !readonly,
        value: value,
      });
    }
  }

  /**
   * 引入query的dom元素操作
   */
  

  /**
   * Shim to get the current milliseconds - on anything except old IE it'll use
   * Date.now() and save creating an object. If that doesn't exist then it'll
   * create one that gets GC.
   */
  var now = Date.now ? Date.now : function() {
    return new Date().getTime();
  }

  // Project
  // Constants
  var Actions = {};
  window.TimeLineActions = {};
  /**
   * Used to register an action. This should never be called by users
   * directly, instead it should be called via an action: <br />
   * <code>TimeLine('registerAction', 'name', TimeLineActionFn);</code>
   */
  function registerAction(args, internal) {
    var name = args[0];
    var callback = args[1];
    if (!isString(name)) {
      console.warn('TimeLineJS: Trying to set "registerAction" name to an invalid value:', name)
    } else if (!isFunction(callback)) {
      console.warn('TimeLineJS: Trying to set "registerAction" callback to an invalid value:', name, callback);
    } else if (Actions[name] && !propertyIsEnumerable(Actions, name)) {
      console.warn('TimeLineJS: Trying to override internal "registerAction" callback', name);
    } else if (internal === true) {
      window.TimeLineActions[name] = callback;
      defineProperty$1(Actions, name, callback)
    } else {
      window.TimeLineActions[name] = callback;
      Actions[name] = callback;
    }
  }

  function PubSub() {
    this.handlers = {};
  }
  PubSub.prototype = {
    // 订阅事件
    on: function(eventType, handler){
        var self = this;
        if (handler) {
          if(!(eventType in self.handlers)) {
            self.handlers[eventType] = [];
          }
          self.handlers[eventType].push(handler);
        } 
        return this;
    },
      // 触发事件(发布事件)
    emit: function(eventType){
        var self = this;
        if (self.handlers[eventType]) {
          var handlerArgs = Array.prototype.slice.call(arguments,1);
          for(var i = self.handlers[eventType].length - 1; i >= 0; i--) {
            self.handlers[eventType][i].apply(self,handlerArgs);
          }
        }
        return self;
    },
    // 删除订阅事件
    off: function(eventType, handler){
        var currentEvent = this.handlers[eventType];
        var len = 0;
        if (currentEvent) {
            len = currentEvent.length;
            for (var i = len - 1; i >= 0; i--){
                if (currentEvent[i] === handler){
                    currentEvent.splice(i, 1);
                }
            }
        }
        return this;
    }
  };

  /**
   * init a action
   */
  registerAction(['registerAction', registerAction], true);

  /**
   * the core source
   */
  var DURATION_FAST = 200;
  var DURATION_NORMAL = 400;
  var DURATION_SLOW = 600;
  var DEFAULT_CACHE = true;
  var DEFAULT_DELAY = 0;
  var DEFAULT_DURATION = DURATION_NORMAL;
  var DEFAULT_FPSLIMIT = 60;
  var DEFAULT_LOOP = 0;
  var DEFAULT_PROMISE = true;
  var DEFAULT_PROMISE_REJECT_EMPTY = true;
  var DEFAULT_QUEUE = "";
  var DEFAULT_REPEAT = 0;
  var DEFAULT_SPEED = 1;
  var DEFAULT_SYNC = true;
  var Duration = {
    fast: DURATION_FAST,
    normal: DURATION_NORMAL,
    slow: DURATION_SLOW
  };
  
  // Error checking
  /**
   * Parse a duration value and return an ms number. Optionally return a
   * default value if the number is not valid
   */
  function parseDuration(duration, def) {
    if (isNumber(duration)) {
      return duration;
    }
    if (isString(duration)) {
      return Duration[duration.toLowerCase()] || parseFloat(duration.replace("ms", "").replace("s", "000"));
    }
    return def = null ? undefined : parseDuration(def);
  }

  /**
   * Validate a <code>cache</code> option.
   */
  function validateCache(value) {
    if (isBoolean(value)) {
      return value;
    }
    if (value != null) {
      console.warn('TimeLineJS: Trying to set "cache" to an invalid value: ', value);
    }
  }

  /**
   * Validate a <code>begin</code> option.
   */
  function validateBegin(value) {
    if (isFunction(value)) {
      return value;
    }
    if (value !== null) {
      console.warn('TimeLineJS: Trying to set "begin" to an invalid value:', value)
    }
  }

  /**
   * Validate a <code>complete</code> option
   */
  function validateComplete(value, noError) {
    if (isFunction(value)) {
      return value
    }
    if (value !== null && !noError) {
      console.warn('TimeLineJS: Trying to set "Complete" to an invalid value:', value)
    }
  }

  /**
   * Validate a <code>delay</code> option
   */
  function validateDelay(value) {
    var parsed = parseDuration(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
    if (value !== null) {
      console.error('TimeLineJS: Trying to set "delay" to an invalid value:', value);
    }
  }

  /**
   * Validate a <code>duration</code> option
   */
  function validateDuration(value, noError) {
    var parsed = parseDuration(value);
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
    if (value !== null && !noError) {
      console.error('TimeLineJS: Trying to set "duration" to an invalid value: ', value);
    }
  }

  /**
   * Validate a <code>loop</code> option
   */
  function validateLoop(value) {
    switch(value) {
      case false:
        return 0;
      case true:
        return true;
      default:
        var parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
        break;
    }
    if (value !== null) {
      console.warn('TimeLineJS: Trying to set "loop" to an invalid value: ', value);
    }
  }

  /**
   * Validate a <code>progress</code> option
   */
  function validateProgress(value) {
    if (isFunction(value)) {
      return value;
    }
    if (value !== null) {
      console.warn('TimeLineJS: Trying to set "progress" to an invalid value:', value)
    }
  }

  /**
   * Validate a <code>promise</code> option.
   */
  function validatePromise(value) {
    if (isBoolean(value)) {
      return value;
    }
    if (value !== null) {
      console.warn('TimeLineJS: Trying to set "promise" to an invalid value:', value)
    }
  }

  /**
   * Validate a <code>promiseRejectEmpty</code> option
   */
  function validatePromiseRejectEmpty(value) {
    if (isBoolean(value)) {
      return value;
    }
    if (value !== null) {
      console.warn('TimeLineJS: Trying to set "promiseRejectEmpty" to an invalid value:', value)
    }
  }

  function getTimeString(t) {
    var m = "";
    if(t > 0){
        if(t < 10){
            m = "0" + t;
        }else{
            m = t + "";
        }
    }else{
        m = "00";
    }
    return m;
  }

  function formatTime(timeStemp) {
    if (!timeStemp || !isNumber(timeStemp) || timeStemp < 0) {
      console.warn('错误的时间戳格式', timeStemp);
    }

    if(timeStemp < 60000){
      return (timeStemp % 60000 ) / 1000 + "秒";
    }else if((timeStemp >= 60000) && (timeStemp < 3600000)){
      return getTimeString((timeStemp % 3600000) / 60000) + ":" + getTimeString((timeStemp % 60000 ) / 1000);
    }else {
      return getTimeString(timeStemp / 3600000) + ":" + getTimeString((timeStemp % 3600000) / 60000) + ":" + getTimeString((timeStemp % 60000 ) / 1000);
    }
  }

  function sortBy(list, sortFunc) {
    var ary = [];
    ary =  list.sort(function(a,b){
      return a.age()-b.age();
    })

    console.log(ary, sortFunc)
  } 

  /**
   * 根据field字段将数组转换成对象
   * @param {*} list 数组对象
   * @param {*} field 设置字段key
   * @param {*} sort 是否先进行排序
   */
  function arrayToObjectByField(list, field, startTime, duration, sort) {
    const data = sort ? sortBy(list, (item) => (item[sort])) : list
    const obj = {}
    let key = null
    let objChild = {}
    var interval = [0, 0];

    data.forEach((item, index) => {
      if (!interval[0]) {
        interval[0] = item.startTime;
        interval[1] = item.startTime;
      } else if (item.startTime > interval[1]) {
        interval[1] = item.startTime;
      } else if (item.startTime < interval[0]) {
        interval[0] = item.startTime;
      }

      var timeStempKey = Math.floor((item.startTime - startTime) / duration);
      const keyTmp = isFunction(field) ? field(item) : item[field]
      if (data.length - 1 === index && keyTmp === key) {
        objChild[timeStempKey] = item;
        obj[key] = objChild
      } else if (!index) {
        key = keyTmp
        objChild[timeStempKey] = item;
        if (data.length - 1 === index) {
          obj[key] = objChild
        }
      } else if (keyTmp !== key) {
        // 保存上一份记录
        obj[key] = objChild
        objChild = {}
        // 重新进行保存
        objChild[timeStempKey] = item;
        key = keyTmp
        if (data.length - 1 === index) {
          obj[key] = objChild
        }
      } else {
        objChild[timeStempKey] = item;
      }
    })
    return {
      data: obj,
      interval: [interval[0] - 2000, interval[1] + 2000],
    }
  }

  var newSetInterval = function(callback, interval) {
    var id = Math.random();
    var obj = {};
    var timer = null;
    var timeoutTimer = function(callback, interval) {
      timer = setTimeout(() => {
        isFunction(callback) && callback();
        timeoutTimer(callback, interval);
      }, interval);
      obj[id] = timer;
    }
  
    timeoutTimer(callback, interval);
    // console.log('create-timer', obj); 
    return obj;
  }
  
  var newClearSetInterval = function(timer) {
    // 加一个setTimeout执行异步操作，插入异步队列中，使执行顺序对齐
    setTimeout(function(){
      // console.log('delete-timer', timer);
      for (var i in timer) {
        clearTimeout(timer[i]);
      }
    }, 0);
  }
  
  var defaults$1 = {
    mobile: false,
  }

  // NOTE: Add the variable here, then add the default state in 'reset' below.
  var cache$1 = void 0,
      begin = void 0,
      complete = void 0,
      delay = void 0,
      duration = void 0,
      loop = void 0,
      mobile = void 0,
      minFrameTime = void 0,
      promise = void 0,
      promiseRejectEmpty = void 0,
      queue = void 0,
      repeat = void 0,
      speed = void 0,
      sync = void 0;
  // TMPORTAQNT: Make sure any new defaults get added to the actions/set.ts list
  Object.defineProperties(defaults$1, {
    reset: {
      enumerable: true,
      value: function value() {
        cache$1 = DEFAULT_CACHE;
        begin = undefined;
        complete = undefined;
        delay = DEFAULT_DELAY;
        duration = DEFAULT_DURATION;
        loop = DEFAULT_LOOP;
        minFrameTime = FUZZY_MS_PER_SECOND / DEFAULT_FPSLIMIT;
        promise = DEFAULT_PROMISE;
        promiseRejectEmpty = DEFAULT_PROMISE_REJECT_EMPTY;
        queue = DEFAULT_QUEUE;
        repeat = DEFAULT_REPEAT;
        speed = DEFAULT_SPEED;
        sync = DEFAULT_SYNC;
      }
    },
    cache: {
      enumerable: true,
      get: function() {
        return cache$1;
      },
      set: function() {
        value = validateCache()
      }
    }
  });

  var timeShaft = function(totalStep) {
    var perWidth = window.innerWidth / totalStep;
    
    var timeLineStyle = {
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      'z-index': 9999999,
      width: '100%',
      height: '20px',
      background: 'rgba(0, 188, 212, 0.5)',
      '-webkit-transition': 'all .4s ease-in-out',
      transition: 'all .4s ease-in-out',
    }

    var timeLineInnerStyle =  {
      position: 'relative',
      top: 0,
      left: 0,
      width: 0,
      height: '20px',
      background: 'rgba(255, 67, 54, .7)',
      '-webkit-transition': 'all .2s ease-in-out',
      transition: 'all .2s ease-in-out',
    }
 
    var lineStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '20px',
      'z-index': 9999,
      'font-size': '10px',
    }

    var lineSpanStyle = {
      'box-sizing': 'border',
      display: 'inline-block',
      height: '20px',
      'border-right': '1px solid #fff',
      color: '#fff',
      'text-align': 'center',
      float: 'left',
      'box-sizing': 'border-box',
      overflow: 'hidden',
      opacity: 0.2,
    }

    var lineStepStyle = {
      display: 'inline-block',
      padding: '2px 5px',
      cursor: 'pointer',
    }
  
    var cells = Array(totalStep).fill(0).map((item, index) => (`
      <span class="time-step-progress" style="
        width: ${window.innerWidth / totalStep}px;
        ${styleObjToString(lineSpanStyle)};
        border-right-width: ${ perWidth < 1 ? 0 : 1};">
        <span class="time-step" key=${index + 1} style="${styleObjToString(lineStepStyle)}">${index + 1}</span>
      </span>`))

    var timeShaftTemplate = `
      <div class="time-line" style="${styleObjToString(timeLineStyle)}">
        <div class="time-line-inner" style="${styleObjToString(timeLineInnerStyle)}"></div>
        <div class="line" style="${styleObjToString(lineStyle)}">
          ${cells.join('')}
        </div>
      </div>
    `;

    // document.body.style = 'background: #f2f2f2;';
    document.body.innerHTML += timeShaftTemplate;

    return {
      init: function(step) {
        var width = step === totalStep ? '100%' : perWidth * step + 'px';
        var ele = document.querySelector('.time-line-inner')
        ele.style.width = width;
      },
      update: function() {},
      position: function() {},
    }
  }

  function TimeLine$1() {
    const nowTime = now();
    var state = {
      debug: true,
      auto: false,
      duration: 1000,
      speed: 1000,
      step: 0,
      stepTmp: 0,

      startTime: nowTime,
      endTime: nowTime + 10000,
      currentTime: nowTime,
      serverDiffTime: 0,
    }

    var speedStatus = function(type) {
      switch (type) {
        case 'normal':
          return 1000;
        case 'fast':
          return 200;
        case 'slow':
          return 2000;
        default:
          return 1000;
      }
    }

    /**
     * format action data
     */
    function formatActionData(data) {
      var actions = {};
      for (var key in data) {
        var tmp = data[key];
        if (isPlainObject(tmp)) {
          for (var step in tmp) {
            var stepValue = actions[step];
            if (stepValue && stepValue.indexOf(key) === -1) {
              stepValue.push(key);
            } else if (!stepValue) {
              stepValue = [key];
            }
            actions[step] = stepValue;
          }
        }
      }

      return actions;
    }

    /**
     * actions register
     */
    function registerActions(actions) {
      for (var key in actions) {
        if (isFunction(actions[key])) {
          registerAction([key, actions[key]], true);
        }
      }
    }

    var worker = null;
    var workerUrl = window.location.href.replace(Version + 'js', '')

    function startWorker() {
      worker = new Worker(workerUrl + 'workerScript.js');
      // 接收从线程中传出的计算结果
      worker.onmessage = function(event) {
        // console.log('worker-message', event.data);
        // 消息文本放置再data属性中，可以是任何js对象
        var params = JSON.parse(event.data);
        if (!params.end) {
          // console.log('worker线程返回的数据：', params, Actions);
          if (Actions[params.actionKey]) {
            Actions[params.actionKey](params.keyValue); 
          } else {
            console.error(params.actionKey, '不存在对应的action函数') 
          }
        } else {
          console.log(params.page + '~~~~结束');
        }
      }
      //错误信息事件
      worker.onerror = function(e){
        console.log('error: ' + e.message);
        //终止线程
        worker.terminate();
      };
    }

    return {
      init: function() {
        var me = this;
        me.pubsub = new PubSub();

        var params = cloneArray(arguments);
        if (!params[0]) {
          return '没有完整的配置文件'
        }

        this.config = _extends({}, state, params[0]);
        defineProperty(this.config, 'sourceData', this.config.data)
        var objByField = arrayToObjectByField(
          this.config.data,
          'eventType',
          this.config.startTime,
          this.config.duration,
        );
        defineProperty(this.config, 'data', objByField.data)
        defineProperty(this.config, 'startTime', objByField.interval[0])
        defineProperty(this.config, 'endTime', objByField.interval[1])
        this.initPage = params[2];
        var actionData = formatActionData(this.config.data);

        var totalStep = Math.floor((this.config.endTime - this.config.startTime) / this.config.duration || 1);
        var totalTime = formatTime(this.config.endTime - this.config.startTime);

        this.config = _extends({}, this.config, {
          totalStep: totalStep,
          totalTime: totalTime,
          actions: actionData,
        });

        console.log(this.config, '最终的config配置');
        registerActions(params[1])

        me.start();
      },

      start: function() {
        var me = this;

        startWorker();
        if (this.initPage) {
          this.initPage()
        }
        // console.log('worker', worker)
        if (this.config.debug) {
          console.log(this.config.totalStep, 'this.config.totalStep')
          this.timeShaft = timeShaft(this.config.totalStep);
          var eles = document.querySelectorAll('.time-step');
          if (eles && eles.length) {
            eles.forEach(function(item, index) {
              eles[index].onclick = function() {
                var key = this.getAttribute('key');
                me.handleClick(Number(key))
              };
            })
          }
        }

        me.newClearSetInterval(me.timer);
        me.createTimer();
      },

      handleClick: function(key) {
        var me = this;

        me.newClearSetInterval(me.timer);
        worker.terminate();
        startWorker();

        /******** 更新内部当前进度 *******/
        defineProperty(me.config, 'stepTmp', me.config.step)
        defineProperty(me.config, 'step', key)

        /******** 更新外部当前进度 *******/ 
        me.pubsub.emit('progress', JSON.stringify({
          currentTime: formatTime(me.config.step * me.config.duration),
          totalTime: me.config.totalTime,
        }));
       
        /******** 更新时间轴模板当前进度 *******/ 
        me.updateTime(function() {
          defineProperty(me.config, 'stepTmp', me.config.step) 
          me.createTimer()
        });
      },

      newClearSetInterval: function() {
        // console.log('new-clear-setInterval')
        newClearSetInterval(this.timer);
        this.timer = null;
      },

      createTimer: function() {
        var me = this;
       
        me.newClearSetInterval(me.timer);
        this.timer = newSetInterval(function() {
          // console.log('时间轴开始跑', me.config);
          /******** 更新内部当前进度 *******/
          defineProperty(me.config, 'stepTmp', me.config.stepTmp + 1)
          defineProperty(me.config, 'step', me.config.step + 1)
        
          /******** 更新时间轴模板当前进度 *******/
          me.updateTime();

          /******** 更新外部当前进度 *******/ 
          me.pubsub.emit('progress', JSON.stringify({
            currentTime: formatTime(me.config.step * me.config.duration),
            totalTime: me.config.totalTime,
          }));

          // 清除定时器的逻辑判断
          if (me.config.step >= me.config.totalStep) {
            me.newClearSetInterval(me.timer);
            me.timerEnd();
          }
        }, (speedStatus(me.config.speed)));
      },

      timerEnd: function() {
        var me = this;
        me.pubsub.emit('end');
        worker.terminate();
        defineProperty(me.config, 'status', 'end')
      },

      updateTime: function(callback) {
        var me = this;

        if (me.config.debug) {
          me.timeShaft.init(me.config.step);
        }

        var stepDiff = me.config.step - me.config.stepTmp;
        if (stepDiff > 0) {
          for (var i = me.config.stepTmp; i < me.config.step; i++) {
            if (me.config.actions[i]) {
              me.asyncActions(me.config.actions[i], i, me.config.data) 
            }
          }
        } else if (stepDiff < 0) {
          if (this.initPage) {
            this.initPage()
          }
          for (var i = 0; i < me.config.step; i++) {
            if (me.config.actions[i]) {
              me.asyncActions(me.config.actions[i], i, me.config.data)
            }
          }
        } else {
          if (me.config.actions[me.config.step]) {
            me.asyncActions(me.config.actions[me.config.step], me.config.step, me.config.data)
          }
        }

        if (isFunction(callback)) {
          callback();
        }
      },

      asyncActions: function(ary, step, data) {
        worker.postMessage({ ary, step, data });
      },

      pause: function() {
        var me = this;
        // stopWorker();
        worker.terminate();
        me.newClearSetInterval(me.timer);
        
        defineProperty(me.config, 'status', 'pause')
      },

      stop: function() {
        var me = this;
        worker.terminate();
        me.newClearSetInterval(me.timer);

        defineProperty(me.config, 'step', 0)
        defineProperty(me.config, 'stepTmp', 0)
        defineProperty(me.config, 'status', 'stop')
        if (this.initPage) {
          this.initPage()
        }

        me.updateTime();
      },

      play: function() {
        var me = this;
        me.newClearSetInterval(me.timer);

        startWorker();
        if (me.config.status === 'end') {
          defineProperty(me.config, 'step', 0)
          defineProperty(me.config, 'stepTmp', 0)
          me.updateTime(me.createTimer.bind(me));
        } else {
          me.createTimer();
        }
        defineProperty(me.config, 'status', 'play')
      },

      progress: function(callback) {
        var me = this;
        if (isFunction(callback)) {
          me.pubsub.on('progress', callback);
        }
      },

      complete: function(callback) {
        var me = this;
        if (isFunction(callback)) {
          me.pubsub.on('end', callback);
        }
      },

    }
  }

  var TimeLine$2 = TimeLine$1;

  return TimeLine$2;
}));

