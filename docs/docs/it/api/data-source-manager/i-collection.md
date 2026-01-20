:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# ICollection

`ICollection` è l'interfaccia per il modello di dati, che include informazioni come il nome del modello, i campi e le associazioni.

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

## Membri

### repository

L'istanza di `Repository` a cui appartiene `ICollection`.

## API

### updateOptions()

Aggiorna le proprietà della `collezione`.

#### Firma

- `updateOptions(options: any): void`

### setField()

Imposta un campo per la `collezione`.

#### Firma

- `setField(name: string, options: any): IField`

### removeField()

Rimuove un campo dalla `collezione`.

#### Firma

- `removeField(name: string): void`

### getFields()

Recupera tutti i campi della `collezione`.

#### Firma

- `getFields(): Array<IField>`

### getField()

Recupera un campo della `collezione` tramite il suo nome.

#### Firma

- `getField(name: string): IField`