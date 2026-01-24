:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# Google Workspace

## הגדרת Google כ-IdP

[מסוף הניהול של Google](https://admin.google.com/) - אפליקציות - אפליקציות אינטרנט וניידות

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

לאחר הגדרת האפליקציה, העתיקו את **כתובת ה-SSO**, **מזהה הישות (Entity ID)** ו**האישור (Certificate)**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## הוספת מאמת חדש ב-NocoBase

הגדרות תוסף - אימות משתמשים - הוספה - SAML

![](https://static-docs.nocobase.com/5bc18c795b8f15828e26bb07251a335.png)

מלאו את הפרטים שהעתקתם זה עתה, לפי הסדר:

- SSO URL: כתובת SSO
- Public Certificate: אישור ציבורי
- idP Issuer: מזהה ישות (Entity ID)
- http: סמנו אם אתם בודקים באופן מקומי באמצעות http

לאחר מכן, העתיקו את SP Issuer/EntityID ואת ACS URL מתוך "Usage".

## מילוי פרטי ספק השירות (SP) ב-Google

חזרו למסוף הניהול של Google, ובדף **פרטי ספק השירות (Service Provider Details)**, הזינו את כתובת ה-ACS ומזהה הישות שהעתקתם קודם לכן, וסמנו את האפשרות **תגובה חתומה (Signed Response)**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc2384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84f335de110e5a7c96255c4.png)

תחת **מיפוי מאפיינים (Attribute Mapping)**, הוסיפו מיפויים עבור המאפיינים המתאימים.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)