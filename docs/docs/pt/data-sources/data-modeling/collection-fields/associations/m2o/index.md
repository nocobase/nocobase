:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Muitos para Um

Em um banco de dados de biblioteca, temos duas entidades: livros e autores. Um autor pode escrever vários livros, mas cada livro geralmente tem apenas um autor. Nesse cenário, a relação entre autores e livros é de muitos para um. Vários livros podem ser associados ao mesmo autor, mas cada livro só pode ter um autor.

Diagrama ER:

![alt text](https://static-docs.nocobase.com/eaeeac974844db05c75cf0deeedf3652.png)

Configuração do Campo:

![alt text](https://static-docs.nocobase.com/3b4484ebb98d82f832f3dbf752bd84c9.png)

## Descrição dos Parâmetros

### Coleção de Origem

A coleção de origem, que é a coleção onde o campo atual está localizado.

### Coleção de Destino

A coleção de destino, com a qual você quer fazer a associação.

### Chave Estrangeira

O campo na coleção de origem que é usado para estabelecer a associação entre as duas coleções.

### Chave de Destino

O campo na coleção de destino que é referenciado pela chave estrangeira. Ele deve ser único.

### ON DELETE

ON DELETE se refere às regras aplicadas às referências de chave estrangeira em coleções filhas relacionadas quando registros na coleção pai são excluídos. É uma opção usada ao definir uma restrição de chave estrangeira. As opções comuns de ON DELETE incluem:

- **CASCADE**: Quando um registro na coleção pai é excluído, todos os registros relacionados na coleção filha são automaticamente excluídos.
- **SET NULL**: Quando um registro na coleção pai é excluído, os valores da chave estrangeira nos registros relacionados da coleção filha são definidos como NULL.
- **RESTRICT**: A opção padrão, ela impede a exclusão de um registro da coleção pai se houver registros relacionados na coleção filha.
- **NO ACTION**: Semelhante ao RESTRICT, ela impede a exclusão de um registro da coleção pai se houver registros relacionados na coleção filha.