---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Ação SQL

## Introdução

Em alguns cenários específicos, os nós de ação de coleção simples mencionados acima podem não ser capazes de lidar com operações complexas. Nesses casos, você pode usar o nó SQL diretamente para que o banco de dados execute instruções SQL complexas para manipulação de dados.

A diferença entre isso e conectar-se diretamente ao banco de dados para operações SQL fora do aplicativo é que, dentro de um fluxo de trabalho, você pode usar variáveis do contexto do processo como parâmetros na instrução SQL.

## Instalação

Plugin integrado, não requer instalação.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar um nó de “Ação SQL”:

![Adicionar Ação SQL](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Configuração do Nó

![Nó SQL_Configuração do Nó](https://static-docs.nocobase.com/20240904002334.png)

### Fonte de Dados

Selecione a fonte de dados para executar o SQL.

A fonte de dados deve ser do tipo banco de dados, como a fonte de dados principal, PostgreSQL ou outras fontes de dados compatíveis com Sequelize.

### Conteúdo SQL

Edite a instrução SQL. Atualmente, apenas uma instrução SQL é suportada.

Insira as variáveis necessárias usando o botão de variável no canto superior direito do editor. Antes da execução, essas variáveis serão substituídas pelos seus valores correspondentes por meio de substituição de texto. O texto resultante será então usado como a instrução SQL final e enviado ao banco de dados para consulta.

## Resultado da Execução do Nó

A partir da `v1.3.15-beta`, o resultado da execução de um nó SQL é um array de dados puros. Antes disso, era a estrutura de retorno nativa do Sequelize contendo metadados da consulta (veja: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Por exemplo, a seguinte consulta:

```sql
select count(id) from posts;
```

Resultado antes da `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Resultado após a `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Perguntas Frequentes

### Como usar o resultado de um nó SQL?

Se uma instrução `SELECT` for usada, o resultado da consulta será salvo no nó no formato JSON do Sequelize. Ele pode ser analisado e utilizado com o [plugin JSON-query](./json-query.md).

### A ação SQL aciona eventos de coleção?

**Não**. A ação SQL envia a instrução SQL diretamente ao banco de dados para processamento. As operações `CREATE` / `UPDATE` / `DELETE` relacionadas ocorrem no banco de dados, enquanto os eventos de coleção ocorrem na camada de aplicação do Node.js (tratados pelo ORM), portanto, os eventos de coleção não serão acionados.