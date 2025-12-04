:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# פיתוח תוספים

## רקע

בסביבת צומת יחיד, תוספים יכולים בדרך כלל למלא דרישות באמצעות מצב בתוך התהליך, אירועים או משימות. עם זאת, במצב אשכול, אותו תוסף עשוי לפעול על מספר מופעים בו-זמנית, ונתקל בבעיות טיפוסיות הבאות:

- **עקביות מצב**: אם נתוני תצורה או זמן ריצה מאוחסנים רק בזיכרון, קשה לסנכרן אותם בין מופעים, מה שעלול להוביל לקריאות שגויות (dirty reads) או ביצועים כפולים.
- **תזמון משימות**: ללא מנגנון תור ואישור ברור, משימות ארוכות טווח עלולות להתבצע במקביל על ידי מספר מופעים.
- **תנאי מירוץ (Race conditions)**: פעולות הכוללות שינויי סכימה או הקצאת משאבים דורשות סדרתיות (serialization) כדי למנוע התנגשויות הנגרמות מכתיבות מקבילות.

ליבת NocoBase מספקת מראש מגוון ממשקי תווכה (middleware) בשכבת היישום כדי לעזור לתוספים לעשות שימוש חוזר ביכולות אחידות בסביבת אשכול. הסעיפים הבאים יציגו את השימוש והשיטות המומלצות עבור שמירה במטמון (caching), הודעות סינכרוניות, תורי הודעות ומנעולים מבוזרים, יחד עם הפניות לקוד המקור.

## פתרונות

### רכיב מטמון (Cache)

עבור נתונים שיש לאחסן בזיכרון, מומלץ להשתמש ברכיב המטמון המובנה של המערכת לצורך ניהול.

- קבלו את מופע המטמון המוגדר כברירת מחדל באמצעות `app.cache`.
- `Cache` מספק פעולות בסיסיות כמו `set/get/del/reset`, ותומך גם ב-`wrap` וב-`wrapWithCondition` לעטיפת לוגיקת שמירה במטמון, וכן בשיטות אצווה כמו `mset/mget/mdel`.
- בעת פריסה באשכול, מומלץ למקם נתונים משותפים באחסון בעל יכולת התמדה (כמו Redis), ולהגדיר `ttl` סביר כדי למנוע אובדן מטמון בעת הפעלה מחדש של מופע.

