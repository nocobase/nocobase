:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# BaseInterface

## סקירה כללית

BaseInterface הוא מחלקת הבסיס לכל סוגי ה-Interface. משתמשים יכולים לרשת מחלקה זו כדי ליישם לוגיקת Interface מותאמת אישית.

```typescript
class CustomInterface extends BaseInterface {
  async toValue(value: string, ctx?: any): Promise<any> {
    // Custom toValue logic
  }

  toString(value: any, ctx?: any) {
    // Custom toString logic
  }
}
// רישום ה-Interface
db.interfaceManager.registerInterfaceType('customInterface', CustomInterface)
```

## מתודות

### toValue(value: string, ctx?: any): Promise<any>

ממירה מחרוזת חיצונית לערך הממשי של ה-interface. הערך יכול לעבור ישירות ל-Repository עבור פעולות כתיבה.

### toString(value: any, ctx?: any)

ממירה את הערך הממשי של ה-interface לטיפוס מחרוזת. טיפוס המחרוזת יכול לשמש לייצוא או להצגה.