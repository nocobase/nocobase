---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



pkg: "@nocobase/plugin-data-source-rest-api"
---
# מקור נתונים REST API

## מבוא

תוסף זה מאפשר לכם לחבר נתונים ממקורות REST API בצורה חלקה.

## התקנה

תוסף זה הוא תוסף מסחרי, ודורש העלאה והפעלה דרך מנהל התוספים.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## הוספת מקור נתונים REST API

לאחר הפעלת התוסף, תוכלו להוסיף מקור נתונים REST API על ידי בחירה בו מתוך תפריט "הוסף חדש" (Add new) בניהול מקורות הנתונים.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

הגדירו את מקור הנתונים REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## הוספת אוסף

ב-NocoBase, משאב RESTful ממופה ל-Collection (אוסף), לדוגמה, משאב Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

נקודות קצה אלו של ה-API ממופות ב-NocoBase באופן הבא:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

למדריך מקיף על מפרטי עיצוב ה-API של NocoBase, עיינו בתיעוד ה-API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

עיינו בפרק "NocoBase API - Core" למידע מפורט.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

הגדרות ה-Collection עבור מקור נתונים REST API כוללות את הדברים הבאים:

### List

מפו את הממשק לצפייה ברשימת אוספים.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

מפו את הממשק לצפייה בפרטי אוסף.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

מפו את הממשק ליצירת אוסף.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

מפו את הממשק לעדכון אוסף.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

מפו את הממשק למחיקת אוסף.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

יש להגדיר את ממשקי ה-List וה-Get באופן חובה.

## איתור באגים ב-API

### שילוב פרמטרי בקשה

דוגמה: הגדירו פרמטרי חלוקה לעמודים עבור ה-API של List. אם ה-API של צד שלישי אינו תומך בחלוקה לעמודים באופן טבעי, NocoBase יחלק לעמודים על בסיס נתוני הרשימה שאוחזרו.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

שימו לב, רק משתנים שנוספו בממשק ייכנסו לתוקף.

| שם פרמטר API של צד שלישי | פרמטרי NocoBase             |
| --------------------------- | --------------------------- |
| page                        | {{request.params.page}}     |
| limit                       | {{request.params.pageSize}} |

תוכלו ללחוץ על Try it out כדי לבצע איתור באגים ולצפות בתגובה.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### המרת פורמט תגובה

פורמט התגובה של ה-API של צד שלישי עשוי שלא להיות בסטנדרט של NocoBase, ויש להמיר אותו לפני שיוצג כראוי בממשק המשתמש.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

התאימו את כללי ההמרה בהתאם לפורמט התגובה של ה-API של צד שלישי, כדי להבטיח שהפלט תואם לסטנדרט של NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

תיאור תהליך איתור הבאגים

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## משתנים

מקור הנתונים REST API תומך בשלושה סוגי משתנים לשילוב API:

- משתני מקור נתונים מותאמים אישית
- משתני בקשת NocoBase
- משתני תגובה של צד שלישי

### משתני מקור נתונים מותאמים אישית

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### בקשת NocoBase

- **Params**: פרמטרי שאילתת URL (Search Params), המשתנים בהתאם לממשק.
- **Headers**: כותרות בקשה מותאמות אישית, המספקות בעיקר מידע X- ספציפי מ-NocoBase.
- **Body**: גוף הבקשה.
- **Token**: אסימון ה-API עבור בקשת NocoBase הנוכחית.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### תגובות של צד שלישי

נכון לעכשיו, רק גוף התגובה זמין.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

להלן המשתנים הזמינים עבור כל ממשק:

### List

| פרמטר                   | תיאור                                                |
| ----------------------- | ---------------------------------------------------------- |
| `request.params.page`     | עמוד נוכחי                                     |
| `request.params.pageSize` | מספר פריטים לעמוד                                   |
| `request.params.filter`   | קריטריוני סינון (חייבים לעמוד בפורמט Filter של NocoBase) |
| `request.params.sort`     | קריטריוני מיון (חייבים לעמוד בפורמט Sort של NocoBase)   |
| `request.params.appends`  | שדות לטעינה לפי דרישה, בדרך כלל עבור שדות אסוציאטיביים |
| `request.params.fields`   | שדות לכלול (רשימה לבנה)                 |
| `request.params.except`   | שדות להוציא (רשימה שחורה)                       |

### Get

| פרמטר                     | תיאור                                                |
| ------------------------- | ---------------------------------------------------------- |
| `request.params.filterByTk` | חובה, בדרך כלל מזהה הרשומה הנוכחית                  |
| `request.params.filter`     | קריטריוני סינון (חייבים לעמוד בפורמט Filter של NocoBase) |
| `request.params.appends`    | שדות לטעינה לפי דרישה, בדרך כלל עבור שדות אסוציאטיביים |
| `request.params.fields`     | שדות לכלול (רשימה לבנה)                 |
| `request.params.except`     | שדות להוציא (רשימה שחורה)                       |

### Create

| פרמטר                     | תיאור             |
| ------------------------ | ---------------- |
| `request.params.whiteList` | רשימה לבנה           |
| `request.params.blacklist` | רשימה שחורה           |
| `request.body`             | נתונים ראשוניים ליצירה |

### Update

| פרמטר                     | תיאור                                        |
| ------------------------- | -------------------------------------------------- |
| `request.params.filterByTk` | חובה, בדרך כלל מזהה הרשומה הנוכחית          |
| `request.params.filter`     | קריטריוני סינון (חייבים לעמוד בפורמט Filter של NocoBase) |
| `request.params.whiteList`  | רשימה לבנה                                          |
| `request.params.blacklist`  | רשימה שחורה                                          |
| `request.body`              | נתונים לעדכון                                   |

### Destroy

| פרמטר                     | תיאור                                        |
| ------------------------- | -------------------------------------------------- |
| `request.params.filterByTk` | חובה, בדרך כלל מזהה הרשומה הנוכחית          |
| `request.params.filter`     | קריטריוני סינון (חייבים לעמוד בפורמט Filter של NocoBase) |

## הגדרת שדות

מטא-נתונים של שדות (Fields) נשלפים מנתוני ממשק ה-CRUD של המשאב המותאם, כדי לשמש כשדות של ה-Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

שליפת מטא-נתונים של שדות.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

שדות ותצוגה מקדימה.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

עריכת שדות (בדומה למקורות נתונים אחרים).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## הוספת בלוקים של מקור נתונים REST API

לאחר שה-Collection הוגדר, תוכלו להוסיף בלוקים לממשק.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)