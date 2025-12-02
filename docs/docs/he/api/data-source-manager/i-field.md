:::tip הודעת תרגום AI
תיעוד זה תורגם אוטומטית על ידי AI.
:::

# IField

`IField` מגדיר את הממשק ששדה צריך ליישם.

```typescript
export type FieldOptions = {
  name: string;
  field: string;
  rawType: string;
  type: string;
  description?: string;
  interface?: string;
  uiSchema?: any;
  possibleTypes?: string[];
  defaultValue?: any;
  primaryKey: boolean;
  unique: boolean;
  allowNull?: boolean;
  autoIncrement?: boolean;
  [key: string]: any;
};

export interface IField {
  options: FieldOptions;
}
```

## מאפיינים

### options

- **סוג**: `FieldOptions`