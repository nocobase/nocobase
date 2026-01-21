---
pkg: '@nocobase/plugin-file-previewer-office'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# תצוגה מקדימה של קבצי Office <Badge>v1.8.11+</Badge>

תוסף התצוגה המקדימה של קבצי Office מאפשר לכם להציג קבצים בפורמט Office, כגון Word, Excel ו-PowerPoint, ישירות בתוך יישום NocoBase.
הוא מבוסס על שירות מקוון ציבורי שמסופק על ידי מיקרוסופט, ומאפשר להטמיע קבצים הנגישים באמצעות URL ציבורי בממשק תצוגה מקדימה. כך, משתמשים יכולים לצפות בקבצים אלו ישירות בדפדפן, ללא צורך בהורדה או בשימוש ביישומי Office.

## מדריך למשתמש

כברירת מחדל, תוסף זה נמצא במצב **לא מופעל**. לאחר הפעלתו במנהל התוספים, ניתן להשתמש בו ללא צורך בהגדרות נוספות.

![ממשק הפעלת התוסף](https://static-docs.nocobase.com/20250731140048.png)

לאחר העלאה מוצלחת של קובץ Office (Word / Excel / PowerPoint) לשדה קובץ בטבלת נתונים, תוכלו ללחוץ על אייקון הקובץ או על הקישור המתאים כדי לצפות בתוכן הקובץ בממשק תצוגה מקדימה שיופיע בחלון קופץ או יוטמע בדף.

![דוגמה לפעולת תצוגה מקדימה](https://static-docs.nocobase.com/20250731143231.png)

## איך זה עובד

התצוגה המקדימה המוטמעת על ידי תוסף זה מסתמכת על השירות המקוון הציבורי של מיקרוסופט (Office Web Viewer), והתהליך העיקרי הוא כדלקמן:

- ה-Frontend מייצר URL נגיש לציבור עבור הקובץ שהועלה על ידי המשתמש (כולל כתובות URL חתומות של S3);
- התוסף טוען את התצוגה המקדימה של הקובץ ב-iframe באמצעות הכתובת הבאה:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL קובץ ציבורי>
  ```

- השירות של מיקרוסופט מבקש את תוכן הקובץ מכתובת ה-URL הזו, מעבד אותו ומחזיר דף שניתן לצפות בו.

## הערות חשובות

- מכיוון שתוסף זה תלוי בשירות המקוון של מיקרוסופט, עליכם לוודא שחיבור האינטרנט שלכם תקין וששירותי מיקרוסופט נגישים.
- מיקרוסופט תיגש ל-URL של הקובץ שתספקו, ותוכן הקובץ עשוי להיטמן זמנית בשרתיה לצורך רינדור דף התצוגה המקדימה. לכן, קיים סיכון מסוים לפרטיות. אם יש לכם חששות בנוגע לכך, מומלץ לא להשתמש בתוסף זה לצורך תצוגה מקדימה של קבצים רגישים[^1].
- הקובץ שברצונכם להציג בתצוגה מקדימה חייב להיות נגיש באמצעות URL ציבורי. בדרך כלל, קבצים המועלים ל-NocoBase ייצרו באופן אוטומטי קישורים ציבוריים נגישים (כולל כתובות URL חתומות שנוצרו על ידי תוסף S3-Pro). עם זאת, אם לקובץ הוגדרו הרשאות גישה או שהוא מאוחסן בסביבת רשת פנימית, לא ניתן יהיה להציג אותו בתצוגה מקדימה[^2].
- שירות זה אינו תומך באימות כניסה או במשאבים המאוחסנים באופן פרטי. לדוגמה, קבצים הנגישים רק ברשת פנימית או הדורשים כניסה לצורך גישה, לא יוכלו להשתמש בפונקציונליות תצוגה מקדימה זו.
- לאחר שתוכן הקובץ נשלף על ידי שירות מיקרוסופט, הוא עשוי להישמר במטמון לזמן קצר. גם אם קובץ המקור נמחק, תוכן התצוגה המקדימה עשוי להישאר נגיש למשך תקופה מסוימת.
- קיימות מגבלות גודל מומלצות לקבצים: קבצי Word ו-PowerPoint מומלצים לא יעלו על 10MB, וקבצי Excel מומלצים לא יעלו על 5MB, כדי להבטיח יציבות תצוגה מקדימה[^3].
- נכון לעכשיו, אין הצהרה רשמית ברורה לגבי רישיון שימוש מסחרי בשירות זה. אנא העריכו בעצמכם את הסיכונים הכרוכים בשימוש בו[^4].

## פורמטים נתמכים של קבצים

התוסף תומך בתצוגה מקדימה של פורמטים הבאים של קבצי Office בלבד, והזיהוי מתבצע על בסיס סוג ה-MIME של הקובץ:

- מסמך Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- גיליון אלקטרוני של Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- מצגת PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation`

פורמטים אחרים של קבצים לא יופעלו על ידי פונקציונליות התצוגה המקדימה של תוסף זה.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)