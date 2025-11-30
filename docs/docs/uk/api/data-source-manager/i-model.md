# IModel

Інтерфейс `IModel` визначає основні властивості та методи об'єкта моделі.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

Перетворює об'єкт моделі у формат JSON.