# StepDefinition

Types

```ts
interface FlowDefinition {
  steps: Record<StepKey, StepDefinition>;
}
```

示例

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  steps: {
    step1: {},
  },
});
```

## title
## use
## sort
## defaultParams
## handler
## uiSchema
## beforeParamsSave
## afterParamsSave
## uiMode
## preset
## hideInSettings
