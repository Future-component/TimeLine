# TimeLine(时间轴插件)
> 应用场景，直播回放的处理

### 设计架构图全览
![](./assets/live-classroom.png)

### 截屏

### 解决的问题
* 1.和时间本身无关，就是要相互同步执行；
* 2.如果有一个模块慢了，其他模块需要进行自动对齐
* 3.如果有一个模块快了，自己需要慢下来（以慢的为基准）
* 4.如何实现链式播放
* 5.如何处理时间差
* 6.加入webWorker方式同一时间事件太多卡死页面
* 7.支持监听progress
* 8.数据为数组对象
* {
*   eventType: 'ppt',
*   startTime: (new Date()).getTime()
*   data: "{ title: '1' }"
* }
* 9.如何实现快放

### Example

### AIP

函数名 | 参数 | 含义 |
:----|:---|:----
init | {options<Object>, actions<Object-Func>, initPage<Func>} | 初始化时间轴，以及事件在时间轴上的对齐 |
progress | <Func> | 时间轴的当前进度 |
pause | Empty | 暂停时间轴播放 |
stop | Empty | 停止时间轴播放，播放状态回到起点位置 |
play | Empty | 继续播放 |
complete | <Func> | 时间轴完成的回调 |

### TODO
* 资源加载慢的优化问题
* 大数据量的同步问题
* 数据量大时的快放问题



