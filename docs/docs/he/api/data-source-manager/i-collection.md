:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# ICollection

`ICollection` הוא הממשק עבור מודל הנתונים, והוא מכיל מידע כמו שם המודל, השדות שלו והקשרים ביניהם.

```typescript
export interface ICollection {
  repository: IRepository;

  updateOptions(options: any): void;

  setField(name: string, options: any): IField;

  removeField(name: string): void;

  getFields(): Array<IField>;

  getField(name: string): IField;

  [key: string]: any;
}
```

## חברים

### repository

מופע ה-`Repository` שאליו ה-`ICollection` שייך.

## API

### updateOptions()

מעדכן את המאפיינים של ה**אוסף**.

#### חתימה

- `updateOptions(options: any): void`

### setField()

מגדיר שדה עבור ה**אוסף**.

#### חתימה

- `setField(name: string, options: any): IField`

### removeField()

מסיר שדה מה**אוסף**.

#### חתימה

- `removeField(name: string): void`

### getFields()

מקבל את כל השדות של ה**אוסף**.

#### חתימה

- `getFields(): Array<IField>`

### getField()

מקבל שדה מה**אוסף** לפי שמו.

#### חתימה

- `getField(name: string): IField`