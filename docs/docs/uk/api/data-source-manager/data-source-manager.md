:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# DataSourceManager

`DataSourceManager` — це клас для керування кількома екземплярами `dataSource`.

## API

### add()
Додає екземпляр `dataSource`.

#### Підпис

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Додає глобальне проміжне ПЗ (middleware) до екземпляра `dataSource`.

### middleware()

Отримує проміжне ПЗ (middleware) поточного екземпляра `dataSourceManager`, яке можна використовувати для обробки HTTP-запитів.

### afterAddDataSource()

Функція-хук, яка викликається після додавання нового `dataSource`.

#### Підпис

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Реєструє тип джерела даних та його клас.

#### Підпис

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Отримує клас джерела даних.

#### Підпис

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Створює екземпляр джерела даних на основі зареєстрованого типу джерела даних та параметрів екземпляра.

#### Підпис

- `buildDataSourceByType(type: string, options: any): DataSource`