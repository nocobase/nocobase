:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# שימוש במפתחות API ב-NocoBase

מדריך זה מדגים, באמצעות דוגמה מעשית של 'משימות לביצוע' (To-Dos), כיצד להשתמש במפתחות API ב-NocoBase כדי לאחזר נתונים. עקבו אחר ההוראות המפורטות להלן כדי להבין את תהליך העבודה המלא.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1. הבנת מפתחות API

מפתח API הוא אסימון אבטחה המשמש לאימות בקשות API ממשתמשים מורשים. הוא מתפקד כאישור המאמת את זהות המבקש בעת גישה למערכת NocoBase דרך יישומי ווב, אפליקציות מובייל או סקריפטים בצד השרת (backend).

בכותרת בקשת ה-HTTP, הפורמט הוא:

```txt
Authorization: Bearer {API 密钥}
```

הקידומת "Bearer" מציינת כי המחרוזת הבאה היא מפתח API מאומת המשמש לאימות ההרשאות של המבקש.

### תרחישי שימוש נפוצים

מפתחות API משמשים בדרך כלל בתרחישים הבאים:

1.  **גישה מיישומי לקוח (Client Applications):** דפדפני אינטרנט ואפליקציות מובייל משתמשים במפתחות API כדי לאמת את זהות המשתמש, ובכך לוודא שרק משתמשים מורשים יכולים לגשת לנתונים.
2.  **ביצוע משימות אוטומטיות:** תהליכי רקע ומשימות מתוזמנות משתמשים במפתחות API כדי לבצע באופן מאובטח עדכונים, סנכרון נתונים ופעולות רישום (logging).
3.  **פיתוח ובדיקות:** מפתחים משתמשים במפתחות API במהלך ניפוי באגים ובדיקות כדי לדמות בקשות מאומתות ולאמת תגובות API.

מפתחות API מספקים יתרונות אבטחה מרובים: אימות זהות, ניטור שימוש, הגבלת קצב בקשות (rate limiting) ומניעת איומים, המבטיחים פעולה יציבה ומאובטחת של NocoBase.

## 2. יצירת מפתחות API ב-NocoBase

### 2.1 הפעלת ה-תוסף 'אימות: מפתחות API'

ודאו שה-תוסף המובנה [אימות: מפתחות API](/plugins/@nocobase/plugin-api-keys/) מופעל. לאחר ההפעלה, יופיע דף תצורת מפתחות API חדש בהגדרות המערכת.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 יצירת אוסף בדיקה

לצורך הדגמה, צרו אוסף בשם `todos` עם השדות הבאים:

-   `id`
-   `כותרת (title)`
-   `הושלם (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

הוסיפו כמה רשומות לדוגמה ל-אוסף:

-   לאכול
-   לישון
-   לשחק

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 יצירה והקצאת תפקיד

מפתחות API קשורים לתפקידי משתמשים, והמערכת קובעת את הרשאות הבקשה בהתבסס על התפקיד שהוקצה. לפני יצירת מפתח API, עליכם ליצור תפקיד ולהגדיר את ההרשאות המתאימות. צרו תפקיד בשם "תפקיד API למשימות" והעניקו לו גישה מלאה ל-אוסף `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

אם "תפקיד API למשימות" אינו זמין בעת יצירת מפתח API, ודאו שהמשתמש הנוכחי הוקצה לתפקיד זה:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

לאחר הקצאת התפקיד, רעננו את הדף ונווטו לדף ניהול מפתחות API. לחצו על "הוסף מפתח API" כדי לוודא ש"תפקיד API למשימות" מופיע בבחירת התפקידים.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

לשליטה טובה יותר בגישה, שקלו ליצור חשבון משתמש ייעודי (לדוגמה, "משתמש API למשימות") במיוחד לניהול ובדיקת מפתחות API. הקצו את "תפקיד API למשימות" למשתמש זה.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 יצירה ושמירה של מפתח ה-API

לאחר שליחת הטופס, המערכת תציג הודעת אישור ואת מפתח ה-API שנוצר. **חשוב**: העתיקו ואחסנו את המפתח הזה באופן מאובטח מיד, מכיוון שהוא לא יוצג שוב מסיבות אבטחה.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

דוגמת מפתח API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg4NjU4MH0.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 הערות חשובות

-   תקופת התוקף של מפתח ה-API נקבעת על ידי הגדרת התפוגה שהוגדרה בעת יצירתו.
-   יצירה ואימות של מפתחות API תלויים במשתנה הסביבה `APP_KEY`. **אל תשנו משתנה זה**, שכן פעולה זו תבטל את כל מפתחות ה-API הקיימים במערכת.

## 3. בדיקת אימות מפתח API

### 3.1 שימוש ב-תוסף תיעוד API

