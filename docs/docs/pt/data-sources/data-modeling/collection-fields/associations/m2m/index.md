:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Muitos para Muitos

Em um sistema de matrícula de cursos, existem duas entidades: alunos e cursos. Um aluno pode se matricular em várias disciplinas, e uma disciplina pode ter vários alunos matriculados, o que configura um relacionamento de muitos para muitos. Em um banco de dados relacional, para representar o relacionamento de muitos para muitos entre alunos e cursos, geralmente usamos uma **coleção** intermediária, como uma **coleção** de matrículas. Essa **coleção** pode registrar quais disciplinas cada aluno escolheu e quais alunos se matricularam em cada disciplina. Esse design representa de forma eficaz o relacionamento de muitos para muitos entre alunos e cursos.

Diagrama ER:

![alt text](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configuração do Campo:

![alt text](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Descrição dos Parâmetros

### Coleção de Origem

A **coleção** de origem, que é a **coleção** onde o campo atual está localizado.

### Coleção de Destino

A **coleção** de destino, que é a **coleção** a ser associada.

### Coleção Intermediária

A **coleção** intermediária, usada quando existe um relacionamento de muitos para muitos entre duas entidades. A **coleção** intermediária possui duas chaves estrangeiras que são usadas para manter a associação entre as duas entidades.

### Chave de Origem

O campo na **coleção** de origem que é referenciado pela chave estrangeira. Ele deve ser único.

### Chave Estrangeira 1

O campo na **coleção** intermediária que estabelece a associação com a **coleção** de origem.

### Chave Estrangeira 2

O campo na **coleção** intermediária que estabelece a associação com a **coleção** de destino.

### Chave de Destino

O campo na **coleção** de destino que é referenciado pela chave estrangeira. Ele deve ser único.

### ON DELETE

`ON DELETE` refere-se às regras aplicadas às referências de chave estrangeira em **coleções** filhas relacionadas quando registros na **coleção** pai são excluídos. É uma opção usada ao definir uma restrição de chave estrangeira. As opções comuns de `ON DELETE` incluem:

- **CASCADE**: Quando um registro na **coleção** pai é excluído, todos os registros relacionados na **coleção** filha são automaticamente excluídos.
- **SET NULL**: Quando um registro na **coleção** pai é excluído, os valores da chave estrangeira nos registros relacionados da **coleção** filha são definidos como `NULL`.
- **RESTRICT**: A opção padrão, impede a exclusão de um registro da **coleção** pai se houver registros relacionados na **coleção** filha.
- **NO ACTION**: Semelhante a `RESTRICT`, impede a exclusão de um registro da **coleção** pai se houver registros relacionados na **coleção** filha.