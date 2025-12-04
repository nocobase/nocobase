:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# מטמון

## שיטות בסיסיות

ניתן לעיין ב<a href="https://github.com/node-cache-manager/node-cache-manager" target="_blank">תיעוד של node-cache-manager</a>.

- `get()`
- `set()`
- `del()`
- `reset()`
- `wrap()`
- `mset()`
- `mget()`
- `mdel()`
- `keys()`
- `ttl()`

## שיטות נוספות

### `wrapWithCondition()`

דומה ל-`wrap()`, אך מאפשר לכם להחליט באופן מותנה האם להשתמש במטמון.

```ts
async wrapWithCondition<T>(
  key: string,
  fn: () => T | Promise<T>,
  options?: {
    // פרמטר חיצוני השולט האם להשתמש בתוצאה השמורה במטמון
    useCache?: boolean;
    // מחליט האם לשמור במטמון בהתבסס על תוצאת הנתונים
    isCacheable?: (val: unknown) => boolean | Promise<boolean>;
    ttl?: Milliseconds;
  },
): Promise<T> {
```

### `setValueInObject()`

כאשר תוכן המטמון הוא אובייקט, שיטה זו משנה את הערך של מפתח ספציפי.

```ts
async setValueInObject(key: string, objectKey: string, value: unknown)
```

### `getValueInObject()`

כאשר תוכן המטמון הוא אובייקט, שיטה זו מאחזרת את הערך של מפתח ספציפי.

```ts
async getValueInObject(key: string, objectKey: string)
```

### `delValueInObject()`

כאשר תוכן המטמון הוא אובייקט, שיטה זו מוחקת מפתח ספציפי.

```ts
async delValueInObject(key: string, objectKey: string)
```