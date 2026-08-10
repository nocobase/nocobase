---
title: "API HTTP do gerenciador de arquivos"
description: "Os campos de anexos e as tabelas de arquivos fazem upload de arquivos por meio da API HTTP, com upload pelo servidor (S3/OSS/COS), upload direto pelo cliente e suporte à autenticação JWT e à especificação do mecanismo de armazenamento."
keywords: "API HTTP de upload de arquivos,attachments create,upload pelo servidor,upload direto pelo cliente,NocoBase"
---

# API HTTP

O upload de arquivos dos campos de anexos e das tabelas de arquivos pode ser processado por meio da API HTTP. Dependendo do mecanismo de armazenamento utilizado pelo anexo ou pela tabela de arquivos, há diferentes formas de chamada.

## Upload pelo servidor

Para mecanismos de armazenamento de código aberto integrados ao projeto, como S3, OSS e COS, a API HTTP utiliza a mesma chamada da função de upload da interface do usuário, e todos os arquivos são enviados pelo servidor. As chamadas à API devem incluir, no cabeçalho de requisição `Authorization`, um token JWT baseado no login do usuário; caso contrário, o acesso será recusado.

### Campo de anexos

Envie uma requisição POST ao recurso da tabela de anexos (`attachments`), executando a operação `create`, e faça o upload do conteúdo binário por meio do campo `file`. Após a chamada, o arquivo será enviado ao mecanismo de armazenamento padrão.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Para enviar o arquivo a um mecanismo de armazenamento diferente, use o parâmetro `attachmentField` para especificar o mecanismo de armazenamento configurado para o campo da tabela de dados (se não estiver configurado, o arquivo será enviado ao mecanismo de armazenamento padrão).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Tabela de arquivos

O upload para uma tabela de arquivos gera automaticamente um registro de arquivo. Envie uma requisição POST ao recurso da tabela de arquivos, executando a operação `create`, e faça o upload do conteúdo binário por meio do campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Não é necessário especificar o mecanismo de armazenamento ao fazer upload para uma tabela de arquivos; o arquivo será enviado ao mecanismo de armazenamento configurado para essa tabela.

## Upload pelo cliente

Para mecanismos de armazenamento compatíveis com S3 fornecidos pelo plug-in comercial S3-Pro, o upload pela API HTTP precisa ser realizado em várias etapas.

### Campo de anexos

1.  Obter informações do mecanismo de armazenamento

    Execute a operação `getBasicInfo` no recurso da tabela de armazenamento (storages), incluindo o identificador do espaço de armazenamento (storage name), para solicitar as informações de configuração do mecanismo de armazenamento.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exemplo das informações de configuração retornadas pelo mecanismo de armazenamento:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obter informações pré-assinadas do provedor

    Envie uma requisição POST ao recurso `fileStorageS3`, executando a operação `createPresignedUrl`, e inclua no body as informações relacionadas ao arquivo para obter as informações de upload pré-assinado.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Observação:
    >
    > * name: nome do arquivo
    > * size: tamanho do arquivo (em bytes)
    > * type: tipo MIME do arquivo. Consulte: [Tipos MIME comuns](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID do mecanismo de armazenamento (campo `id` retornado na primeira etapa)
    > * storageType: tipo do mecanismo de armazenamento (campo `type` retornado na primeira etapa)
    >
    > Exemplo de dados da requisição:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    A estrutura dos dados das informações pré-assinadas obtidas é a seguinte:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Upload do arquivo

    Use o `putUrl` retornado para fazer uma requisição `PUT` e envie o arquivo como body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Observação:
    > * putUrl: campo `putUrl` retornado na etapa anterior
    > * file_path: caminho do arquivo local a ser enviado
    >
    > Exemplo de dados da requisição:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Criar o registro do arquivo

    Após o upload ser concluído, envie uma requisição POST ao recurso da tabela de anexos (`attachments`), executando a operação `create`, para criar o registro do arquivo.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Descrição dos dados necessários em data-raw:
    > * title: campo `fileInfo.title` retornado na etapa anterior
    > * filename: campo `fileInfo.key` retornado na etapa anterior
    > * extname: campo `fileInfo.extname` retornado na etapa anterior
    > * path: vazio por padrão
    > * size: campo `fileInfo.size` retornado na etapa anterior
    > * url: vazio por padrão
    > * mimetype: campo `fileInfo.mimetype` retornado na etapa anterior
    > * meta: campo `fileInfo.meta` retornado na etapa anterior
    > * storageId: campo `id` retornado na primeira etapa
    >
    > Exemplo de dados da requisição:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Tabela de arquivos

As três primeiras etapas são iguais às do upload de um campo de anexos, mas na quarta etapa é necessário criar o registro do arquivo. Envie uma requisição POST ao recurso da tabela de arquivos, executando a operação create, e envie as informações do arquivo no body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Descrição dos dados necessários em data-raw:
> * title: campo `fileInfo.title` retornado na etapa anterior
> * filename: campo `fileInfo.key` retornado na etapa anterior
> * extname: campo `fileInfo.extname` retornado na etapa anterior
> * path: vazio por padrão
> * size: campo `fileInfo.size` retornado na etapa anterior
> * url: vazio por padrão
> * mimetype: campo `fileInfo.mimetype` retornado na etapa anterior
> * meta: campo `fileInfo.meta` retornado na etapa anterior
> * storageId: campo `id` retornado na primeira etapa
>
> Exemplo de dados da requisição:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```