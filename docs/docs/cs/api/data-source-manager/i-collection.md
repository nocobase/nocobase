:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# ICollection

`ICollection` je rozhraní pro datový model, které obsahuje informace, jako je název modelu, jeho pole a asociace.

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

## Členové

### repository

Instance `Repository`, ke které `ICollection` náleží.

## API

### updateOptions()

Aktualizuje vlastnosti `Kolekce`.

#### Signatura

- `updateOptions(options: any): void`

### setField()

Nastaví pole pro `Kolekci`.

#### Signatura

- `setField(name: string, options: any): IField`

### removeField()

Odebere pole z `Kolekce`.

#### Signatura

- `removeField(name: string): void`

### getFields()

Získá všechna pole `Kolekce`.

#### Signatura

- `getFields(): Array<IField>`

### getField()

Získá pole `Kolekce` podle jeho názvu.

#### Signatura

- `getField(name: string): IField`