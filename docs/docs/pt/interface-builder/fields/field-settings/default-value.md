:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Valor Padrão

## Introdução

Um valor padrão é o valor inicial de um campo quando um novo registro é criado. Você pode definir um valor padrão para um campo ao configurá-lo em uma **coleção**, ou especificá-lo para um campo em um bloco de formulário de adição. Ele pode ser configurado como uma constante ou uma variável.

## Onde Definir Valores Padrão

### Campos da **Coleção**

![20240411095933](https://static-docs.nocobase.com/20240411095933.png)

### Campos em um Formulário de Adição

A maioria dos campos em um Formulário de Adição suporta a definição de um valor padrão.

![20251028161801](https://static-docs.nocobase.com/20251028161801.png)

### Adicionando em um Subformulário

Os dados secundários adicionados através de um campo de subformulário, seja em um formulário de Adição ou Edição, terão um valor padrão.

Adicionar novo em um subformulário
![20251028163455](https://static-docs.nocobase.com/20251028163455.png)

Ao editar dados existentes, um campo vazio não será preenchido com o valor padrão. Apenas os dados recém-adicionados serão preenchidos com o valor padrão.

### Valores Padrão para Campos de Relacionamento

Apenas relacionamentos do tipo "**Muitos para Um**" e "**Muitos para Muitos**" terão valores padrão quando você usar componentes seletores (Select, RecordPicker).

![20251028164128](https://static-docs.nocobase.com/20251028164128.png)

## Variáveis de Valor Padrão

### Quais Variáveis Estão Disponíveis

- Usuário atual;
- Registro atual; isso se aplica apenas a registros existentes;
- Formulário atual, idealmente lista apenas os campos do formulário;
- Objeto atual, um conceito dentro de subformulários (o objeto de dados para cada linha no subformulário);
- Parâmetros de URL
Para mais informações sobre variáveis, consulte [Variáveis](/interface-builder/variables)

### Variáveis de Valor Padrão de Campo

Divididas em duas categorias: campos sem relacionamento e campos com relacionamento.

#### Variáveis de Valor Padrão para Campos de Relacionamento

- O objeto da variável deve ser um registro da **coleção**;
- Deve ser uma **coleção** na cadeia de herança, podendo ser a **coleção** atual ou uma **coleção** pai/filha;
- A variável "Registros selecionados da tabela" está disponível apenas para campos de relacionamento "Muitos para Muitos" e "Um para Muitos/Muitos para Um";
- **Para cenários de múltiplos níveis, é necessário achatar e remover duplicatas.**

```typescript
// Registros selecionados da tabela:
[{id:1},{id:2},{id:3},{id:4}]

// Registros selecionados da tabela/para-um:
[{paraUm: {id:2}}, {paraUm: {id:3}}, {paraUm: {id:3}}]
// Achatar e remover duplicatas
[{id: 2}, {id: 3}]

// Registros selecionados da tabela/para-muitos:
[{paraMuitos: [{id: 1}, {id:2}]}, {paraMuitos: [{id:3}, {id:4}]}]
// Achatar
[{id:1},{id:2},{id:3},{id:4}]
```

#### Variáveis de Valor Padrão Sem Relacionamento

- Os tipos devem ser consistentes ou compatíveis, por exemplo, strings são compatíveis com números, e todos os objetos que fornecem um método `toString`;
- O campo JSON é especial e pode armazenar qualquer tipo de dado;

### Nível do Campo (Campos Opcionais)

![20240411101157](https://static-docs.nocobase.com/20240411101157.png)

- Variáveis de valor padrão sem relacionamento
  - Ao selecionar campos de múltiplos níveis, isso é limitado a relacionamentos "para um" e não suporta relacionamentos "para muitos";
  - O campo JSON é especial e pode ser irrestrito;

- Variáveis de valor padrão de relacionamento
  - `hasOne`, suporta apenas relacionamentos "para um";
  - `hasMany`, suporta ambos "para um" (conversão interna) e "para muitos";
  - `belongsToMany`, suporta ambos "para um" (conversão interna) e "para muitos";
  - `belongsTo`, geralmente para "para um", mas quando o relacionamento pai é `hasMany`, também suporta "para muitos" (porque `hasMany`/`belongsTo` é essencialmente um relacionamento "muitos para muitos");

## Casos Especiais

### "Muitos para Muitos" é Equivalente a uma Combinação "Um para Muitos/Muitos para Um"

Modelo

![20240411101558](https://static-docs.nocobase.com/20240411101558.png)

### Por que os relacionamentos Um para Um e Um para Muitos não têm valores padrão?

Por exemplo, em um relacionamento A.B, se `b1` está associado a `a1`, ele não pode ser associado a `a2`. Se `b1` for associado a `a2`, sua associação com `a1` será removida. Nesse caso, os dados não são compartilhados, enquanto o valor padrão é um mecanismo compartilhado (todos podem ser associados). Portanto, relacionamentos Um para Um e Um para Muitos não podem ter valores padrão.

### Por que subformulários ou subtabelas de relacionamentos Muitos para Um e Muitos para Muitos não podem ter valores padrão?

Porque o foco de subformulários e subtabelas é editar diretamente os dados de relacionamento (incluindo adicionar e remover), enquanto o valor padrão de relacionamento é um mecanismo compartilhado onde todos podem ser associados, mas os dados de relacionamento não podem ser modificados. Portanto, não é adequado fornecer valores padrão nesse cenário.

Além disso, subformulários ou subtabelas possuem subcampos, e não ficaria claro se o valor padrão para um subformulário ou subtable seria um valor padrão de linha ou de coluna.

Considerando todos os fatores, é mais apropriado que subformulários ou subtabelas não possam ter valores padrão definidos diretamente, independentemente do tipo de relacionamento.