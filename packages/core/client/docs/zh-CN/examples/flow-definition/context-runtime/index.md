# 上下文（运行时） - FlowRuntimeContext

`FlowRuntimeContext` 用于流运行时的上下文。在流执行时创建，流执行完毕之后销毁。上下文用于在流执行期间传递和管理数据，确保每次流运行时的数据隔离和安全。

## 以下流执行时会创建 FlowRuntimeContext

- `model.applyAutoFlows(inputArgs)`  
  自动执行所有属性流，`inputArgs` 为流输入参数。

- `model.dispatchEvent(eventName, inputArgs)`  
  触发指定事件，并传递参数。适用于事件驱动的流场景。

- `model.applyFlow(flowKey, inputArgs)`  
  执行指定的流，`flowKey` 为流标识，`inputArgs` 为输入参数。

## 示例代码

<code src="./index.tsx"></code>
