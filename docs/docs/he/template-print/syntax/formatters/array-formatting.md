:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

### עיצוב מערכים

#### 1. :arrayJoin(separator, index, count)

##### הסבר תחביר
מצרף מערך של מחרוזות או מספרים למחרוזת אחת.
פרמטרים:
*   **separator:** המפריד (ברירת המחדל היא פסיק `,`).
*   **index:** אופציונלי; האינדקס ההתחלתי שממנו יש לבצע את הצירוף.
*   **count:** אופציונלי; מספר הפריטים לצירוף החל מה-`index` (יכול להיות שלילי כדי לספור מהסוף).

##### דוגמה
```
['homer','bart','lisa']:arrayJoin()              // פלט "homer, bart, lisa"
['homer','bart','lisa']:arrayJoin(' | ')          // פלט "homer | bart | lisa"
['homer','bart','lisa']:arrayJoin('')              // פלט "homerbartlisa"
[10,50]:arrayJoin()                               // פלט "10, 50"
[]:arrayJoin()                                    // פלט ""
null:arrayJoin()                                  // פלט null
{}:arrayJoin()                                    // פלט {}
20:arrayJoin()                                    // פלט 20
undefined:arrayJoin()                             // פלט undefined
['homer','bart','lisa']:arrayJoin('', 1)          // פלט "bartlisa"
['homer','bart','lisa']:arrayJoin('', 1, 1)       // פלט "bart"
['homer','bart','lisa']:arrayJoin('', 1, 2)       // פלט "bartlisa"
['homer','bart','lisa']:arrayJoin('', 0, -1)      // פלט "homerbart"
```

##### תוצאה
הפלט הוא מחרוזת שנוצרה על ידי צירוף אלמנטי המערך בהתאם לפרמטרים שצוינו.

#### 2. :arrayMap(objSeparator, attSeparator, attributes)

##### הסבר תחביר
ממיר מערך של אובייקטים למחרוזת. הוא אינו מטפל באובייקטים או מערכים מקוננים.
פרמטרים:
*   **objSeparator:** המפריד בין אובייקטים (ברירת המחדל היא `, `).
*   **attSeparator:** המפריד בין מאפייני אובייקט (ברירת המחדל היא `:`).
*   **attributes:** אופציונלי; רשימה של מאפייני אובייקט להצגה בפלט.

##### דוגמה
```
[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap()
// פלט "2:homer, 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' - ')
// פלט "2:homer - 3:bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|')
// פלט "2|homer ; 3|bart"

[{'id':2,'name':'homer'},{'id':3,'name':'bart'}]:arrayMap(' ; ', '|', 'id')
// פלט "2 ; 3"

[{'id':2,'name':'homer','obj':{'id':20},'arr':[12,23]}]:arrayMap()
// פלט "2:homer"

['homer','bart','lisa']:arrayMap()    // פלט "homer, bart, lisa"
[10,50]:arrayMap()                    // פלט "10, 50"
[]:arrayMap()                         // פלט ""
null:arrayMap()                       // פלט null
{}:arrayMap()                         // פלט {}
20:arrayMap()                         // פלט 20
undefined:arrayMap()                  // פלט undefined
```

##### תוצאה
הפלט הוא מחרוזת שנוצרה על ידי מיפוי וצירוף אלמנטי המערך, תוך התעלמות מתוכן אובייקטים מקוננים.

#### 3. :count(start)

##### הסבר תחביר
סופר את מספר השורה במערך ומציג את מספר השורה הנוכחי.
לדוגמה:
```
{d[i].id:count()}
```
ללא קשר לערך של `id`, הפלט יהיה ספירת השורה הנוכחית.
החל מגרסה v4.0.0, מעצב זה הוחלף פנימית ב-`:cumCount`.

פרמטר:
*   **start:** אופציונלי; ערך ההתחלה לספירה.

##### דוגמה ותוצאה
בשימוש בפועל, מספר השורה בפלט יוצג בהתאם לסדר אלמנטי המערך.