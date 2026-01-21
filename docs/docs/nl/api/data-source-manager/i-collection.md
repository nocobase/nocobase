:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# ICollection

`ICollection` is de interface voor het gegevensmodel, die informatie bevat zoals de naam, velden en associaties van het model.

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

## Leden

### repository

De `Repository`-instantie waartoe `ICollection` behoort.

## API

### updateOptions()

Werkt de eigenschappen van de `collectie` bij.

#### Signatuur

- `updateOptions(options: any): void`

### setField()

Stelt een veld in voor de `collectie`.

#### Signatuur

- `setField(name: string, options: any): IField`

### removeField()

Verwijdert een veld uit de `collectie`.

#### Signatuur

- `removeField(name: string): void`

### getFields()

Haalt alle velden van de `collectie` op.

#### Signatuur

- `getFields(): Array<IField>`

### getField()

Haalt een veld van de `collectie` op aan de hand van de naam.

#### Signatuur

- `getField(name: string): IField`