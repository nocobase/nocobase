:::tip הודעת תרגום AI
תיעוד זה תורגם אוטומטית על ידי AI.
:::

# IModel

ממשק ה-`IModel` מגדיר את המאפיינים והמתודות הבסיסיים של אובייקט מודל.

```typescript
export interface IModel {
  toJSON: () => any;
}
```

## API

### toJSON()

ממיר את אובייקט המודל לפורמט JSON.