:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# ICollection

`ICollection` — це інтерфейс для моделі даних, який містить таку інформацію, як назва моделі, її поля та асоціації.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## Члени

### repository

Екземпляр `Repository`, до якого належить `ICollection`.

## API

### updateOptions()

Оновлює властивості колекції.

#### Підпис

- `updateOptions(options: any): void`

### setField()

Встановлює поле для колекції.

#### Підпис

- `setField(name: string, options: any): IField`

### removeField()

Видаляє поле з колекції.

#### Підпис

- `removeField(name: string): void`

### getFields()

Отримує всі поля колекції.

#### Підпис

- `getFields(): Array<IField>`

### getField()

Отримує поле колекції за назвою.

#### Підпис

- `getField(name: string): IField`