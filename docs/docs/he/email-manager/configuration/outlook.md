---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# הגדרות מיקרוסופט

### דרישות מקדימות
כדי לאפשר למשתמשים לחבר את תיבות הדואר שלהם ב-Outlook ל-NocoBase, עליכם לפרוס את המערכת על שרת שיכול לגשת לשירותי מיקרוסופט. ה-backend יבצע קריאות ל-API של מיקרוסופט.

### רישום חשבון

1. עברו אל https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. היכנסו לחשבון המיקרוסופט שלכם
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### יצירת Tenant

1. עברו אל https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount והיכנסו לחשבון שלכם.
    
2. מלאו את הפרטים הבסיסיים וקבלו את קוד האימות.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. מלאו את שאר הפרטים והמשיכו.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. מלאו את פרטי כרטיס האשראי שלכם (ניתן לדלג על שלב זה כרגע).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### קבלת Client ID

1. לחצו על התפריט העליון ובחרו ב-"Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. בחרו ב-"App registrations" מצד שמאל.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. לחצו על "New registration" בחלק העליון.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. מלאו את הפרטים ושלחו.

השם יכול להיות כל דבר. עבור סוגי החשבונות (account types), בחרו באפשרות המוצגת בתמונה למטה. את ה-Redirect URI תוכלו להשאיר ריק כרגע.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. קבלו את ה-Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### הרשאת API

1. פתחו את תפריט "API permissions" מצד שמאל.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. לחצו על כפתור "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. לחצו על "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. חפשו והוסיפו את ההרשאות הבאות. התוצאה הסופית צריכה להיראות כמו בתמונה למטה.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (כברירת מחדל)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### קבלת Secret

1. לחצו על "Certificates & secrets" מצד שמאל.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. לחצו על כפתור "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. מלאו את התיאור וזמן התפוגה, ולחצו על "הוספה".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. קבלו את ה-Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. העתיקו את ה-Client ID ואת ה-Client secret והדביקו אותם בדף הגדרות הדוא"ל.

![](https://static-docs.nocobase.com/mail-1733818630710.png)