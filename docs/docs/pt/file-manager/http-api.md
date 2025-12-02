:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# API HTTP

O upload de arquivos para campos de anexo e **coleções** de arquivos é suportado via API HTTP. O método de invocação difere dependendo do motor de armazenamento usado pelo campo de anexo ou pela **coleção** de arquivos.

## Upload pelo Servidor

Para motores de armazenamento de código aberto integrados ao projeto, como S3, OSS e COS, a chamada da API HTTP é a mesma função de upload da interface do usuário, e os arquivos são enviados via servidor. Para chamar a API, você precisa passar um token JWT baseado no login do usuário através do cabeçalho de requisição `Authorization`; caso contrário, o acesso será negado.

### Campo de Anexo

Inicie uma ação `create` no recurso de anexos (`attachments`), envie uma requisição POST e faça o upload do conteúdo binário através do campo `file`. Após a chamada, o arquivo será enviado para o motor de armazenamento padrão.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Para fazer o upload de um arquivo para um motor de armazenamento diferente, você pode usar o parâmetro `attachmentField` para especificar o motor de armazenamento configurado para o campo da **coleção** (se não configurado, ele será enviado para o motor de armazenamento padrão).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### **Coleção** de Arquivos

O upload para uma **coleção** de arquivos gerará automaticamente um registro de arquivo. Inicie uma ação `create` no recurso da **coleção** de arquivos, envie uma requisição POST e faça o upload do conteúdo binário através do campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Ao fazer o upload para uma **coleção** de arquivos, não é necessário especificar um motor de armazenamento; o arquivo será enviado para o motor de armazenamento configurado para aquela **coleção**.

## Upload pelo Cliente

Para motores de armazenamento compatíveis com S3, fornecidos através do **plugin** comercial S3-Pro, o upload via API HTTP precisa ser chamado em várias etapas.

### Campo de Anexo

1.  Obter Informações do Motor de Armazenamento

    Inicie uma ação `getBasicInfo` na **coleção** de armazenamentos (`storages`), incluindo o nome do armazenamento, para solicitar as informações de configuração do motor de armazenamento.

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

2.  Obter Informações Pré-assinadas do Provedor de Serviço

    Inicie uma ação `createPresignedUrl` no recurso `fileStorageS3`, envie uma requisição POST e inclua informações relacionadas ao arquivo no corpo (body) para obter as informações de upload pré-assinadas.

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
    > * name: Nome do arquivo
    > * size: Tamanho do arquivo (em bytes)
    > * type: O tipo MIME do arquivo. Você pode consultar: [Tipos MIME comuns](https://developer.mozilla.org/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: O ID do motor de armazenamento (o campo `id` retornado na primeira etapa)
    > * storageType: O tipo do motor de armazenamento (o campo `type` retornado na primeira etapa)
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

3.  Upload do Arquivo

    Use o `putUrl` retornado para iniciar uma requisição `PUT` e fazer o upload do arquivo como corpo (body).

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Observação:
    > * putUrl: O campo `putUrl` retornado na etapa anterior
    > * file_path: O caminho local do arquivo a ser enviado
    > 
    > Exemplo de dados da requisição:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Criar Registro de Arquivo

    Após um upload bem-sucedido, inicie uma ação `create` no recurso de anexos (`attachments`), enviando uma requisição POST para criar o registro do arquivo.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Descrição dos dados dependentes em data-raw:
    > * title: O campo `fileInfo.title` retornado na etapa anterior
    > * filename: O campo `fileInfo.key` retornado na etapa anterior
    > * extname: O campo `fileInfo.extname` retornado na etapa anterior
    > * path: Vazio por padrão
    > * size: O campo `fileInfo.size` retornado na etapa anterior
    > * url: Vazio por padrão
    > * mimetype: O campo `fileInfo.mimetype` retornado na etapa anterior
    > * meta: O campo `fileInfo.meta` retornado na etapa anterior
    > * storageId: O campo `id` retornado na primeira etapa
    > 
    > Exemplo de dados da requisição:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### **Coleção** de Arquivos

As três primeiras etapas são as mesmas do upload de campos de anexo, mas na quarta etapa, você precisa criar um registro de arquivo, iniciando uma ação `create` no recurso da **coleção** de arquivos, enviando uma requisição POST e fazendo o upload das informações do arquivo via corpo (body).

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Descrição dos dados dependentes em data-raw:
> * title: O campo `fileInfo.title` retornado na etapa anterior
> * filename: O campo `fileInfo.key` retornado na etapa anterior
> * extname: O campo `fileInfo.extname` retornado na etapa anterior
> * path: Vazio por padrão
> * size: O campo `fileInfo.size` retornado na etapa anterior
> * url: Vazio por padrão
> * mimetype: O campo `fileInfo.mimetype` retornado na etapa anterior
> * meta: O campo `fileInfo.meta` retornado na etapa anterior
> * storageId: O campo `id` retornado na primeira etapa
> 
> Exemplo de dados da requisição:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```