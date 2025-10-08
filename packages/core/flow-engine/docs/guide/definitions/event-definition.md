# EventDefinition

Types

```ts
class FlowEngine {
  registerEvent(options: EventDefinition);
}
class FlowModel {
  static registerEvent(options: EventDefinition);
}
```

示例

```ts
engine.registerEvent();
class MyModel extends FlowModel {}
MyModel.registerEvent();
MyModel.registerFlow({
  on: 'eventName',
});
```

## name
## title
## defaultParams
## handler
## uiSchema
## beforeParamsSave
## afterParamsSave
## uiMode
