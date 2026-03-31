:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# DataSourceManager

`DataSourceManager` — это класс для управления несколькими экземплярами `dataSource`.

## API

### add()
Добавляет экземпляр `dataSource`.

#### Подпись

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Добавляет глобальное промежуточное ПО (middleware) к экземпляру `dataSource`.

### middleware()

Получает промежуточное ПО (middleware) текущего экземпляра `dataSourceManager`, которое можно использовать для обработки HTTP-запросов.

### afterAddDataSource()

Функция-хук, которая вызывается после добавления нового `dataSource`.

#### Подпись

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Регистрирует тип источника данных и его класс.

#### Подпись

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Получает класс источника данных.

#### Подпись

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Создает экземпляр источника данных на основе зарегистрированного типа источника данных и параметров экземпляра.

#### Подпись

- `buildDataSourceByType(type: string, options: any): DataSource`