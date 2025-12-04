:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# IModel

Gränssnittet `IModel` definierar ett modellobjekts grundläggande egenskaper och metoder.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Konverterar modellobjektet till JSON-format.