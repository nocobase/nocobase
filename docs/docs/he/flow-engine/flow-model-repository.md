:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# התמדת FlowModel
FlowEngine מספק מנגנון התמדה שלם.

![20251008231338](https://static-docs.nocobase.com/20251008231338.png)

## IFlowModelRepository
`IFlowModelRepository` הוא ממשק התמדת המודלים של FlowEngine. הוא מגדיר פעולות כמו טעינה מרחוק, שמירה ומחיקה של מודלים. על ידי מימוש ממשק זה, אפשר להתמיד את נתוני המודל למסד נתונים בקצה האחורי (backend), ל-API או לאמצעי אחסון אחרים, ובכך לאפשר סנכרון נתונים בין הקצה הקדמי (frontend) לקצה האחורי.

### שיטות עיקריות
- **findOne(query: Query): Promise<FlowModel \| null>**  
  טוען נתוני מודל ממקור מרוחק בהתבסס על המזהה הייחודי `uid`.

- **save(model: FlowModel): Promise<any\>**  
  שומר את נתוני המודל לאחסון מרוחק.

- **destroy(uid: string): Promise<boolean\>**  
  מוחק את המודל מאחסון מרוחק בהתבסס על `uid`.

### דוגמת FlowModelRepository
```ts
class FlowModelRepository implements IFlowModelRepository<FlowModel> {
  constructor(private app: Application) {}

  async findOne(query) {
    const { uid, parentId } = query;
    // מימוש: קבלת מודל לפי uid
    return null;
  }

  async save(model: FlowModel) {
    console.log('Saving model:', model);
    // מימוש: שמירת מודל
    return model;
  }

  async destroy(uid: string) {
    // מימוש: מחיקת מודל לפי uid
    return true;
  }
}
```

### הגדרת FlowModelRepository
```ts
flowEngine.setModelRepository(new FlowModelRepository(this.app));
```

## שיטות לניהול מודלים המסופקות על ידי FlowEngine

### שיטות מקומיות
```ts
flowEngine.createModel(options); // יצירת מופע מודל מקומי
flowEngine.getModel(uid);        // קבלת מופע מודל מקומי
flowEngine.removeModel(uid);     // הסרת מופע מודל מקומי
```

### שיטות מרוחקות (ממומשות על ידי ModelRepository)
```ts
await flowEngine.loadModel(uid);     // טעינת מודל ממקור מרוחק
await flowEngine.saveModel(model);   // שמירת מודל למקור מרוחק
await flowEngine.destroyModel(uid);  // מחיקת מודל ממקור מרוחק
```

## שיטות מופע של מודל
```ts
const model = this.flowEngine.createModel({
  use: 'FlowModel',
});
await model.save();     // שמירה למקור מרוחק
await model.destroy();  // מחיקה ממקור מרוחק
```