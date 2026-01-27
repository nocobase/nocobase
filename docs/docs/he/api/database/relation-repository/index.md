:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# RelationRepository

`RelationRepository` הוא אובייקט `Repository` עבור סוגי קשרים. `RelationRepository` מאפשר לבצע פעולות על נתונים מקושרים מבלי לטעון את הקשר עצמו. בהתבסס על `RelationRepository`, כל סוג קשר גוזר מימוש מתאים:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## בנאי

**חתימה**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**פרמטרים**

| שם הפרמטר          | טיפוס              | ערך ברירת מחדל | תיאור                                              |
| :----------------- | :----------------- | :------------- | :------------------------------------------------- |
| `sourceCollection` | `Collection`       | -              | ה`אוסף` המתאים לקשר המפנה (referencing relation) בקשר |
| `association`      | `string`           | -              | שם הקשר                                            |
| `sourceKeyValue`   | `string \| number` | -              | ערך המפתח המתאים בקשר המפנה                       |

## מאפייני מחלקת בסיס

### `db: Database`

אובייקט מסד נתונים

### `sourceCollection`

ה`אוסף` המתאים לקשר המפנה (referencing relation) בקשר

### `targetCollection`

ה`אוסף` המתאים לקשר המופנה (referenced relation) בקשר

### `association`

אובייקט הקשר ב-`sequelize` המתאים לקשר הנוכחי

### `associationField`

השדה ב`אוסף` המתאים לקשר הנוכחי

### `sourceKeyValue`

ערך המפתח המתאים בקשר המפנה