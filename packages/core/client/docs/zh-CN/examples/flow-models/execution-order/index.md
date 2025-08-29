# Flow 执行顺序（开始/完成）观察

该示例通过自定义 TestModel 注册一个 `on: 'click'` 的 Flow，创建 10 个模型实例，分别以并发（forEach）与串行（await）两种方式触发，展示：
- 触发顺序
- handler 开始执行顺序
- handler 完成顺序

引擎内部采用事件级 FIFO 开始顺序控制，确保“开始顺序与触发顺序一致”（完成顺序不保证一致）。

<code src="./index.tsx"></code>
