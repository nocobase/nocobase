# DataSourceManager - Менеджер источников данных

`DataSourceManager` — это класс управления несколькими экземплярами `dataSource`.

## API

### add()
Добавляет экземпляр `dataSource`.

#### Сигнатура

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Добавляет глобальное middleware в экземпляр `dataSource`.

### middleware()

Возвращает middleware текущего экземпляра `dataSourceManager`, которое может использоваться для обработки HTTP-запросов.

### afterAddDataSource()

Хук-функция, которая вызывается после добавления нового `dataSource`.

#### Сигнатура

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Регистрирует тип источника данных и его класс.

#### Сигнатура

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Возвращает класс источника данных.

#### Сигнатура

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Создает экземпляр источника данных на основе зарегистрированного типа источника данных и параметров экземпляра.

#### Сигнатура

- `buildDataSourceByType(type: string, options: any): DataSource`