פתחו את ה-תוסף [תיעוד API](/plugins/@nocobase/plugin-api-doc/) כדי לצפות בשיטות הבקשה, כתובות ה-URL, הפרמטרים וכותרות הבקשה עבור כל נקודת קצה של API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 הבנת פעולות CRUD בסיסיות

NocoBase מספקת ממשקי API סטנדרטיים של CRUD (יצירה, קריאה, עדכון, מחיקה) לטיפול בנתונים:

-   **שאילתת רשימה (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Request Header:
    - Authorization: Bearer <API key>

    ```
-   **יצירת רשומה (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Request Header:
    - Authorization: Bearer <API key>

    Request Body (in JSON format), for example:
        {
            "title": "123"
        }
    ```
-   **עדכון רשומה (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Request Header:
    - Authorization: Bearer <API key>

    Request Body (in JSON format), for example:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **מחיקת רשומה (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Request Header:
    - Authorization: Bearer <API key>
    ```

כאשר:
-   `{baseURL}`: כתובת ה-URL של מערכת NocoBase שלכם
-   `{collectionName}`: שם ה-אוסף

דוגמה: עבור מופע מקומי ב-`localhost:13000`, עם אוסף בשם `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 בדיקה באמצעות Postman

צרו בקשת GET ב-Postman עם התצורה הבאה:
-   **URL**: נקודת הקצה של הבקשה (לדוגמה, `http://localhost:13000/api/todos:list`)
-   **Headers**: הוסיפו את כותרת הבקשה `Authorization` עם הערך:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg4NjU4MH0.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**תגובה מוצלחת:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**תגובת שגיאה (מפתח API לא חוקי/פג תוקף):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**פתרון בעיות**: אם האימות נכשל, ודאו את הרשאות התפקיד, קישור מפתח ה-API ופורמט האסימון.

### 3.4 ייצוא קוד הבקשה

Postman מאפשר לייצא את הבקשה בפורמטים שונים. דוגמת פקודת cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg4NjU4MH0.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4. שימוש במפתחות API בבלוק JS

NocoBase 2.0 תומך בכתיבת קוד JavaScript טבעי ישירות בדפים באמצעות בלוקי JS. דוגמה זו מדגימה כיצד לאחזר נתוני API חיצוניים באמצעות מפתחות API.

### יצירת בלוק JS

בדף NocoBase שלכם, הוסיפו בלוק JS והשתמשו בקוד הבא כדי לאחזר נתוני משימות לביצוע:

```javascript
// אחזור נתוני משימות לביצוע באמצעות מפתח API
async function fetchTodos() {
  try {
    // הצגת הודעת טעינה
    ctx.message.loading('正在获取数据...');

    // טעינת ספריית axios לבקשות HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('加载 HTTP 库失败');
      return;
    }

    // מפתח API (החליפו במפתח ה-API האמיתי שלכם)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg4NjU4MH0.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // ביצוע בקשת API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // הצגת תוצאות
    console.log('待办事项列表:', response.data);
    ctx.message.success(`成功获取 ${response.data.data.length} 条数据`);

    // כאן תוכלו לעבד את הנתונים
    // לדוגמה: להציג בטבלה, לעדכן שדות טופס וכו'.

  } catch (error) {
    console.error('获取数据出错:', error);
    ctx.message.error('获取数据失败: ' + error.message);
  }
}

// הפעלת הפונקציה
fetchTodos();
```

### נקודות מפתח

-   **ctx.requireAsync()**: טוען באופן דינמי ספריות חיצוניות (כמו axios) עבור בקשות HTTP.
-   **ctx.message**: מציג הודעות למשתמש (טעינה, הצלחה, הודעות שגיאה).
-   **אימות מפתח API**: העבירו את מפתח ה-API בכותרת הבקשה `Authorization` עם הקידומת `Bearer`.
-   **טיפול בתגובה**: עבדו את הנתונים המוחזרים לפי הצורך (הצגה, המרה וכו').

## 5. סיכום

מדריך זה כיסה את תהליך העבודה המלא לשימוש במפתחות API ב-NocoBase:

1.  **הגדרה**: הפעלת תוסף מפתחות API ויצירת אוסף בדיקה.
2.  **תצורה**: יצירת תפקידים עם הרשאות מתאימות ויצירת מפתחות API.
3.  **בדיקה**: אימות אימות מפתח API באמצעות Postman ותוסף תיעוד API.
4.  **שילוב**: שימוש במפתחות API בבלוקי JS.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**משאבים נוספים:**
-   [תיעוד תוסף מפתחות API](/plugins/@nocobase/plugin-api-keys/)
-   [תוסף תיעוד API](/plugins/@nocobase/plugin-api-doc/)