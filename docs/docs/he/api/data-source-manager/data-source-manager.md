:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# DataSourceManager

`DataSourceManager` היא מחלקת הניהול עבור מופעי `dataSource` מרובים.

## API

### add()
מוסיף מופע `dataSource`.

#### חתימה

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

מוסיף middleware גלובלי למופע ה-`dataSource`.

### middleware()

מקבל את ה-middleware של מופע ה-`dataSourceManager` הנוכחי, אשר יכול לשמש למענה לבקשות HTTP.

### afterAddDataSource()

פונקציית וו (hook function) הנקראת לאחר הוספת `dataSource` חדש.

#### חתימה

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

רושם סוג של מקור נתונים ואת המחלקה שלו.

#### חתימה

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

מקבל את מחלקת מקור הנתונים.

#### חתימה

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

יוצר מופע של מקור נתונים בהתבסס על סוג מקור הנתונים הרשום ואפשרויות המופע.

#### חתימה

- `buildDataSourceByType(type: string, options: any): DataSource`