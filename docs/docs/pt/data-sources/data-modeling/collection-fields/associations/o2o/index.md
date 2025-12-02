:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Um para Um

Na relação entre funcionários e perfis pessoais, cada funcionário pode ter apenas um registro de perfil pessoal, e cada registro de perfil pessoal pode corresponder a apenas um funcionário. Nesse caso, a relação entre funcionário e perfil pessoal é de um para um.

A chave estrangeira em uma relação um para um pode ser colocada tanto na **coleção** de origem quanto na **coleção** de destino. Se ela representa "tem um(a)", a chave estrangeira é mais apropriadamente colocada na **coleção** de destino; se representa "pertence a", então a chave estrangeira é melhor colocada na **coleção** de origem.

Por exemplo, no caso mencionado acima, onde um funcionário tem apenas um perfil pessoal e o perfil pessoal pertence ao funcionário, é apropriado colocar a chave estrangeira na **coleção** de perfis pessoais.

## Um para Um (Tem Um)

Isso indica que um funcionário tem um registro de perfil pessoal.

Relação ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuração do Campo

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Um para Um (Pertence a)

Isso indica que um perfil pessoal pertence a um funcionário específico.

Relação ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98753ca24ac72d.png)

Configuração do Campo

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Descrição dos Parâmetros

### Source collection

A **coleção** de origem, que é a **coleção** onde o campo atual está localizado.

### Target collection

A **coleção** de destino, a **coleção** que está sendo relacionada.

### Foreign key

Usada para estabelecer uma relação entre duas **coleções**. Em uma relação um para um, a chave estrangeira pode ser colocada tanto na **coleção** de origem quanto na **coleção** de destino. Se ela representa "tem um(a)", a chave estrangeira é mais apropriadamente colocada na **coleção** de destino; se representa "pertence a", então a chave estrangeira é melhor colocada na **coleção** de origem.

### Source key <- Foreign key (Chave Estrangeira na Coleção de Destino)

A chave de origem, ou seja, o campo referenciado pela restrição de chave estrangeira, deve ser único. Quando a chave estrangeira é colocada na **coleção** de destino, ela indica "tem um(a)".

### Target key <- Foreign key (Chave Estrangeira na Coleção de Origem)

A chave de destino, ou seja, o campo referenciado pela restrição de chave estrangeira, deve ser único. Quando a chave estrangeira é colocada na **coleção** de origem, ela indica "pertence a".

### ON DELETE

ON DELETE se refere às regras de ação para a referência da chave estrangeira na **coleção** filha relacionada ao excluir registros da **coleção** pai. É uma opção definida ao estabelecer uma restrição de chave estrangeira. As opções comuns de ON DELETE incluem:

- CASCADE: Ao excluir um registro na **coleção** pai, todos os registros relacionados na **coleção** filha são automaticamente excluídos.
- SET NULL: Ao excluir um registro na **coleção** pai, o valor da chave estrangeira nos registros relacionados na **coleção** filha é definido como NULL.
- RESTRICT: Opção padrão, onde a exclusão de um registro da **coleção** pai é recusada se existirem registros relacionados na **coleção** filha.
- NO ACTION: Semelhante ao RESTRICT, a exclusão de um registro da **coleção** pai é recusada se existirem registros relacionados na **coleção** filha.