:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# API HTTP

O upload de arquivos para campos de anexo e coleções de arquivos pode ser feito via API HTTP. A forma de invocação difere dependendo do motor de armazenamento usado pelo anexo ou pela coleção de arquivos.

## Upload pelo Servidor

Para motores de armazenamento de código aberto integrados, como S3, OSS e COS, a chamada da API HTTP é a mesma usada pelo recurso de upload da interface do usuário, onde os arquivos são enviados pelo servidor. As chamadas da API exigem que um token JWT baseado no login do usuário seja passado no cabeçalho `Authorization`; caso contrário, o acesso será negado.

### Campo de Anexo

Inicie uma ação `create` no recurso de anexos (`attachments`) enviando uma requisição POST e faça o upload do conteúdo binário através do campo `file`. Após a chamada, o arquivo será enviado para o motor de armazenamento padrão.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Para fazer o upload de arquivos para um motor de armazenamento diferente, você pode usar o parâmetro `attachmentField` para especificar o motor de armazenamento configurado para o campo da **coleção**. Se não for configurado, o arquivo será enviado para o motor de armazenamento padrão.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Coleção de Arquivos

O upload para uma **coleção** de arquivos gerará automaticamente um registro de arquivo. Inicie uma ação `create` no recurso da **coleção** de arquivos enviando uma requisição POST e faça o upload do conteúdo binário através do campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Ao fazer o upload para uma **coleção** de arquivos, não é necessário especificar um motor de armazenamento; o arquivo será enviado para o motor de armazenamento configurado para aquela **coleção**.

## Upload pelo Cliente

Para motores de armazenamento compatíveis com S3, fornecidos através do **plugin** comercial S3-Pro, o upload via API HTTP requer vários passos.

### Campo de Anexo

1.  Obter informações do motor de armazenamento

    Inicie uma ação `getBasicInfo` na **coleção** de armazenamentos (`storages`), incluindo o nome do armazenamento (`storage name`), para solicitar as informações de configuração do motor de armazenamento.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exemplo de informações de configuração do motor de armazenamento retornadas:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obter a URL pré-assinada do provedor de serviço

    Inicie uma ação `createPresignedUrl` no recurso `fileStorageS3` enviando uma requisição POST com informações relacionadas ao arquivo no corpo para obter as informações de upload pré-assinadas.

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
    > *   `name`: Nome do arquivo
    > *   `size`: Tamanho do arquivo (em bytes)
    > *   `type`: O tipo MIME do arquivo. Você pode consultar: [Tipos MIME comuns](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: O ID do motor de armazenamento (o campo `id` retornado na etapa 1).
    > *   `storageType`: O tipo do motor de armazenamento (o campo `type` retornado na etapa 1).
    >
    > Exemplo de dados da requisição:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    A estrutura de dados das informações pré-assinadas obtidas é a seguinte:

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

    Use a `putUrl` retornada para fazer uma requisição `PUT`, enviando o arquivo como corpo da requisição.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Observação:
    > * `putUrl`: O campo `putUrl` retornado na etapa anterior.
    > * `file_path`: O caminho local do arquivo a ser enviado.
    >
    > Exemplo de dados da requisição:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Criar o registro do arquivo

    Após um upload bem-sucedido, crie o registro do arquivo iniciando uma ação `create` no recurso de anexos (`attachments`) com uma requisição POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Explicação dos dados dependentes em `data-raw`:
    > *   `title`: O campo `fileInfo.title` retornado na etapa anterior.
    > *   `filename`: O campo `fileInfo.key` retornado na etapa anterior.
    > *   `extname`: O campo `fileInfo.extname` retornado na etapa anterior.
    > *   `path`: Vazio por padrão.
    > *   `size`: O campo `fileInfo.size` retornado na etapa anterior.
    > *   `url`: Vazio por padrão.
    > *   `mimetype`: O campo `fileInfo.mimetype` retornado na etapa anterior.
    > *   `meta`: O campo `fileInfo.meta` retornado na etapa anterior.
    > *   `storageId`: O campo `id` retornado na etapa 1.
    >
    > Exemplo de dados da requisição:
    >
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Coleção de Arquivos

As três primeiras etapas são as mesmas do upload para um campo de anexo. No entanto, na quarta etapa, você precisa criar o registro do arquivo iniciando uma ação `create` no recurso da **coleção** de arquivos com uma requisição POST, enviando as informações do arquivo no corpo.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Explicação dos dados dependentes em `data-raw`:
> *   `title`: O campo `fileInfo.title` retornado na etapa anterior.
> *   `filename`: O campo `fileInfo.key` retornado na etapa anterior.
> *   `extname`: O campo `fileInfo.extname` retornado na etapa anterior.
> *   `path`: Vazio por padrão.
> *   `size`: O campo `fileInfo.size` retornado na etapa anterior.
> *   `url`: Vazio por padrão.
> *   `mimetype`: O campo `fileInfo.mimetype` retornado na etapa anterior.
> *   `meta`: O campo `fileInfo.meta` retornado na etapa anterior.
> *   `storageId`: O campo `id` retornado na etapa 1.
>
> Exemplo de dados da requisição:
>
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```