# Motor de Armazenamento: Aliyun OSS

Um motor de armazenamento baseado no Aliyun OSS. Antes de usá-lo, você precisará preparar a conta e as permissões necessárias.


:::warning Observação

Este mecanismo não oferece acesso privado. Depois que um arquivo é enviado, o NocoBase gera uma URL diretamente acessível, e qualquer pessoa com essa URL pode acessar o arquivo.

Mesmo que o bucket OSS seja privado, o mecanismo integrado Aliyun OSS não gera URLs assinadas temporárias para acesso a arquivos. Se precisar de acesso privado, use [S3 Pro](./s3-pro). Se já houver arquivos históricos, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).

:::

## Parâmetros de Configuração

![Exemplo de Configuração do Motor de Armazenamento Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Dica}
Esta seção apresenta apenas os parâmetros específicos do motor de armazenamento Aliyun OSS. Para os parâmetros gerais, consulte [Parâmetros Gerais do Motor](./index#引擎通用参数).
:::

### Região

Insira a região de armazenamento do OSS, por exemplo: `oss-cn-hangzhou`.

:::info{title=Dica}
Você pode visualizar as informações de região do seu bucket no [Console Aliyun OSS](https://oss.console.aliyun.com/). Você só precisa usar o prefixo da região (não o nome de domínio completo).
:::

### AccessKey ID

Insira o ID da sua chave de acesso do Aliyun.

### AccessKey Secret

Insira o Secret da sua chave de acesso do Aliyun.

### Bucket

Insira o nome do bucket do OSS.

### Tempo Limite

Insira o tempo limite para upload no Aliyun OSS, em milissegundos. O valor padrão é `60000` milissegundos (ou seja, 60 segundos).