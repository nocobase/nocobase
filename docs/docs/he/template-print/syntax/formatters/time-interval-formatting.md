:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

### עיצוב מרווחי זמן

#### 1. :formatI(patternOut, patternIn)

##### הסבר תחביר
מעצב משך זמן או מרווח. פורמטי הפלט הנתמכים כוללים:
- `human+` או `human` (מתאים לתצוגה ידידותית למשתמש)
- יחידות כמו `millisecond(s)`, `second(s)`, `minute(s)`, `hour(s)`, `year(s)`, `month(s)`, `week(s)`, `day(s)` (או הקיצורים שלהן).

פרמטרים:
- `patternOut`: פורמט הפלט (לדוגמה, `'second'` או `'human+'`).
- `patternIn`: אופציונלי, יחידת הקלט (לדוגמה, `'milliseconds'` או `'s'`).

##### דוגמאות
```
// סביבת דוגמה: אפשרויות API { "lang": "en", "timezone": "Europe/Paris" }
2000:formatI('second')       // Outputs 2
2000:formatI('seconds')      // Outputs 2
2000:formatI('s')            // Outputs 2
3600000:formatI('minute')    // Outputs 60
3600000:formatI('hour')      // Outputs 1
2419200000:formatI('days')   // Outputs 28

// דוגמה בצרפתית:
2000:formatI('human')        // Outputs "quelques secondes"
2000:formatI('human+')       // Outputs "dans quelques secondes"
-2000:formatI('human+')      // Outputs "il y a quelques secondes"

// דוגמה באנגלית:
2000:formatI('human')        // Outputs "a few seconds"
2000:formatI('human+')       // Outputs "in a few seconds"
-2000:formatI('human+')      // Outputs "a few seconds ago"

// דוגמה להמרת יחידות:
60:formatI('ms', 'minute')   // Outputs 3600000
4:formatI('ms', 'weeks')      // Outputs 2419200000
'P1M':formatI('ms')          // Outputs 2628000000
'P1Y2M3DT4H5M6S':formatI('hour')  // Outputs 10296.085
```

##### תוצאה
התוצאה המוצגת היא משך הזמן או המרווח המתאים, בהתבסס על ערך הקלט והמרת היחידות.