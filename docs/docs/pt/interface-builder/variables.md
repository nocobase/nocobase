:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Variáveis

## Introdução

Variáveis são um conjunto de tokens usados para identificar um valor no contexto atual. Você pode usá-las em cenários como a configuração de escopos de dados de blocos, valores padrão de campos, regras de vinculação e **fluxos de trabalho**.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Variáveis Atualmente Suportadas

### Usuário Atual

Representa os dados do usuário atualmente logado.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Papel Atual

Representa o identificador do papel (nome do papel) do usuário atualmente logado.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Formulário Atual

Os valores do formulário atual, usados apenas em blocos de formulário. Os casos de uso incluem:

- Regras de vinculação para o formulário atual
- Valores padrão para campos de formulário (válido apenas ao adicionar novos dados)
- Configurações de escopo de dados para campos de relacionamento
- Configuração de atribuição de valor de campo para ações de envio

#### Regras de vinculação para o formulário atual

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Valores padrão para campos de formulário (apenas formulário de adição)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

#### Configurações de escopo de dados para campos de relacionamento

Usado para filtrar dinamicamente as opções de um campo secundário com base em um campo primário, garantindo a entrada de dados precisa.

**Exemplo:**

1. O usuário seleciona um valor para o campo **Owner**.
2. O sistema filtra automaticamente as opções para o campo **Account** com base no **userName** do Owner selecionado.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

### Registro Atual

Um registro se refere a uma linha em uma **coleção**, onde cada linha representa um único registro. A variável "Registro Atual" está disponível nas **regras de vinculação para ações de linha** de blocos do tipo exibição.

Exemplo: Desative o botão de exclusão para documentos que estão "Pagos".

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Registro do Pop-up Atual

As ações de pop-up desempenham um papel muito importante na configuração da interface do NocoBase.

- Pop-up para ações de linha: Cada pop-up tem uma variável "Registro do Pop-up Atual", representando o registro da linha atual.
- Pop-up para campos de relacionamento: Cada pop-up tem uma variável "Registro do Pop-up Atual", representando o registro de relacionamento clicado atualmente.

Blocos dentro de um pop-up podem usar a variável "Registro do Pop-up Atual". Os casos de uso relacionados incluem:

- Configurar o escopo de dados de um bloco
- Configurar o escopo de dados de um campo de relacionamento
- Configurar valores padrão para campos (em um formulário para adicionar novos dados)
- Configurar regras de vinculação para ações

### Parâmetros de Consulta da URL

Esta variável representa os parâmetros de consulta na URL da página atual. Ela só está disponível quando uma string de consulta existe na URL da página. É mais conveniente usá-la com a [ação de Link](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### Token da API

O valor desta variável é uma string, que é uma credencial para acessar a API do NocoBase. Ela pode ser usada para verificar a identidade do usuário.

### Tipo de Dispositivo Atual

Exemplo: Não exibir a ação "Imprimir modelo" em dispositivos que não sejam computadores.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)