:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מנגנון ריאקטיביות: Observable

:::info
מנגנון הריאקטיביות מסוג Observable של NocoBase דומה במהותו ל-[MobX](https://mobx.js.org/README.html). המימוש הבסיסי הנוכחי משתמש ב- [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), והתחביר והרעיונות שלו תואמים מאוד ל-[MobX](https://mobx.js.org/README.html). הוא לא שומש ישירות מסיבות היסטוריות בלבד.
:::

ב-NocoBase 2.0, אובייקטים ריאקטיביים מסוג `Observable` נמצאים בכל מקום. הוא הליבה של זרימת הנתונים הבסיסית ותגובתיות ממשק המשתמש (UI), ונמצא בשימוש נרחב ברכיבים כמו FlowContext, FlowModel, ו-FlowStep.

## למה לבחור ב-Observable?

NocoBase בחרה ב-Observable על פני פתרונות ניהול מצב אחרים כמו Redux, Recoil, Zustand ו-Jotai, מהסיבות העיקריות הבאות:

- **גמישות מירבית**: Observable יכול להפוך כל אובייקט, מערך, Map, Set וכו', לריאקטיבי. הוא תומך באופן טבעי בקינון עמוק ובמבנים דינמיים, מה שהופך אותו למתאים מאוד למודלים עסקיים מורכבים.
- **אי-פולשני (Non-intrusive)**: אתם יכולים לתפעל ישירות את האובייקט המקורי, ללא צורך להגדיר actions, reducers או stores נוספים, מה שמספק חווית פיתוח מצוינת.
- **מעקב תלויות אוטומטי**: ברגע שעוטפים רכיב עם `observer`, הרכיב עוקב באופן אוטומטי אחר מאפייני ה-Observable שבהם הוא משתמש. כאשר הנתונים משתנים, ממשק המשתמש מתרענן אוטומטית, ללא צורך בניהול תלויות ידני.
- **מתאים לתרחישים שאינם React**: מנגנון הריאקטיביות של Observable לא מתאים רק ל-React, אלא יכול להשתלב גם עם פריימוורקים אחרים כדי לענות על מגוון רחב יותר של צרכי נתונים ריאקטיביים.

## למה להשתמש ב-observer?

`observer` מאזין לשינויים באובייקטים מסוג Observable, ומפעיל אוטומטית עדכונים לרכיבי React כאשר הנתונים משתנים. זה מאפשר לממשק המשתמש שלכם להישאר מסונכרן עם הנתונים, ללא צורך לקרוא ידנית ל-`setState` או לשיטות עדכון אחרות.

## שימוש בסיסי

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

למידע נוסף על שימוש ריאקטיבי, תוכלו לעיין בתיעוד של [@formily/reactive](https://reactive.formilyjs.org/).