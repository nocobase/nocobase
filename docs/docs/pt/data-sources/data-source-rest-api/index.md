---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Fonte de Dados REST API

## Introdução

Este plugin permite que você integre dados de fontes REST API de forma fluida.

## Instalação

Por ser um plugin comercial, você precisará fazer o upload e ativá-lo através do gerenciador de plugins.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Adicionando uma Fonte de Dados REST API

Após ativar o plugin, você pode adicionar uma fonte de dados REST API selecionando-a no menu suspenso "Adicionar novo" na seção de gerenciamento de fontes de dados.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configure a fonte de dados REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Adicionando uma Coleção

No NocoBase, um recurso RESTful é mapeado para uma coleção, como um recurso de Usuários.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Esses endpoints de API são mapeados no NocoBase da seguinte forma:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Para um guia completo sobre as especificações de design da API do NocoBase, consulte a documentação da API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consulte o capítulo "NocoBase API - Core" para informações detalhadas.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

A configuração da coleção para uma fonte de dados REST API inclui o seguinte:

### Listar

Mapeie a interface para visualizar uma lista de recursos.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Obter

Mapeie a interface para visualizar os detalhes de um recurso.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Criar

Mapeie a interface para criar um recurso.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Atualizar

Mapeie a interface para atualizar um recurso.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Excluir

Mapeie a interface para excluir um recurso.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

As interfaces Listar e Obter são de configuração obrigatória.

## Depurando a API

### Integração de parâmetros de requisição

Exemplo: Configure os parâmetros de paginação para a API Listar. Se a API de terceiros não suportar paginação nativamente, o NocoBase fará a paginação com base nos dados da lista recuperada.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Observe que apenas as variáveis adicionadas na interface terão efeito.

| Nome do parâmetro da API de terceiros | Parâmetro NocoBase                |
| ------------------------------------- | --------------------------------- |
| page                                  | {{request.params.page}}           |
| limit                                 | {{request.params.pageSize}}       |

Você pode clicar em "Experimentar" (Try it out) para depurar e visualizar a resposta.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformação do formato de resposta

O formato de resposta da API de terceiros pode não estar no padrão NocoBase, e precisa ser transformado antes de ser exibido corretamente no frontend.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Ajuste as regras de conversão com base no formato de resposta da API de terceiros para garantir que a saída esteja em conformidade com o padrão NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Descrição do processo de depuração

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variáveis

A fonte de dados REST API oferece três tipos de variáveis para a integração da API:

- Variáveis personalizadas da fonte de dados
- Variáveis de requisição do NocoBase
- Variáveis de resposta de terceiros

### Variáveis Personalizadas da Fonte de Dados

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Requisição NocoBase

- Params: Parâmetros de consulta da URL (Search Params), que variam dependendo da interface.
- Headers: Cabeçalhos de requisição personalizados, fornecendo principalmente informações X- específicas do NocoBase.
- Body: O corpo da requisição.
- Token: O token da API para a requisição atual do NocoBase.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Respostas de Terceiros

Atualmente, apenas o corpo da resposta está disponível.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Abaixo estão as variáveis disponíveis para cada interface:

### Listar

| Parâmetro               | Descrição                                                  |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Página atual                                               |
| request.params.pageSize | Número de itens por página                                 |
| request.params.filter   | Critérios de filtro (devem seguir o formato de Filtro do NocoBase) |
| request.params.sort     | Critérios de ordenação (devem seguir o formato de Ordenação do NocoBase) |
| request.params.appends  | Campos a serem carregados sob demanda, geralmente para campos de associação |
| request.params.fields   | Campos a serem incluídos (lista de permissões)             |
| request.params.except   | Campos a serem excluídos (lista de bloqueios)              |

### Obter

| Parâmetro                 | Descrição                                                  |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID do registro atual             |
| request.params.filter     | Critérios de filtro (devem seguir o formato de Filtro do NocoBase) |
| request.params.appends    | Campos a serem carregados sob demanda, geralmente para campos de associação |
| request.params.fields     | Campos a serem incluídos (lista de permissões)             |
| request.params.except     | Campos a serem excluídos (lista de bloqueios)              |

### Criar

| Parâmetro                | Descrição                      |
| ------------------------ | ------------------------------ |
| request.params.whiteList | Lista de permissões            |
| request.params.blacklist | Lista de bloqueios             |
| request.body             | Dados iniciais para criação    |

### Atualizar

| Parâmetro                 | Descrição                                                  |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID do registro atual             |
| request.params.filter     | Critérios de filtro (devem seguir o formato de Filtro do NocoBase) |
| request.params.whiteList  | Lista de permissões                                        |
| request.params.blacklist  | Lista de bloqueios                                         |
| request.body              | Dados para atualização                                     |

### Excluir

| Parâmetro                 | Descrição                                                  |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID do registro atual             |
| request.params.filter     | Critérios de filtro (devem seguir o formato de Filtro do NocoBase) |

## Configuração de Campos

Os metadados dos campos (Fields) são extraídos dos dados da interface CRUD do recurso adaptado para servir como os campos da coleção.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrair metadados dos campos.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Campos e pré-visualização.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edite os campos (de forma similar a outras fontes de dados).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Adicionando Blocos da Fonte de Dados REST API

Depois que a coleção estiver configurada, você poderá adicionar blocos à interface.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)