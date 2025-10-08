# ActionDefinition

Types

```ts
class FlowEngine {
  registerAction(options: ActionDefinition);
}
class FlowModel {
  static registerAction(options: ActionDefinition);
}
```

示例

```ts
engine.registerAction();
class MyModel extends FlowModel {}
MyModel.registerAction();
MyModel.registerFlow({
  steps: {
    step1: {
      use: 'actionName',
    },
  },
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
