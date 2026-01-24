:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Campos de Relacionamento

No NocoBase, os campos de relacionamento não são campos reais, mas são usados para estabelecer conexões entre **coleções**. Esse conceito é equivalente aos relacionamentos em bancos de dados relacionais.

Em bancos de dados relacionais, os tipos de relacionamento mais comuns incluem os seguintes:

- [Um para Um](./o2o/index.md): Cada entidade em duas **coleções** corresponde a apenas uma entidade na outra **coleção**. Esse tipo de relacionamento é geralmente usado para armazenar diferentes aspectos de uma entidade em **coleções** separadas para reduzir a redundância e melhorar a consistência dos dados.
- [Um para Muitos](./o2m/index.md): Cada entidade em uma **coleção** pode ser associada a múltiplas entidades em outra **coleção**. Este é um dos tipos de relacionamento mais comuns. Por exemplo, um autor pode escrever vários artigos, mas cada artigo pode ter apenas um autor.
- [Muitos para Um](./m2o/index.md): Múltiplas entidades em uma **coleção** podem ser associadas a uma entidade em outra **coleção**. Esse tipo de relacionamento também é comum na modelagem de dados. Por exemplo, vários alunos podem pertencer à mesma turma.
- [Muitos para Muitos](./m2m/index.md): Múltiplas entidades em duas **coleções** podem ser associadas umas às outras. Esse tipo de relacionamento geralmente requer uma **coleção** intermediária para registrar as associações entre as entidades. Por exemplo, a relação entre alunos e cursos — um aluno pode se matricular em vários cursos, e um curso pode ter vários alunos.

Esses tipos de relacionamento desempenham um papel importante no design de banco de dados e na modelagem de dados, ajudando a descrever relacionamentos complexos do mundo real e estruturas de dados.