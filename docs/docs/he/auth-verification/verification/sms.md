---
pkg: '@nocobase/plugin-verification'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# אימות: SMS

## מבוא

קוד אימות SMS הוא סוג אימות מובנה המשמש ליצירת סיסמה חד-פעמית דינמית (OTP) ולשליחתה למשתמש באמצעות SMS.

## הוספת מאמת SMS

עברו לדף ניהול האימות.

![](https://static-docs.nocobase.com/202502271726791.png)

הוספה - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## הגדרות מנהל מערכת

![](https://static-docs.nocobase.com/202502271727711.png)

ספקי שירותי ה-SMS הנתמכים כרגע הם:

- <a href="https://www.aliyun.com/product/sms" target="_blank">Aliyun SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">Tencent Cloud SMS</a>

בעת הגדרת תבנית ה-SMS בממשק הניהול של ספק השירות, עליכם להקצות פרמטר עבור קוד האימות.

- דוגמת הגדרה עבור Aliyun: `Your verification code is: ${code}`

- דוגמת הגדרה עבור Tencent Cloud: `Your verification code is: {1}`

מפתחים יכולים גם להרחיב את התמיכה בספקי שירותי SMS נוספים בצורת תוספים. ראו: [הרחבת ספקי שירותי SMS](./dev/sms-type)

## קישור משתמש

לאחר הוספת המאמת, משתמשים יכולים לקשר מספר טלפון לאימות בניהול האימות האישי שלהם.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

לאחר שהקישור בוצע בהצלחה, ניתן לבצע אימות זהות בכל תרחיש אימות המשתמש במאמת זה.

![](https://static-docs.nocobase.com/202502271739607.png)

## ביטול קישור משתמש

ביטול קישור מספר טלפון דורש אימות באמצעות שיטת אימות מקושרת קיימת.

![](https://static-docs.nocobase.com/202502282103205.png)