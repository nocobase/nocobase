# FAQs

## 为什么流注册 `registerFlow()` 是在 Model 类上，而不是由 engine 管理

示例：

```ts
MyModel.registerFlow({
  key,
  on,
  steps: {},
});
```

对比：

```ts
engine.registerFlow({
  key,
  modelClass,
  on,
  steps: {},
});
```

原因：

1. **流作用于具体的 Model**  
   所有的流最终都是通过 `model.dispatchEvent()` 或 `model.applyFlow()` 触发执行的，因此将流注册在 Model 上更加直观。
2. **方便管理与维护**  
   在 Model 上注册可以集中管理该 Model 的所有流，包括注册、查询和移除，避免引擎层面的全局混乱。
3. **作用域明确且符合使用场景**  
   注册在某个 Model 上的流只会影响该 Model 类实例，大部分情况，流都是按 Model 类或具体实例划分的，因此在 Model 上注册更加合理。
4. **类继承的优势**  
   在父类 Model 上注册流时，子类实例会自动继承这些流，避免重复注册，同时子类也可以自由扩展自己的流。  
   相比 engine 需要传入 modelClass 的方式，Model 继承的方式更自然、更可靠，也更符合面向对象的设计理念。

## 为什么 `dispatchEvent()` 和 `applyFlow()` 是在 Model 上，而不是由 Engine 提供

示例：

```ts
model.dispatchEvent('click', inputArgs);
model.applyFlow('flowKey', inputArgs);
```

对比：

```ts
engine.dispatchEvent('click', model, inputArgs);
engine.applyFlow('flowKey', model, inputArgs);
```

原因：

1. **流的执行（触发）依赖具体 Model 实例**  
   流的触发总是在某个 Model 实例的上下文中进行，执行逻辑可能需要访问或修改该 model 实例的状态。
2. **职责更清晰**  
   每个 Model 类自己管理自己的 `dispatchEvent` 和 `applyFlow`，避免全局耦合和干扰，让责任归属明确。  
   即使事件名相同，不同 Model 的逻辑可能完全不同。放在 Model 上可以确保事件触发的行为与具体 Model 对应，避免混淆和冲突。
