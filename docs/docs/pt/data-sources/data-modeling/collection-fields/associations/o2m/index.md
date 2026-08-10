---
title: "Um-para-muitos"
description: "Campo de relação um-para-muitos (O2M), no qual uma entidade está associada a várias entidades filhas, como autor e artigos."
keywords: "Um-para-muitos,O2M,HasMany,associação,NocoBase"
---

# Um-para-muitos

A relação entre uma turma e seus alunos: uma turma pode ter vários alunos, mas cada aluno só pode pertencer a uma turma. Nesse caso, a relação entre a turma e os alunos é uma relação um-para-muitos.

A relação ER é apresentada abaixo

![texto alternativo](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuração do campo

![texto alternativo](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Descrição dos parâmetros

### Source collection

A tabela de origem, ou seja, a tabela na qual o campo atual está localizado.

### Target collection

A tabela de destino à qual a associação é estabelecida.

### Source key

O campo referenciado pela restrição de chave estrangeira, que deve ser exclusivo.

### Foreign key

O campo da tabela de destino usado para estabelecer a associação entre as duas tabelas.

### Target key

O campo da tabela de destino usado para visualizar cada registro no bloco de relação; geralmente, é um campo com valor exclusivo.

### ON DELETE

ON DELETE define a regra de operação sobre as referências de chave estrangeira na tabela filha relacionada quando um registro é excluído da tabela pai. É uma opção usada na definição de restrições de chave estrangeira. As opções ON DELETE comuns incluem:

- CASCADE: ao excluir um registro da tabela pai, exclui automaticamente todos os registros relacionados na tabela filha.
- SET NULL: ao excluir um registro da tabela pai, define como NULL o valor da chave estrangeira relacionada na tabela filha.
- RESTRICT: opção padrão; ao tentar excluir um registro da tabela pai, a exclusão é rejeitada se houver registros relacionados na tabela filha.
- NO ACTION: semelhante a RESTRICT; se houver registros relacionados na tabela filha, a exclusão do registro da tabela pai será rejeitada.