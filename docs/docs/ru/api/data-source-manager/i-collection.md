:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# ICollection

`ICollection` — это интерфейс для модели данных, который содержит такую информацию, как имя модели, её поля и связи.

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

## Члены

### repository

Экземпляр `Repository`, которому принадлежит `ICollection`.

## API

### updateOptions()

Обновляет свойства `Collection`.

#### Сигнатура

- `updateOptions(options: any): void`

### setField()

Устанавливает поле для `Collection`.

#### Сигнатура

- `setField(name: string, options: any): IField`

### removeField()

Удаляет поле из `Collection`.

#### Сигнатура

- `removeField(name: string): void`

### getFields()

Получает все поля `Collection`.

#### Сигнатура

- `getFields(): Array<IField>`

### getField()

Получает поле `Collection` по его имени.

#### Сигнатура

- `getField(name: string): IField`