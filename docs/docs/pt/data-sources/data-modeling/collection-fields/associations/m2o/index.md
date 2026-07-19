---
title: "Muitos para um"
description: "Campo de relação muitos para um (M2O), em que várias entidades são associadas à mesma entidade pai, como aluno-turma."
keywords: "Muitos para um,M2O,BelongsTo,associação,NocoBase"
---


# Muitos para um

Uma base de dados de biblioteca com duas entidades: livros e autores. Um autor pode escrever vários livros, mas cada livro tem apenas um autor (na maioria dos casos). Nesse cenário, a relação entre autores e livros é de muitos para um. Vários livros podem ser associados ao mesmo autor, mas cada livro pode ter apenas um autor.

A relação ER é a seguinte

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuração do campo

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Descrição dos parâmetros

### Source collection

Tabela de origem, ou seja, a tabela na qual o campo atual está localizado.

### Target collection

Tabela de destino, à qual a tabela atual está associada.

### Foreign key

Campo da tabela de origem usado para estabelecer a associação entre as duas tabelas.

### Target key

Campo referenciado pela restrição de chave estrangeira, que deve ser exclusivo.

### ON DELETE

ON DELETE define a regra de operação sobre as referências de chave estrangeira na tabela filha quando um registro é excluído da tabela pai. É uma opção usada na definição de restrições de chave estrangeira. As opções comuns de ON DELETE incluem:

- CASCADE: ao excluir um registro da tabela pai, exclui automaticamente todos os registros associados a ele na tabela filha.
- SET NULL: ao excluir um registro da tabela pai, define como NULL o valor da chave estrangeira associada na tabela filha.
- RESTRICT: opção padrão; ao tentar excluir um registro da tabela pai, a exclusão é recusada se existirem registros associados na tabela filha.
- NO ACTION: semelhante a RESTRICT; se existirem registros associados na tabela filha, a exclusão do registro da tabela pai será recusada.