:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מחזור החיים של FlowModel

## מתודות ה-model

המתודות הבאות נקראות באופן פנימי:

```ts
class MyModel extends FlowModel {
  onInit() {}
  onMount() {}
  useHooksBeforeRender() {}
  render() {}
  onUnMount() {}
  onDispatchEventStart() {}
  onDispatchEventEnd() {}
  onDispatchEventError() {}
}
```

## model.emitter

משמש להפעלות חיצוניות:

- onSubModelAdded
- onSubModelRemoved
- onSubModelMoved

## התהליך

1. בניית ה-model
    - onInit
2. רינדור ה-model
    - onDispatchEventStart
    - dispatchEvent('beforeRender')
    - onDispatchEventEnd
    - render
    - onMount
3. הסרת הרכיב (Unmount)
    - onUnMount
4. הפעלת הזרימה
    - onDispatchEventStart
    - onDispatchEventEnd
5. רינדור מחדש
  - onUnMount
  - onDispatchEventStart
  - dispatchEvent('beforeRender')
  - onDispatchEventEnd
  - onUnMount