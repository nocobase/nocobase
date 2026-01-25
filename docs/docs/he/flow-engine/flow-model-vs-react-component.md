:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# FlowModel מול React.Component

## השוואת תחומי אחריות בסיסיים

| מאפיין/יכולת | `React.Component` | `FlowModel` |
| --- | --- | --- |
| יכולת רינדור | כן, מתודת `render()` מייצרת ממשק משתמש (UI) | כן, מתודת `render()` מייצרת ממשק משתמש (UI) |
| ניהול מצב | `state` ו-`setState` מובנים | משתמש ב-`props`, אך ניהול המצב מסתמך יותר על מבנה עץ המודלים |
| מחזור חיים | כן, למשל `componentDidMount` | כן, למשל `onInit`, `onMount`, `onUnmount` |
| מטרה | בניית רכיבי ממשק משתמש (UI) | בניית "עצי מודלים" מונחי-נתונים, מבוססי-זרימה ומובנים |
| מבנה נתונים | עץ רכיבים | עץ מודלים (תומך במודלי אב-בן, פיצול מרובה מופעים) |
| רכיבי ילד | שימוש ב-JSX לקינון רכיבים | שימוש ב-`setSubModel`/`addSubModel` להגדרה מפורשת של תת-מודלים |
| התנהגות דינמית | קשירת אירועים, עדכוני מצב מניעים את ה-UI | רישום/שיגור זרימות (Flows), טיפול בזרימות אוטומטיות |
| שמירה (Persistence) | אין מנגנון מובנה | תומך בשמירה (persistence) (למשל, `model.save()`) |
| תומך ב-Fork (רינדורים מרובים) | לא (דורש שימוש חוזר ידני) | כן (`createFork` ליצירת מופעים מרובים) |
| בקרת מנוע | אין | כן, מנוהל, נרשם ונטען על ידי `FlowEngine` |

## השוואת מחזור חיים

| וו מחזור חיים | `React.Component` | `FlowModel` |
| --- | --- | --- |
| אתחול | `constructor`, `componentDidMount` | `onInit`, `onMount` |
| הסרה | `componentWillUnmount` | `onUnmount` |
| תגובה לקלט | `componentDidUpdate` | `onBeforeAutoFlows`, `onAfterAutoFlows` |
| טיפול בשגיאות | `componentDidCatch` | `onAutoFlowsError` |

## השוואת מבנה בנייה

**React:**

```tsx pure
class MyComponent extends React.Component {
  render() {
    return <div>Hello</div>;
  }
}
```

**FlowModel:**

```tsx pure
class HelloModel extends FlowModel {
  render() {
    return <div>Hello</div>;
  }
}
```

## עץ רכיבים מול עץ מודלים

*   **עץ רכיבי React**: עץ רינדור UI הנוצר על ידי קינון JSX בזמן ריצה.
*   **עץ מודלי FlowModel**: עץ מבנה לוגי המנוהל על ידי FlowEngine, הניתן לשמירה (persistence), ומאפשר רישום ובקרה דינמיים של תת-מודלים. מתאים לבניית בלוקים של עמודים, זרימות פעולה, מודלי נתונים ועוד.

## תכונות מיוחדות (ייחודיות ל-FlowModel)

| פונקציה | תיאור |
| --- | --- |
| `registerFlow` | רישום זרימה (flow) |
| `applyFlow` / `dispatchEvent` | ביצוע/הפעלת זרימה (flow) |
| `setSubModel` / `addSubModel` | שליטה מפורשת על יצירה וקשירה של תת-מודלים |
| `createFork` | תומך בשימוש חוזר בלוגיקה של מודל עבור רינדורים מרובים (למשל, כל שורה בטבלה) |
| `openFlowSettings` | הגדרות שלבי זרימה (flow) |
| `save` / `saveStepParams()` | המודל ניתן לשמירה (persistence) ואינטגרציה עם ה-backend |

## סיכום

| פריט | React.Component | FlowModel |
| --- | --- | --- |
| תרחישי שימוש מתאימים | ארגון רכיבי שכבת UI | ניהול זרימות (flows) ובלוקים מונחי-נתונים |
| רעיון ליבה | UI הצהרתי | זרימה (flow) מובנית מונחית-מודל |
| שיטת ניהול | React שולט במחזור החיים | FlowModel שולט במחזור החיים ובמבנה של המודל |
| יתרונות | אקוסיסטם עשיר ושרשרת כלים | מובנה היטב, זרימות (flows) ניתנות לשמירה (persistence), תת-מודלים ניתנים לשליטה |

> FlowModel יכול לשמש כהשלמה ל-React: השתמשו ב-React לרינדור בתוך FlowModel, בעוד שמחזור החיים והמבנה שלו מנוהלים על ידי FlowEngine.