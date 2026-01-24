---
pkg: "@nocobase/plugin-api-doc"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::



# תיעוד API

## מבוא

התוסף מפיק תיעוד API של NocoBase HTTP בהתבסס על Swagger.

## התקנה

זהו תוסף מובנה, אין צורך בהתקנה. הפעילו אותו כדי להתחיל להשתמש.

## הוראות שימוש

### גישה לדף תיעוד ה-API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### סקירת התיעוד

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- תיעוד API כולל: `/api/swagger:get`
- תיעוד API ליבה: `/api/swagger:get?ns=core`
- תיעוד API לכל התוספים: `/api/swagger:get?ns=plugins`
- תיעוד לכל תוסף בנפרד: `/api/swagger:get?ns=plugins/{name}`
- תיעוד API עבור אוספים מותאמים אישית: `/api/swagger:get?ns=collections`
- משאבי `${collection}` ומשאבים קשורים `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## מדריך למפתחים

### איך לכתוב תיעוד Swagger עבור תוספים

הוסיפו קובץ `swagger/index.ts` בתיקיית `src` של התוסף, עם התוכן הבא:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

לכללי כתיבה מפורטים, אנא עיינו ב[תיעוד הרשמי של Swagger](https://swagger.io/docs/specification/about/).