---
title: "Um para um"
description: "Campo de relação um para um (O2O), em que duas entidades de tabela correspondem uma à outra, usado para armazenar diferentes aspectos de uma entidade separadamente."
keywords: "Um para um,O2O,HasOne,BelongsTo,Campos de relação,NocoBase"
---

# Um para um

A relação entre funcionários e perfis pessoais: cada funcionário pode ter apenas um registro de perfil pessoal, e cada registro de perfil pessoal também pode corresponder a apenas um funcionário. Nesse caso, funcionários e perfis pessoais têm uma relação um para um.

A chave estrangeira de uma relação um para um pode ser colocada na tabela de origem ou na tabela de destino. Se a relação representar “tem um”, é mais apropriado colocar a chave estrangeira na tabela de destino; se representar uma “relação de pertencimento”, é mais apropriado colocá-la na tabela de origem.

No exemplo acima, um funcionário tem apenas um perfil pessoal, e o perfil pessoal pertence ao funcionário. Portanto, é mais adequado colocar essa chave estrangeira na tabela de perfis pessoais.

## Um para um (tem um)

Indica que determinado funcionário tem um registro de perfil pessoal

Relação ER

![texto alternativo](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuração do campo

![texto alternativo](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Um para um (relação de pertencimento)

Indica que determinado registro de perfil pessoal pertence a um funcionário

Relação ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configuração do campo

![texto alternativo](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Descrição dos parâmetros

### Coleção de origem

A tabela de origem, ou seja, a tabela onde o campo atual está localizado.

### Coleção de destino

A tabela de destino, à qual a relação está associada.

### Chave estrangeira

Usada para estabelecer a relação entre duas tabelas. A chave estrangeira de uma relação um para um pode ser colocada na tabela de origem ou na tabela de destino. Se a relação representar “tem um”, é mais apropriado colocar a chave estrangeira na tabela de destino; se representar uma “relação de pertencimento”, é mais apropriado colocá-la na tabela de origem.

### Chave de origem <- Chave estrangeira (chave estrangeira na tabela de destino)

O campo referenciado pela restrição de chave estrangeira deve ser exclusivo. Quando a chave estrangeira está na tabela de destino, a relação representa “tem um”.

### Chave de destino <- Chave estrangeira (chave estrangeira na tabela de origem)

O campo referenciado pela restrição de chave estrangeira deve ser exclusivo. Quando a chave estrangeira está na tabela de origem, a relação representa uma “relação de pertencimento”.

### ON DELETE

ON DELETE refere-se à regra de operação aplicada às referências de chave estrangeira na tabela filha relacionada quando um registro é excluído da tabela pai. É uma opção usada na definição de restrições de chave estrangeira. As opções ON DELETE comuns incluem:

- CASCADE: ao excluir um registro da tabela pai, exclui automaticamente todos os registros relacionados da tabela filha.
- SET NULL: ao excluir um registro da tabela pai, define como NULL o valor da chave estrangeira relacionada na tabela filha.
- RESTRICT: opção padrão; ao tentar excluir um registro da tabela pai, recusa a exclusão se houver registros relacionados na tabela filha.
- NO ACTION: semelhante a RESTRICT; se houver registros relacionados na tabela filha, recusa a exclusão do registro da tabela pai.