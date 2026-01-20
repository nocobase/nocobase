:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# ICollection

`ICollection` är gränssnittet för datamodellen och innehåller information som modellens namn, fält och associationer.

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

## Medlemmar

### repository

Instansen av `Repository` som `ICollection` tillhör.

## API

### updateOptions()

Uppdaterar egenskaperna för `Collection`.

#### Signatur

- `updateOptions(options: any): void`

### setField()

Anger ett fält för `Collection`.

#### Signatur

- `setField(name: string, options: any): IField`

### removeField()

Tar bort ett fält från `Collection`.

#### Signatur

- `removeField(name: string): void`

### getFields()

Hämtar alla fält för `Collection`.

#### Signatur

- `getFields(): Array<IField>`

### getField()

Hämtar ett fält för `Collection` baserat på dess namn.

#### Signatur

- `getField(name: string): IField`