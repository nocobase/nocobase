---
pkg: "@nocobase/plugin-logger"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: '@nocobase/plugin-logger'
---

# Logs

## Introdução

Logs são uma ferramenta importante para nos ajudar a identificar problemas no sistema. Os logs de servidor do NocoBase incluem principalmente logs de requisições de interface e logs de operação do sistema, com suporte para configuração de nível de log, estratégia de rotação, tamanho, formato de impressão e muito mais. Este documento apresenta o conteúdo relacionado aos logs de servidor do NocoBase e como usar os recursos de empacotamento e download de logs de servidor fornecidos pelo **plugin** de logs.

## Configuração de Logs

Você pode configurar parâmetros relacionados a logs, como nível de log, método de saída e formato de impressão, por meio de [variáveis de ambiente](/get-started/installation/env.md#logger_transport).

## Formatos de Log

O NocoBase oferece suporte à configuração de quatro formatos de log diferentes.

### `console`

O formato padrão no ambiente de desenvolvimento, onde as mensagens são exibidas com cores destacadas.

```
2023-12-30 22:40:06 [info]  response                                     method=GET path=/api/uiSchemas:getJsonSchema/nocobase-admin-menu res={"status":200} action={"actionName":"getJsonSchema","resourceName":"uiSchemas","params":{"filterByTk":"nocobase-admin-menu","resourceName":"uiSchemas","resourceIndex":"nocobase-admin-menu","actionName":"getJsonSchema"}} userId=1 status=200 cost=5 app=main reqId=ccf4e3bd-beb0-4350-af6e-b1fc1d9b6c3f
2023-12-30 22:43:12 [debug] Database dialect: mysql                      module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
2023-12-30 22:43:12 [warn]  app is installed                             module=application method=install app=main reqId=31ffa8b5-f377-456b-a295-0c8a28938228
```

### `json`

O formato padrão no ambiente de produção.

```json
{
  "level": "info",
  "timestamp": "2023-12-26 22:04:56",
  "reqId": "7612ef42-58e8-4c35-bac2-2e6c9d8ec96e",
  "message": "response",
  "method": "POST",
  "path": "/api/authenticators:publicList",
  "res": { "status": 200 },
  "action": {
    "actionName": "publicList",
    "resourceName": "authenticators",
    "params": { "resourceName": "authenticators", "actionName": "publicList" }
  },
  "status": 200,
  "cost": 16
}
```

### `logfmt`

> https://brandur.org/logfmt.

```
level=info timestamp=2023-12-21 14:18:02 reqId=8b59a40d-68ee-4c97-8001-71a47a92805a
message=response method=POST path=/api/authenticators:publicList res={"status":200}
action={"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}
userId=undefined status=200 cost=14
```

### `delimiter`

Separado pelo delimitador `|`.

```
info|2023-12-26 22:07:09|13cd16f0-1568-418d-ac37-6771ee650e14|response|POST|/api/authenticators:publicList|{"status":200}|{"actionName":"publicList","resourceName":"authenticators","params":{"resourceName":"authenticators","actionName":"publicList"}}||200|25
```

## Diretório de Logs

A estrutura principal do diretório dos arquivos de log do NocoBase é:

- `storage/logs` - Diretório de saída dos logs
  - `main` - Nome da aplicação principal
    - `request_YYYY-MM-DD.log` - Log de requisições
    - `system_YYYY-MM-DD.log` - Log do sistema
    - `system_error_YYYY-MM-DD.log` - Log de erros do sistema
    - `sql_YYYY-MM-DD.log` - Log de execução de SQL
    - ...
  - `sub-app` - Nome da sub-aplicação
    - `request_YYYY-MM-DD.log`
    - ...

## Arquivos de Log

### Log de Requisições

`request_YYYY-MM-DD.log`, logs de requisições de interface e respostas.

| Campo         | Descrição                                  |
| ------------- | ------------------------------------------ |
| `level`       | Nível do log                               |
| `timestamp`   | Hora de impressão do log `YYYY-MM-DD hh:mm:ss` |
| `message`     | `request` ou `response`                    |
| `userId`      | Apenas em `response`                       |
| `method`      | Método da requisição                       |
| `path`        | Caminho da requisição                      |
| `req` / `res` | Conteúdo da requisição/resposta            |
| `action`      | Recursos e parâmetros da requisição       |
| `status`      | Código de status da resposta               |
| `cost`        | Duração da requisição                      |
| `app`         | Nome da aplicação atual                    |
| `reqId`       | ID da requisição                           |

:::info{title=Dica}
O `reqId` será enviado para o frontend através do cabeçalho de resposta `X-Request-Id`.
:::

### Log do Sistema

`system_YYYY-MM-DD.log`, logs de operação do sistema, incluindo aplicação, middleware, **plugins** e outros. Logs de nível `error` serão impressos separadamente em `system_error_YYYY-MM-DD.log`.

| Campo       | Descrição                                  |
| ----------- | ------------------------------------------ |
| `level`     | Nível do log                               |
| `timestamp` | Hora de impressão do log `YYYY-MM-DD hh:mm:ss` |
| `message`   | Mensagem do log                            |
| `module`    | Módulo                                     |
| `submodule` | Submódulo                                  |
| `method`    | Método chamado                             |
| `meta`      | Outras informações relacionadas, formato JSON |
| `app`       | Nome da aplicação atual                    |
| `reqId`     | ID da requisição                           |

### Log de Execução de SQL

`sql_YYYY-MM-DD.log`, logs de execução de SQL do banco de dados. As instruções `INSERT INTO` são limitadas aos primeiros 2000 caracteres.

| Campo       | Descrição                                  |
| ----------- | ------------------------------------------ |
| `level`     | Nível do log                               |
| `timestamp` | Hora de impressão do log `YYYY-MM-DD hh:mm:ss` |
| `sql`       | Instrução SQL                              |
| `app`       | Nome da aplicação atual                    |
| `reqId`     | ID da requisição                           |

## Empacotamento e Download de Logs

1. Entre na página de gerenciamento de logs.
2. Selecione os arquivos de log que você deseja baixar.
3. Clique no botão Download.

![2024-04-10_10-50-50](https://static-docs.nocobase.com/2024-04-10_10-50-50.png)

## Documentos Relacionados

- [Desenvolvimento de **Plugins** - Servidor - Logs](/plugin-development/server/logger)
- [Referência da API - @nocobase/logger](/api/logger/logger)