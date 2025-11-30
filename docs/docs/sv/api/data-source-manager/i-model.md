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