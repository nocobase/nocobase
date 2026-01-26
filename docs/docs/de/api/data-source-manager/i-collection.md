:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ICollection

`ICollection` ist das Interface für das Datenmodell, das Informationen wie den Namen des Modells, dessen Felder und Assoziationen enthält.

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

## Mitglieder

### repository

Die `Repository`-Instanz, zu der `ICollection` gehört.

## API

### updateOptions()

Aktualisiert die Eigenschaften der `Collection`.

#### Signatur

- `updateOptions(options: any): void`

### setField()

Setzt ein Feld für die `Collection`.

#### Signatur

- `setField(name: string, options: any): IField`

### removeField()

Entfernt ein Feld aus der `Collection`.

#### Signatur

- `removeField(name: string): void`

### getFields()

Ruft alle Felder der `Collection` ab.

#### Signatur

- `getFields(): Array<IField>`

### getField()

Ruft ein Feld der `Collection` anhand seines Namens ab.

#### Signatur

- `getField(name: string): IField`