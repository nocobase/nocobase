# Персистентность FlowModel

Движок потоков предоставляет полноценную систему персистентности.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## Репозиторий FlowModel (`IFlowModelRepository`)

`IFlowModelRepository` — это интерфейс персистентности модели для движка потоков, который определяет операции удалённой загрузки, сохранения и удаления моделей. Реализация этого интерфейса позволяет сохранять данные модели в серверную базу, API или другое хранилище и синхронизировать данные между фронтендом и бэкендом.

### Основные методы

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Загружает данные модели из удаленного источника по уникальному идентификатору `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Сохраняет данные модели в удаленное хранилище.

- **destroy(uid: string): Promise<boolean\>**  
  Удаляет модель из удаленного хранилища по `uid`.

### Пример репозитория FlowModel (`FlowModelRepository`)

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Реализация: получение модели по uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Реализация: сохранение модели
    return model;
  }

  async destroy(uid: string) {
    // Реализация: удаление модели по uid
    return true;
  }
}
```

### Установка репозитория FlowModel (`FlowModelRepository`)

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Методы управления моделями в движке потоков

### Локальные методы

```ts
flowEngine.createModel(options); // Создать локальный экземпляр модели
flowEngine.getModel(uid);        // Получить локальный экземпляр модели
flowEngine.removeModel(uid);     // Удалить локальный экземпляр модели
```

### Удаленные методы (реализуются в ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Загрузить модель с удаленного источника
await flowEngine.saveModel(model);   // Сохранить модель в удаленный источник
await flowEngine.destroyModel(uid);  // Удалить модель в удаленном источнике
```

## Методы экземпляра модели

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Сохранить в удаленный источник
await model.destroy();  // Удалить из удаленного источника
```