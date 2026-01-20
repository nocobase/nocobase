:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Персистентність FlowModel

`FlowEngine` надає повну систему персистентності.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository

`IFlowModelRepository` — це інтерфейс персистентності моделей для `FlowEngine`, який визначає такі операції, як віддалене завантаження, збереження та видалення моделей. Реалізувавши цей інтерфейс, ви можете зберігати дані моделі в базі даних бекенду, API або інших носіях, забезпечуючи синхронізацію даних між фронтендом і бекендом.

### Основні методи

- **findOne(query: Query): Promise<FlowModel \| null>**  
  Завантажує дані моделі з віддаленого джерела на основі унікального ідентифікатора `uid`.

- **save(model: FlowModel): Promise<any\>**  
  Зберігає дані моделі у віддаленому сховищі.

- **destroy(uid: string): Promise<boolean\>**  
  Видаляє модель з віддаленого сховища на основі `uid`.

### Приклад FlowModelRepository

```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // Реалізація: Отримати модель за uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // Реалізація: Зберегти модель
    return model;
  }

  async destroy(uid: string) {
    // Реалізація: Видалити модель за uid
    return true;
  }
}
```

### Налаштування FlowModelRepository

```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## Методи керування моделями, що надаються FlowEngine

### Локальні методи

```ts
flowEngine.createModel(options); // Створити локальний екземпляр моделі
flowEngine.getModel(uid);        // Отримати локальний екземпляр моделі
flowEngine.removeModel(uid);     // Видалити локальний екземпляр моделі
```

### Віддалені методи (реалізовані ModelRepository)

```ts
await flowEngine.loadModel(uid);     // Завантажити модель з віддаленого джерела
await flowEngine.saveModel(model);   // Зберегти модель у віддаленому сховищі
await flowEngine.destroyModel(uid);  // Видалити модель з віддаленого сховища
```

## Методи екземпляра моделі

```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // Зберегти у віддаленому сховищі
await model.destroy();  // Видалити з віддаленого сховища
```