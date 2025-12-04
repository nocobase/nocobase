:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# בדיקות

NocoBase מציעה סט שלם של כלי בדיקה, המסייעים למפתחים לאמת במהירות את נכונות לוגיקת מסד הנתונים, ממשקי ה-API ומימושי הפונקציונליות במהלך פיתוח תוספים. מדריך זה יציג כיצד לכתוב, להריץ ולארגן בדיקות אלו.

## למה לכתוב בדיקות?

היתרונות של כתיבת בדיקות אוטומטיות בפיתוח תוספים:

- אימות מהיר של נכונות מודלי מסד הנתונים, ממשקי ה-API והלוגיקה העסקית.
- מניעת שגיאות רגרסיה (זיהוי אוטומטי של תאימות תוספים לאחר שדרוגי ליבה).
- תמיכה בהרצת בדיקות אוטומטית בסביבות אינטגרציה רציפה (CI).
- תמיכה בבדיקת פונקציונליות של תוספים מבלי להפעיל את השירות המלא.

## יסודות סביבת הבדיקה

NocoBase מספקת שני כלי בדיקה מרכזיים:

| כלי | תיאור | מטרה |
|---|---|---|
| `createMockDatabase` | יצירת מופע מסד נתונים בזיכרון | בדיקת מודלי מסד נתונים ולוגיקה |
| `createMockServer` | יצירת מופע יישום מלא (כולל מסד נתונים, תוספים, ממשקי API ועוד) | בדיקת תהליכים עסקיים והתנהגות ממשקים |

## שימוש ב-`createMockDatabase` לבדיקות מסד נתונים

`createMockDatabase` מתאים לבדיקת פונקציונליות הקשורה ישירות למסדי נתונים, כגון הגדרות מודלים, סוגי שדות, יחסים, פעולות CRUD ועוד.

### דוגמה בסיסית

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### בדיקת פעולות CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### בדיקת אסוציאציות מודלים

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## שימוש ב-`createMockServer` לבדיקות API

`createMockServer` יוצר באופן אוטומטי מופע יישום שלם הכולל מסד נתונים, תוספים וניתוב API, מה שהופך אותו לאידיאלי לבדיקת ממשקי תוספים.

### דוגמה בסיסית

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### בדיקת שאילתות ועדכונים של ממשקי API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### דימוי מצב התחברות או בדיקת הרשאות

באפשרותכם להפעיל את תוסף ה-`auth` בעת יצירת `MockServer`, ולאחר מכן להשתמש בממשק ההתחברות כדי לקבל token או session:

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

ניתן גם להשתמש במתודת `login()` הפשוטה יותר:

```ts
await app.agent().login(userOrId);
```

## ארגון קבצי בדיקה בתוספים

מומלץ לאחסן קבצי בדיקה הקשורים ללוגיקת צד-שרת בתיקיית `./src/server/__tests__` של התוסף.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Source code directory
│   └── server/              # Server-side code
│       ├── __tests__/       # Test files directory
│       │   ├── db.test.ts   # Database related tests (using createMockDatabase)
│       │   └── api.test.ts  # API related tests
```

## הרצת בדיקות

```bash
# Specify directory
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Specify file
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```