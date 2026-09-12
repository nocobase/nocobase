---
title: "Fonte de dados REST API"
description: "Conecte dados de fontes REST API, mapeie recursos RESTful para Collections, configure o mapeamento das interfaces List/Get/Create/Update/Destroy e ofereça suporte a operações CRUD."
keywords: "Fonte de dados REST API,API externa,mapeamento de interfaces,mapeamento de Collection,NocoBase"
---

# Fonte de dados REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Introdução

Usado para conectar dados provenientes de uma REST API.

## Instalação

Este plugin é comercial. Para obter informações detalhadas sobre a ativação, consulte: [Guia de ativação de plugins comerciais](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Adicionar uma fonte REST API

Depois de ativar o plugin, selecione REST API no menu suspenso Add new do gerenciamento de fontes de dados.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configurar a fonte REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Adicionar uma Collection

Os recursos RESTful correspondem às Collections do NocoBase, como o recurso Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

A configuração correspondente na API do NocoBase é

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Consulte a documentação da API para conhecer a especificação completa de design da API do NocoBase

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Consulte a seção “NocoBase API - Core”

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

A configuração da Collection da fonte de dados REST API é a seguinte

### List

Configure o mapeamento da interface para consultar a lista de recursos

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Configure o mapeamento da interface para consultar os detalhes de um recurso

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Configure o mapeamento da interface para criar um recurso

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Configure o mapeamento da interface para atualizar um recurso
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Configure o mapeamento da interface para excluir um recurso

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

As interfaces List e Get são obrigatórias.
## Depurar a API

### Integração dos parâmetros da solicitação

Exemplo: configure parâmetros de paginação para a interface List (se a API de terceiros não oferecer suporte à paginação, os dados da lista obtidos serão paginados).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Observe que somente as variáveis adicionadas à interface entrarão em vigor.

| Nome do parâmetro de integração da API de terceiros | Parâmetro do NocoBase       |
| --------------------------------------------------- | --------------------------- |
| page                                                | {{request.params.page}}     |
| limit                                               | {{request.params.pageSize}} |

Clique em Try it out para depurar e visualizar o resultado da resposta.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Conversão do formato da resposta

O formato da resposta da API de terceiros pode não seguir o padrão do NocoBase. É necessário convertê-lo para que seja exibido corretamente no frontend.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Ajuste as regras de conversão de acordo com o formato da resposta da API de terceiros, para que estejam em conformidade com o padrão de saída do NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Descrição do processo de depuração

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Conversão das informações de erro

Quando ocorre um erro na API de terceiros, o formato das informações de erro da resposta pode não seguir o padrão do NocoBase. É necessário convertê-lo para que seja exibido corretamente no frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Quando a conversão das informações de erro não está configurada, por padrão elas são convertidas em informações de erro que incluem o código de status HTTP.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Depois de configurar a conversão das informações de erro para que estejam em conformidade com o padrão de saída do NocoBase, o frontend poderá exibir corretamente as informações de erro da API de terceiros.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variáveis

A fonte de dados REST API fornece três tipos de variáveis para a integração com as interfaces

- Variáveis personalizadas da fonte de dados
- Solicitação do NocoBase
- Resposta de terceiros

### Variáveis personalizadas da fonte de dados

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Solicitação do NocoBase

- Params: parâmetros de consulta da URL (Search Params); os Params variam de acordo com a interface;
- Headers: corpo da solicitação, que fornece principalmente algumas informações personalizadas do NocoBase no formato X-;
- Body: corpo da solicitação;
- Token: token de API da solicitação atual do NocoBase.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Resposta de terceiros

Atualmente, somente o Body da resposta é fornecido

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

As variáveis disponíveis durante a integração de cada interface são as seguintes:

### List

| Parâmetro               | Descrição                                                   |
| ----------------------- | ----------------------------------------------------------- |
| request.params.page     | Página atual                                                |
| request.params.pageSize | Quantidade por página                                       |
| request.params.filter   | Condição de filtro (deve estar no formato Filter do NocoBase) |
| request.params.sort     | Regra de ordenação (deve estar no formato Sort do NocoBase) |
| request.params.appends  | Campos carregados conforme necessário, geralmente usados para o carregamento sob demanda de campos de relação |
| request.params.fields   | Quais campos a interface deve retornar (lista de permissões) |
| request.params.except   | Quais campos devem ser excluídos (lista de bloqueio)      |

### Get

| Parâmetro                 | Descrição                                                   |
| ------------------------- | ----------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID dos dados atuais              |
| request.params.filter     | Condição de filtro (deve estar no formato Filter do NocoBase) |
| request.params.appends    | Campos carregados conforme necessário, geralmente usados para o carregamento sob demanda de campos de relação |
| request.params.fields     | Quais campos a interface deve retornar (lista de permissões) |
| request.params.except     | Quais campos devem ser excluídos (lista de bloqueio)      |

### Create

| Parâmetro                | Descrição              |
| ------------------------ | ---------------------- |
| request.params.whiteList | Lista de permissões     |
| request.params.blacklist | Lista de bloqueio       |
| request.body             | Dados iniciais a criar  |

### Update

| Parâmetro                 | Descrição                                                   |
| ------------------------- | ----------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID dos dados atuais              |
| request.params.filter     | Condição de filtro (deve estar no formato Filter do NocoBase) |
| request.params.whiteList  | Lista de permissões                                         |
| request.params.blacklist  | Lista de bloqueio                                           |
| request.body              | Dados a atualizar                                           |

### Destroy

| Parâmetro                 | Descrição                                                   |
| ------------------------- | ----------------------------------------------------------- |
| request.params.filterByTk | Obrigatório, geralmente o ID dos dados atuais              |
| request.params.filter     | Condição de filtro (deve estar no formato Filter do NocoBase) |

## Configurar campos

Extraia os metadados dos campos (Fields) dos dados das interfaces CRUD do recurso adaptado e use-os como campos da Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrair metadados dos campos.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Campos e visualização.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Editar campos (de forma semelhante a outras fontes de dados).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Adicionar um bloco da fonte de dados REST API

Depois de configurar a Collection, você poderá adicionar blocos à interface.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
