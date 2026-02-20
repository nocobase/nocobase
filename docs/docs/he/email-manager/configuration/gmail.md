---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# הגדרות Google

### דרישות מקדימות

כדי שמשתמשים יוכלו לחבר את חשבונות Google Mail שלהם ל-NocoBase, המערכת חייבת להיות פרוסה על שרת שתומך בגישה לשירותי Google, מכיוון שה-backend יבצע קריאות ל-Google API.

### רישום חשבון

1.  פתחו את https://console.cloud.google.com/welcome כדי לעבור ל-Google Cloud.
2.  בכניסה הראשונה תצטרכו להסכים לתנאים וההגבלות הרלוונטיים.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### יצירת אפליקציה

1.  לחצו על "Select a project" בחלק העליון.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2.  לחצו על כפתור "NEW PROJECT" בחלון הקופץ.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3.  מלאו את פרטי הפרויקט.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4.  לאחר יצירת הפרויקט, בחרו אותו.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### הפעלת Gmail API

1.  לחצו על כפתור "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2.  עברו ללוח המחוונים של APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3.  חפשו "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4.  לחצו על כפתור "ENABLE" כדי להפעיל את Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### הגדרת מסך הסכמה של OAuth

1.  לחצו על תפריט "OAuth consent screen" בצד שמאל.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2.  בחרו "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3.  מלאו את פרטי הפרויקט (אלה יוצגו בדף האישור) ולחצו על שמירה.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4.  מלאו את פרטי יצירת הקשר של המפתח (Developer contact information) ולחצו על המשך.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5.  לחצו על המשך.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6.  הוסיפו משתמשי בדיקה לצורך בדיקה לפני פרסום האפליקציה.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7.  לחצו על המשך.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8.  עברו על סיכום המידע וחזרו ללוח המחוונים.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### יצירת אישורים (Credentials)

1.  לחצו על תפריט "Credentials" בצד שמאל.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2.  לחצו על כפתור "CREATE CREDENTIALS" ובחרו "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3.  בחרו "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4.  מלאו את פרטי האפליקציה.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5.  הזינו את הדומיין הסופי של פריסת הפרויקט (הדוגמה כאן היא כתובת בדיקה של NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6.  הוסיפו את כתובת ה-URI של ההפניה החוזרת המאושרת. היא חייבת להיות `דומיין + "/admin/settings/mail/oauth2"`. לדוגמה: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7.  לחצו על יצירה כדי לצפות בפרטי OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8.  העתיקו את ה-Client ID ואת ה-Client secret והדביקו אותם בדף הגדרות הדוא"ל.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9.  לחצו על שמירה כדי להשלים את ההגדרה.

### פרסום האפליקציה

לאחר השלמת התהליך הנ"ל ובדיקת תכונות כמו התחברות משתמש בדיקה עם הרשאה ושליחת דוא"ל, תוכלו לפרסם את האפליקציה.

1.  לחצו על תפריט "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2.  לחצו על כפתור "EDIT APP", ולאחר מכן לחצו על כפתור "SAVE AND CONTINUE" בתחתית.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3.  לחצו על כפתור "ADD OR REMOVE SCOPES" כדי לבחור את היקפי ההרשאות של המשתמש.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4.  חפשו "Gmail API", ולאחר מכן סמנו את "Gmail API" (ודאו שערך ה-Scope הוא Gmail API עם "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5.  לחצו על כפתור "UPDATE" בתחתית כדי לשמור.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6.  לחצו על כפתור "SAVE AND CONTINUE" בתחתית כל עמוד, ולבסוף לחצו על כפתור "BACK TO DASHBOARD" כדי לחזור לדף לוח המחוונים.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7.  לחצו על כפתור "PUBLISH APP". יופיע דף אישור פרסום, המפרט את המידע הנדרש לפרסום. לאחר מכן לחצו על כפתור "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8.  חזרו לדף הקונסולה ותראו שסטטוס הפרסום הוא "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9.  לחצו על כפתור "PREPARE FOR VERIFICATION", מלאו את המידע הנדרש ולחצו על כפתור "SAVE AND CONTINUE" (הנתונים בתמונה הם להמחשה בלבד).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. המשיכו למלא את המידע הנדרש (הנתונים בתמונה הם להמחשה בלבד).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. לחצו על כפתור "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. לחצו על כפתור "SUBMIT FOR VERIFICATION" כדי לשלוח לאימות (Verification).

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. המתינו לתוצאת האישור.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. אם האישור עדיין ממתין, משתמשים יכולים ללחוץ על הקישור הלא בטוח (unsafe link) כדי לאשר ולהתחבר.

![](https://static-docs.nocobase.com/mail-1735633689645.png)