:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# DataSource (מופשט)

`DataSource` הוא מחלקה מופשטת המשמשת לייצוג סוג של מקור נתונים, שיכול להיות מסד נתונים, API וכדומה.

## מאפיינים

### collectionManager

מופע ה-`CollectionManager` של מקור הנתונים, שחייב ליישם את ממשק [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

מופע ה-`resourceManager` של מקור הנתונים.

### acl

מופע ה-ACL של מקור הנתונים.

## API

### constructor()

פונקציית הבנאי, יוצרת מופע `DataSource`.

#### חתימה

- `constructor(options: DataSourceOptions)`

### init()

פונקציית אתחול, הנקראת מיד לאחר ה-`constructor`.

#### חתימה

- `init(options: DataSourceOptions)`

### name

#### חתימה

- `get name()`

מחזירה את שם המופע של מקור הנתונים.

### middleware()

מקבלת את ה-middleware עבור ה-`DataSource`, המשמש להרכבה על ה-Server לקבלת בקשות.

### testConnection()

שיטה סטטית הנקראת במהלך פעולת בדיקת החיבור. היא יכולה לשמש לאימות פרמטרים, והלוגיקה הספציפית מיושמת על ידי מחלקת המשנה.

#### חתימה

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### חתימה

- `async load(options: any = {})`

פעולת הטעינה של מקור הנתונים. הלוגיקה מיושמת על ידי מחלקת המשנה.

### createCollectionManager()

#### חתימה
- `abstract createCollectionManager(options?: any): ICollectionManager`

יוצרת מופע `CollectionManager` עבור מקור הנתונים. הלוגיקה מיושמת על ידי מחלקת המשנה.

### createResourceManager()

יוצרת מופע `ResourceManager` עבור מקור הנתונים. מחלקות משנה יכולות לדרוס את היישום. כברירת מחדל, היא יוצרת את ה-`ResourceManager` מתוך `@nocobase/resourcer`.

### createACL()

- יוצרת מופע ACL עבור ה-`DataSource`. מחלקות משנה יכולות לדרוס את היישום. כברירת מחדל, היא יוצרת את ה-`ACL` מתוך `@nocobase/acl`.