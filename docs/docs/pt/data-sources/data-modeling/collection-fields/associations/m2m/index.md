---
title: "Muitos-para-muitos"
description: "Campo de relação muitos-para-muitos (M2M), associação muitos-para-muitos entre entidades de duas tabelas, geralmente requer uma tabela intermediária, como aluno-curso."
keywords: "Muitos-para-muitos,M2M,BelongsToMany,tabela intermediária,campo de associação,NocoBase"
---

# Muitos-para-muitos

Em um sistema de seleção de disciplinas, há duas entidades: alunos e cursos. Um aluno pode se matricular em vários cursos, e um curso também pode ter vários alunos matriculados, formando uma relação muitos-para-muitos. Em bancos de dados relacionais, para representar a relação muitos-para-muitos entre alunos e cursos, normalmente é usada uma tabela intermediária, como uma tabela de matrículas. Essa tabela pode registrar quais cursos cada aluno escolheu e quais alunos estão matriculados em cada curso. Esse modelo representa bem a relação muitos-para-muitos entre alunos e cursos.

A relação ER é apresentada a seguir

![texto alternativo](https://static-docs.nocobase.com/0e9921228e1ee375dc639431bb89782c.png)

Configuração dos campos

![texto alternativo](https://static-docs.nocobase.com/8e2739ac5d44fb46f30e2da42ca87a82.png)

## Descrição dos parâmetros

### Source collection

Tabela de origem, ou seja, a tabela na qual o campo atual está localizado.

### Target collection

Tabela de destino, à qual a associação é estabelecida.

### Through collection

Tabela intermediária. Quando existe uma relação muitos-para-muitos entre duas entidades, é necessário usar uma tabela intermediária para armazenar essa relação. A tabela intermediária possui duas chaves estrangeiras, usadas para armazenar a associação entre as duas entidades.

### Source key

Campo referenciado pela restrição de chave estrangeira, que deve ser exclusivo.

### Foreign key 1

Campo da tabela intermediária usado para estabelecer a associação com a tabela de origem.

### Foreign key 2

Campo da tabela intermediária usado para estabelecer a associação com a tabela de destino.

### Target key

Campo referenciado pela restrição de chave estrangeira, que deve ser exclusivo.

### ON DELETE

ON DELETE refere-se à regra de operação sobre as referências de chaves estrangeiras na tabela filha quando um registro é excluído da tabela pai. É uma opção usada na definição de restrições de chave estrangeira. As opções ON DELETE mais comuns incluem:

- CASCADE: ao excluir um registro da tabela pai, exclui automaticamente todos os registros associados na tabela filha.
- SET NULL: ao excluir um registro da tabela pai, define como NULL o valor da chave estrangeira associada na tabela filha.
- RESTRICT: opção padrão. Ao tentar excluir um registro da tabela pai, a exclusão é rejeitada se houver registros associados na tabela filha.
- NO ACTION: semelhante a RESTRICT; se houver registros associados na tabela filha, a exclusão do registro da tabela pai será rejeitada.