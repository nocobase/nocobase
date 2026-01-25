---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# שליחת דוא"ל

## מבוא

משמש לשליחת הודעות דוא"ל. תומך בתוכן בפורמט טקסט ו-HTML.

## יצירת צומת

בממשק הגדרות תהליך העבודה, לחצו על כפתור הפלוס ("+") בזרימה כדי להוסיף צומת "שליחת דוא"ל":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## הגדרות צומת

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

כל אפשרות יכולה להשתמש במשתנים מתוך ההקשר של תהליך העבודה. עבור מידע רגיש, ניתן להשתמש גם במשתנים גלובליים ובמפתחות סודיים.

## שאלות נפוצות

### מגבלת תדירות שליחה ב-Gmail

בעת שליחת הודעות דוא"ל מסוימות, ייתכן שתיתקלו בשגיאה הבאה:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

זאת מכיוון ש-Gmail מגבילה את תדירות בקשות השליחה מדומיינים שלא צוינו. בעת פריסת היישום, עליכם להגדיר את שם המארח (hostname) של השרת לדומיין שהגדרתם ב-Gmail. לדוגמה, בפריסת Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # הגדירו לדומיין השליחה שהוגדר עבורכם
```

הפניה: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)