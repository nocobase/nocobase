:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# רינדור FlowModel

`FlowModelRenderer` הוא רכיב ה-React הליבתי המשמש לרינדור `FlowModel`. הוא אחראי להמיר מופע של `FlowModel` לרכיב React ויזואלי.

## שימוש בסיסי

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// שימוש בסיסי
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

לרינדור מודלים של שדות מנוהלים (controlled field Models), השתמשו ב-`FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// רינדור שדה מנוהל
<FieldModelRenderer model={fieldModel} />
```

## מאפייני Props

### FlowModelRendererProps

| פרמטר | סוג | ברירת מחדל | תיאור |
|---|---|---|---|
| `model` | `FlowModel` | - | מופע ה-FlowModel לרינדור |
| `uid` | `string` | - | מזהה ייחודי למודל תהליך העבודה |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | תוכן חלופי להצגה במקרה של כשל ברינדור |
| `showFlowSettings` | `boolean \| object` | `false` | האם להציג את נקודת הכניסה להגדרות תהליך העבודה |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | סגנון האינטראקציה עבור הגדרות תהליך העבודה |
| `hideRemoveInSettings` | `boolean` | `false` | האם להסתיר את כפתור ההסרה בהגדרות |
| `showTitle` | `boolean` | `false` | האם להציג את כותרת המודל בפינה השמאלית העליונה של המסגרת |
| `skipApplyAutoFlows` | `boolean` | `false` | האם לדלג על הפעלת תהליכי עבודה אוטומטיים |
| `inputArgs` | `Record<string, any>` | - | הקשר נוסף המועבר ל-`useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | האם לעטוף את השכבה החיצונית ביותר עם רכיב ה-`FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | רמת תפריט ההגדרות: 1=מודל נוכחי בלבד, 2=כולל מודלי צאצא |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | פריטים נוספים בסרגל הכלים |

### תצורת `showFlowSettings` מפורטת

כאשר `showFlowSettings` הוא אובייקט, התצורות הבאות נתמכות:

```tsx pure
showFlowSettings={{
  showBackground: true,    // הצגת רקע
  showBorder: true,        // הצגת מסגרת
  showDragHandle: true,    // הצגת ידית גרירה
  style: {},              // סגנון סרגל כלים מותאם אישית
  toolbarPosition: 'inside' // מיקום סרגל הכלים: 'inside' | 'above' | 'below'
}}
```

## מחזור חיי הרינדור

מחזור הרינדור המלא קורא לפונקציות הבאות לפי הסדר:

1.  **model.dispatchEvent('beforeRender')** - אירוע `beforeRender`
2.  **model.render()** - מפעיל את שיטת הרינדור של המודל
3.  **model.onMount()** - וו (hook) הרכבת רכיב
4.  **model.onUnmount()** - וו (hook) הסרת רכיב

## דוגמאות שימוש

### רינדור בסיסי

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>טוען...</div>}
    />
  );
}
```

### רינדור עם הגדרות תהליך עבודה

```tsx pure
// הצגת הגדרות אך הסתרת כפתור ההסרה
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// הצגת הגדרות וכותרת
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// שימוש במצב תפריט הקשר (קליק ימני)
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### סרגל כלים מותאם אישית

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'פעולה מותאמת אישית',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('פעולה מותאמת אישית');
      }
    }
  ]}
/>
```

### דילוג על תהליכי עבודה אוטומטיים

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### רינדור מודל שדה

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## טיפול בשגיאות

ל-`FlowModelRenderer` מנגנון מובנה ומקיף לטיפול בשגיאות:

-   **גבול שגיאה אוטומטי**: `showErrorFallback={true}` מופעל כברירת מחדל
-   **שגיאות בתהליכי עבודה אוטומטיים**: לוכד ומטפל בשגיאות במהלך ביצוע תהליכי עבודה אוטומטיים
-   **שגיאות רינדור**: מציג תוכן חלופי כאשר רינדור המודל נכשל

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>הרינדור נכשל, אנא נסו שוב</div>}
/>
```

## אופטימיזציית ביצועים

### דילוג על תהליכי עבודה אוטומטיים

בתרחישים שבהם אין צורך בתהליכי עבודה אוטומטיים, ניתן לדלג עליהם כדי לשפר את הביצועים:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### עדכונים ריאקטיביים

`FlowModelRenderer` משתמש ב-`observer` מתוך `@formily/reactive-react` עבור עדכונים ריאקטיביים, מה שמבטיח שהרכיב ירונדר מחדש אוטומטית כאשר מצב המודל משתנה.

## הערות

1.  **אימות מודל**: ודאו שלמודל המועבר יש שיטת `render` תקינה.
2.  **ניהול מחזור חיים**: וויי (hooks) מחזור החיים של המודל ייקראו בזמנים המתאימים.
3.  **גבול שגיאה**: מומלץ להפעיל את גבול השגיאה בסביבת ייצור כדי לספק חווית משתמש טובה יותר.
4.  **שיקולי ביצועים**: בתרחישים הכוללים רינדור מספר רב של מודלים, שקלו להשתמש באפשרות `skipApplyAutoFlows`.