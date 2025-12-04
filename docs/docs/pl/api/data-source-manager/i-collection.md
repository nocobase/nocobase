:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# ICollection

`ICollection` to interfejs dla modelu danych, który zawiera informacje takie jak nazwa modelu, jego pola i powiązania.

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

## Składowe

### repository

Instancja `Repository`, do której należy `ICollection`.

## API

### updateOptions()

Aktualizuje właściwości `kolekcji`.

#### Sygnatura

- `updateOptions(options: any): void`

### setField()

Ustawia pole dla `kolekcji`.

#### Sygnatura

- `setField(name: string, options: any): IField`

### removeField()

Usuwa pole z `kolekcji`.

#### Sygnatura

- `removeField(name: string): void`

### getFields()

Pobiera wszystkie pola `kolekcji`.

#### Sygnatura

- `getFields(): Array<IField>`

### getField()

Pobiera pole `kolekcji` na podstawie jego nazwy.

#### Sygnatura

- `getField(name: string): IField`