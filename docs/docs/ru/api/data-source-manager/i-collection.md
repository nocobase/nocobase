# ICollection - Интерфейс коллекции

`ICollection` — это интерфейс модели данных, который содержит информацию, такую как имя модели, поля и связи.

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

## Свойства

### repository

Экземпляр `Repository`, к которому принадлежит `ICollection`.

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

Возвращает все поля `Collection`.

#### Сигнатура

- `getFields(): Array<IField>`

### getField()

Возвращает поле `Collection` по его имени.

#### Сигнатура

- `getField(name: string): IField`