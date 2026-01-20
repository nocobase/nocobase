:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Персистентность FlowModel

FlowEngine предоставляет полноценную систему персистентности.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` — это интерфейс персистентности моделей для FlowEngine, который определяет такие операции, как удаленная загрузка, сохранение и удаление моделей. Реализовав этот интерфейс, вы сможете сохранять данные модели в серверной базе данных, API или других хранилищах данных, что позволяет обеспечить синхронизацию данных между фронтендом и бэкендом.

### Основные методы

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Загружает данные модели из удаленного источника по уникальному идентификатору `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Сохраняет данные модели в удаленное хранилище.

- **destroy(uid: string): Promise<boolean\>**  
  Удаляет модель из удаленного хранилища по `uid`.

### Пример FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Реализация: Получить модель по uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Реализация: Сохранить модель
    return model;
  }

  async destroy(uid: string) {
    // Реализация: Удалить модель по uid
    return true;
  }
}
```

### Установка FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Методы управления моделями, предоставляемые FlowEngine

### Локальные методы

```ts
flowEngine.createModel(options); // Создает локальный экземпляр модели
flowEngine.getModel(uid);        // Получает локальный экземпляр модели
flowEngine.removeModel(uid);     // Удаляет локальный экземпляр модели
```

### Удаленные методы (реализуемые ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Загружает модель из удаленного источника
await flowEngine.saveModel(model);   // Сохраняет модель в удаленное хранилище
await flowEngine.destroyModel(uid);  // Удаляет модель из удаленного хранилища
```

## Методы экземпляра модели

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Сохраняет в удаленное хранилище
await model.destroy();  // Удаляет из удаленного хранилища
```