:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ICollection

`ICollection` es la interfaz para el modelo de datos, que contiene información como el nombre del modelo, sus campos y sus asociaciones.

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

## Miembros

### repository

La instancia de `Repository` a la que pertenece `ICollection`.

## API

### updateOptions()

Actualiza las propiedades de la `Collection`.

#### Firma

- `updateOptions(options: any): void`

### setField()

Establece un campo para la `Collection`.

#### Firma

- `setField(name: string, options: any): IField`

### removeField()

Elimina un campo de la `Collection`.

#### Firma

- `removeField(name: string): void`

### getFields()

Obtiene todos los campos de la `Collection`.

#### Firma

- `getFields(): Array<IField>`

### getField()

Obtiene un campo de la `Collection` por su nombre.

#### Firma

- `getField(name: string): IField`