דוגמה: [אתחול ושימוש במטמון ב-`plugin-auth`](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts#L11-L72)

```ts title="יצירה ושימוש במטמון בתוסף"
// packages/plugins/@nocobase/plugin-auth/src/server/plugin.ts
async load() {
  this.cache = await this.app.cacheManager.createCache({
    name: 'auth',
    prefix: 'auth',
    store: 'redis',
  });

  await this.cache.wrap('token:config', async () => {
    const repo = this.app.db.getRepository('tokenPolicies');
    return repo.findOne({ filterByTk: 'default' });
  }, 60 * 1000);
}
```

### מנהל הודעות סנכרון (SyncMessageManager)

אם לא ניתן לנהל מצב בזיכרון באמצעות מטמון מבוזר (לדוגמה, אם לא ניתן לבצע לו סדרתיות), אזי כאשר המצב משתנה כתוצאה מפעולות משתמש, יש לשדר את השינוי למופעים אחרים באמצעות אות סנכרון כדי לשמור על עקביות המצב.

- מחלקת הבסיס של התוסף כבר מימשה את `sendSyncMessage`, אשר קוראת פנימית ל-`app.syncMessageManager.publish` ומוסיפה אוטומטית קידומת ברמת היישום לערוץ כדי למנוע התנגשויות ערוצים.
- `publish` יכול לציין `transaction`, וההודעה תישלח לאחר ביצוע טרנזקציית מסד הנתונים, מה שמבטיח סנכרון בין המצב להודעה.
- השתמשו ב-`handleSyncMessage` כדי לעבד הודעות ממופעים אחרים. הרשמה בשלב `beforeLoad` מתאימה מאוד לתרחישים כמו שינויי תצורה וסנכרון סכימה.

דוגמה: [`plugin-data-source-main` משתמש בהודעות סנכרון כדי לשמור על עקביות סכימה בין מספר צמתים](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L20-L220)

```ts title="סנכרון עדכוני סכימה בתוך תוסף"
export class PluginDataSourceMainServer extends Plugin {
  async handleSyncMessage(message) {
    if (message.type === 'syncCollection') {
      await this.app.db.getRepository('collections').load(message.collectionName);
    }
  }

  private sendSchemaChange(data, options) {
    this.sendSyncMessage(data, options); // קורא אוטומטית ל-app.syncMessageManager.publish
  }
}
```

### מנהל שידור הודעות (PubSubManager)

שידור הודעות הוא רכיב הבסיס של אותות סנכרון וניתן להשתמש בו גם ישירות. כאשר אתם צריכים לשדר הודעות בין מופעים, תוכלו לממש זאת באמצעות רכיב זה.

- `app.pubSubManager.subscribe(channel, handler, { debounce })` מאפשר להירשם לערוץ בין מופעים; האפשרות `debounce` משמשת למניעת קריאות חוזרות תכופות הנגרמות משידורים חוזרים.
- `publish` תומך ב-`skipSelf` (ברירת המחדל היא true) וב-`onlySelf` כדי לשלוט אם ההודעה נשלחת בחזרה למופע הנוכחי.
- יש להגדיר מתאם (כמו Redis, RabbitMQ וכו') לפני הפעלת היישום; אחרת, הוא לא יתחבר למערכת הודעות חיצונית כברירת מחדל.

דוגמה: [`plugin-async-task-manager` משתמש ב-PubSub לשידור אירועי ביטול משימות](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L194-L258)

```ts title="שידור אות ביטול משימה"
const channel = `${plugin.name}.task.cancel`;

await this.app.pubSubManager.subscribe(channel, async ({ id }) => {
  this.logger.info(`Task ${id} cancelled on other node`);
  await this.stopLocalTask(id);
});

await this.app.pubSubManager.publish(channel, { id: taskId }, { skipSelf: true });
```

### רכיב תור אירועים (EventQueue)

תור ההודעות משמש לתזמון משימות אסינכרוניות, ומתאים לטיפול בפעולות ארוכות טווח או כאלה שניתן לנסות שוב.

- הכריזו על צרכן באמצעות `app.eventQueue.subscribe(channel, { idle, process, concurrency })`. `process` מחזיר `Promise`, ותוכלו להשתמש ב-`AbortSignal.timeout` כדי לשלוט בזמני קצוב (timeouts).
- `publish` מוסיף אוטומטית את קידומת שם היישום ותומך באפשרויות כמו `timeout` ו-`maxRetries`. הוא מוגדר כברירת מחדל למתאם תור בזיכרון, אך ניתן להחליף אותו למתאמים מורחבים כמו RabbitMQ לפי הצורך.
- באשכול, ודאו שכל הצמתים משתמשים באותו מתאם כדי למנוע פיצול משימות בין צמתים.

דוגמה: [`plugin-async-task-manager` משתמש ב-EventQueue לתזמון משימות](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-async-task-manager/src/server/base-task-manager.ts#L199-L240)

```ts title="חלוקת משימות אסינכרוניות בתור"
this.app.eventQueue.subscribe(`${plugin.name}.task`, {
  concurrency: this.concurrency,
  idle: this.idle,
  process: async (payload, { signal }) => {
    await this.runTask(payload.id, { signal });
  },
});

await this.app.eventQueue.publish(`${plugin.name}.task`, { id: taskId }, { maxRetries: 3 });
```

### מנהל מנעולים מבוזרים (LockManager)

כאשר יש צורך למנוע תנאי מירוץ, ניתן להשתמש במנעול מבוזר כדי לבצע סדרתיות לגישה למשאב.

- כברירת מחדל, הוא מספק מתאם `local` מבוסס תהליך. ניתן לרשום יישומים מבוזרים כמו Redis; שלטו במקביליות באמצעות `app.lockManager.runExclusive(key, fn, ttl)` או `acquire`/`tryAcquire`.
- `ttl` משמש כהגנה לשחרור המנעול, ומונע ממנו להישאר תפוס ללא הגבלת זמן במקרים חריגים.
- תרחישים נפוצים כוללים: שינויי סכימה, מניעת משימות כפולות, הגבלת קצב (rate limiting) ועוד.

דוגמה: [`plugin-data-source-main` משתמש במנעול מבוזר כדי להגן על תהליך מחיקת שדות](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-data-source-main/src/server/server.ts#L320-L360)

```ts title="ביצוע סדרתיות לפעולת מחיקת שדה"
const lockKey = `${this.name}:fields.beforeDestroy:${collectionName}`;
await this.app.lockManager.runExclusive(lockKey, async () => {
  await fieldModel.remove(options);
  this.sendSyncMessage({ type: 'removeField', collectionName, fieldName });
});
```

## המלצות פיתוח

- **עקביות מצב בזיכרון**: נסו להימנע משימוש במצב בזיכרון במהלך הפיתוח. במקום זאת, השתמשו בשמירה במטמון או בהודעות סנכרון כדי לשמור על עקביות המצב.
- **תעדוף שימוש חוזר בממשקים מובנים**: השתמשו ביכולות מאוחדות כמו `app.cache` ו-`app.syncMessageManager` כדי למנוע יישום חוזר של לוגיקת תקשורת בין צמתים בתוספים.
- **שימו לב לגבולות טרנזקציות**: פעולות עם טרנזקציות צריכות להשתמש ב-`transaction.afterCommit` (כבר מובנה ב-`syncMessageManager.publish`) כדי להבטיח עקביות נתונים והודעות.
- **פיתוח אסטרטגיית נסיגה (backoff strategy)**: עבור משימות תור ושידור, הגדירו ערכים סבירים ל-`timeout`, `maxRetries` ו-`debounce` כדי למנוע עומסי תנועה חדשים במצבים חריגים.
- **שימוש בניטור ורישום משלימים**: עשו שימוש נבון ביומני יישומים כדי לתעד שמות ערוצים, מטעני הודעות, מפתחות מנעולים ומידע נוסף, כדי להקל על פתרון בעיות לסירוגין באשכול.

באמצעות יכולות אלו, תוספים יכולים לשתף בבטחה מצב, לסנכרן תצורות ולתזמן משימות בין מופעים שונים, ובכך לעמוד בדרישות היציבות והעקביות של תרחישי פריסת אשכול.