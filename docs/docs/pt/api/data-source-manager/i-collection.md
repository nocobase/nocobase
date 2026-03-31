:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# ICollection

`ICollection` é a interface para o modelo de dados, que contém informações como o nome do modelo, campos e associações.

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

## Membros

### repository

A instância de `Repository` à qual `ICollection` pertence.

## API

### updateOptions()

Atualiza as propriedades da `coleção`.

#### Assinatura

- `updateOptions(options: any): void`

### setField()

Define um campo para a `coleção`.

#### Assinatura

- `setField(name: string, options: any): IField`

### removeField()

Remove um campo da `coleção`.

#### Assinatura

- `removeField(name: string): void`

### getFields()

Obtém todos os campos da `coleção`.

#### Assinatura

- `getFields(): Array<IField>`

### getField()

Obtém um campo da `coleção` pelo nome.

#### Assinatura

- `getField(name: string): IField`