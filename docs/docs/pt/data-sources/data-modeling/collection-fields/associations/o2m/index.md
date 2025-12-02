:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Um para Muitos

A relação entre uma turma e seus alunos é um exemplo de um relacionamento um para muitos: uma turma pode ter vários alunos, mas cada aluno pertence a apenas uma turma.

Diagrama ER:

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuração do Campo:

![alt text](https://static-docs.nocobase.com/a608ce5421172dad7e8ab760107ff4e.png)

## Descrição dos Parâmetros

### Coleção de Origem

A coleção de origem, que é a coleção onde o campo atual está.

### Coleção de Destino

A coleção de destino, ou seja, a coleção com a qual você quer associar.

### Chave de Origem

O campo da coleção de origem que é referenciado pela chave estrangeira. Ele precisa ser único.

### Chave Estrangeira

O campo da coleção de destino que é usado para estabelecer a associação entre as duas coleções.

### Chave de Destino

O campo da coleção de destino usado para visualizar cada registro no bloco de relacionamento, geralmente um campo único.

### ON DELETE

ON DELETE se refere às regras aplicadas às referências de chave estrangeira em coleções filhas relacionadas quando você exclui registros da coleção pai. É uma opção usada ao definir uma restrição de chave estrangeira. As opções comuns de ON DELETE incluem:

- **CASCADE**: Quando um registro na coleção pai é excluído, todos os registros relacionados na coleção filha são automaticamente excluídos.
- **SET NULL**: Quando um registro na coleção pai é excluído, os valores da chave estrangeira nos registros relacionados da coleção filha são definidos como NULL.
- **RESTRICT**: A opção padrão, ela impede a exclusão de um registro da coleção pai se houver registros relacionados na coleção filha.
- **NO ACTION**: Semelhante a RESTRICT, impede a exclusão de um registro da coleção pai se houver registros relacionados na coleção filha.