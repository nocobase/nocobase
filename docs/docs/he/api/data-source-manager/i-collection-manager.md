:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# ICollectionManager

ממשק `ICollectionManager` משמש לניהול מופעי `אוסף` של `מקור נתונים`.

## API

### registerFieldTypes()

רושם סוגי שדות בתוך `אוסף`.

#### חתימה

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

רושם את ה-`Interface` של `אוסף`.

#### חתימה

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

רושם `תבנית אוסף`.

#### חתימה

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

רושם `Model`.

#### חתימה

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

רושם `Repository`.

#### חתימה

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

מקבל מופע `Repository` רשום.

#### חתימה

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

מגדיר `אוסף`.

#### חתימה

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

משנה מאפיינים של `אוסף` קיים.

#### חתימה

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

בודק אם `אוסף` קיים.

#### חתימה

- `hasCollection(name: string): boolean`

### getCollection()

מקבל מופע `אוסף`.

#### חתימה

- `getCollection(name: string): ICollection`

### getCollections()

מקבל את כל מופעי ה-`אוסף`.

#### חתימה

- `getCollections(): Array<ICollection>`

### getRepository()

מקבל מופע `Repository`.

#### חתימה

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

מסנכרן את `מקור הנתונים`. הלוגיקה מיושמת על ידי מחלקות יורשות.

#### חתימה

- `sync(): Promise<void>`