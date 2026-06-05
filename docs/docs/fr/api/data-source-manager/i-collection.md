:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ICollection

`ICollection` est l'interface du modèle de données. Elle contient des informations telles que le nom du modèle, ses champs et ses associations.

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

## Membres

### repository

L'instance de `Repository` à laquelle la `ICollection` appartient.

## API

### updateOptions()

Met à jour les propriétés de la `collection`.

#### Signature

- `updateOptions(options: any): void`

### setField()

Définit un champ pour la `collection`.

#### Signature

- `setField(name: string, options: any): IField`

### removeField()

Supprime un champ de la `collection`.

#### Signature

- `removeField(name: string): void`

### getFields()

Récupère tous les champs de la `collection`.

#### Signature

- `getFields(): Array<IField>`

### getField()

Récupère un champ de la `collection` par son nom.

#### Signature

- `getField(name: string): IField`