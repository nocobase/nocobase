---
pkg: '@nocobase/plugin-file-previewer-office'
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# תצוגה מקדימה של קבצי Office <Badge>v1.8.11+</Badge>

תוסף התצוגה המקדימה של קבצי Office מאפשר להציג קבצים בפורמט Office, כגון Word, Excel ו-PowerPoint, ישירות בתוך יישום NocoBase.  
הוא מבוסס על שירות מקוון ציבורי שמסופק על ידי מיקרוסופט, ומאפשר להטמיע קבצים הנגישים באמצעות URL ציבורי בממשק תצוגה מקדימה. כך, משתמשים יכולים לצפות בקבצים אלו ישירות בדפדפן, ללא צורך בהורדה או בשימוש ביישומי Office.

## מדריך למשתמש

כברירת מחדל, תוסף זה נמצא במצב **לא מופעל**. לאחר הפעלתו במנהל התוספים, ניתן להשתמש בו ללא צורך בהגדרות נוספות.

![ממשק הפעלת התוסף](https://static-docs.nocobase.com/20250731140048.png)

לאחר העלאה מוצלחת של קובץ Office (Word / Excel / PowerPoint) לשדה קובץ בטבלת נתונים, תוכלו ללחוץ על אייקון הקובץ או על הקישור המתאים כדי לצפות בתוכן הקובץ בממשק תצוגה מקדימה שיופיע בחלון קופץ או יוטמע בדף.

![דוגמת שימוש בתצוגה מקדימה](https://static-docs.nocobase.com/20250731143231.png)

## איך זה עובד

התצוגה המקדימה של התוסף מסתמכת על השירות המקוון הציבורי של מיקרוסופט (Office Web Viewer). זרימת העבודה העיקרית היא:

- בצד הלקוח נוצרת כתובת URL ציבורית לקובץ שהועלה (כולל כתובות URL חתומות כגון אלו שנוצרות על ידי תוסף S3-Pro);
- התוסף מטמיע את התצוגה המקדימה ב-iframe באמצעות הכתובת הבאה:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<public file URL>
  ```

- שירות מיקרוסופט שולף את הקובץ מהכתובת, מרנדר אותו ומחזיר דף תצוגה.

## הערות

- מאחר שהתוסף תלוי בשירות המקוון של מיקרוסופט, ודאו שהרשת יציבה ושניתן לגשת לשירותי מיקרוסופט.
- מיקרוסופט תיגש ל-URL שסיפקת, ותוכן הקובץ עלול להישמר באופן זמני בשרתים שלה לצורך רינדור. הדבר יוצר סיכון לפרטיות — אם זה מטריד אותך, מומלץ לא להשתמש בתוסף זה למסמכים רגישים[^1].
- כדי לקבל תצוגה מקדימה, הקובץ חייב להיות נגיש ב-URL ציבורי. בדרך כלל קבצים שמועלים ל‑NocoBase מקבלים קישור ציבורי אוטומטי (כולל כתובות URL חתומות מתוסף S3-Pro). אם יש הגבלות גישה או שהקובץ מאוחסן ברשת פנימית, לא ניתן להציגו[^2].
- השירות אינו תומך באימות התחברות או באחסון פרטי. לדוגמה, קבצים שנגישים רק ברשת פנימית או דורשים התחברות לא יעבדו עם התצוגה המקדימה.
- לאחר שמיקרוסופט שולפת את הקובץ, ייתכן שהוא יישאר במטמון לזמן קצר. גם אם הקובץ המקורי נמחק, התצוגה עשויה להיות זמינה זמן מה.
- מגבלות גודל מומלצות: קבצי Word ו‑PowerPoint עד 10MB וקבצי Excel עד 5MB, כדי לשמור על יציבות התצוגה המקדימה[^3].
- אין הצהרה רשמית ברורה לגבי שימוש מסחרי בשירות זה. העריכו את הסיכונים לפני שימוש מסחרי[^4].

## סוגי קבצים נתמכים

התוסף תומך רק בתצוגה מקדימה של פורמטים אלה של Office, בהתאם לסוג MIME של הקובץ או סיומת הקובץ:

- מסמך Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) או `application/msword` (`.doc`)
- גיליון Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) או `application/vnd.ms-excel` (`.xls`)
- מצגת PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) או `application/vnd.ms-powerpoint` (`.ppt`)
- טקסט OpenDocument:
  `application/vnd.oasis.opendocument.text` (`.odt`)

פורמטים אחרים לא יפעילו את התצוגה המקדימה.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)
