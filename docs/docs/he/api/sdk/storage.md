:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# אחסון

## סקירה כללית

המחלקת `Storage` משמשת לאחסון מידע בצד הלקוח (client-side), ומשתמשת ב-`localStorage` כברירת מחדל.

### שימוש בסיסי

```ts
export abstract class Storage {
  abstract clear(): void;
  abstract getItem(key: string): string | null;
  abstract removeItem(key: string): void;
  abstract setItem(key: string, value: string): void;
}

export class CustomStorage extends Storage {
  // ...
}
```

## מתודות המחלקה

### `setItem()`

מאחסנת תוכן.

#### חתימה

- `setItem(key: string, value: string): void`

### `getItem()`

מקבלת תוכן.

#### חתימה

- `getItem(key: string): string | null`

### `removeItem()`

מסירה תוכן.

#### חתימה

- `removeItem(key: string): void`

### `clear()`

מנקה את כל התוכן.

#### חתימה

- `clear(): void`