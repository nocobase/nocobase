:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/template-print/syntax/formatters/time-interval-formatting).
:::

### עיצוב מרווחי זמן

#### 1. :formatI(patternOut, patternIn)

##### הסבר תחביר
מעצב משך זמן או מרווח, פורמטי הפלט הנתמכים כוללים:
- `human+`, `human` (מתאים לתצוגה אנושית)
- וכן יחידות כגון `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (או הקיצורים שלהן).

פרמטרים:
- patternOut: פורמט פלט (לדוגמה `'second'`, `'human+'` וכו')
- patternIn: אופציונלי, יחידת קלט (לדוגמה `'milliseconds'`, `'s'` וכו')

##### דוגמה
```
2000:formatI('second')       // פלט 2
2000:formatI('seconds')      // פלט 2
2000:formatI('s')            // פלט 2
3600000:formatI('minute')    // פלט 60
3600000:formatI('hour')      // פלט 1
2419200000:formatI('days')   // פלט 28

// תצוגה אנושית:
2000:formatI('human')        // פלט "a few seconds"
2000:formatI('human+')       // פלט "in a few seconds"
-2000:formatI('human+')      // פלט "a few seconds ago"

// דוגמה להמרת יחידות:
60:formatI('ms', 'minute')   // פלט 3600000
4:formatI('ms', 'weeks')      // פלט 2419200000
'P1M':formatI('ms')          // פלט 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // פלט 10296.085
```

##### תוצאה
תוצאת הפלט מוצגת כמשך הזמן או המרווח המתאים בהתאם לערך הקלט והמרת היחידות.