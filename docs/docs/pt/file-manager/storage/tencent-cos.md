# Tencent Cloud COS

Um motor de armazenamento baseado no Tencent Cloud COS. Antes de usar, você precisa preparar a conta e as permissões relevantes.


:::warning Observação

Este mecanismo não oferece acesso privado. Depois que um arquivo é enviado, o NocoBase gera uma URL diretamente acessível, e qualquer pessoa com essa URL pode acessar o arquivo.

Mesmo que o bucket COS seja privado, o mecanismo integrado Tencent COS não gera URLs assinadas temporárias para acesso a arquivos. Se precisar de acesso privado, use [S3 Pro](./s3-pro). Se já houver arquivos históricos, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).

:::

## Parâmetros de Configuração

![Exemplo de Configuração do Motor de Armazenamento Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Observação}
Esta seção apresenta apenas os parâmetros específicos para o motor de armazenamento Tencent Cloud COS. Para parâmetros gerais, consulte [Parâmetros Gerais do Motor](./index.md#general-engine-parameters).
:::

### Região

Insira a região de armazenamento do COS, por exemplo: `ap-chengdu`.

:::info{title=Observação}
Você pode visualizar as informações de região do seu *bucket* no [Console do Tencent Cloud COS](https://console.cloud.tencent.com/cos). Você só precisa usar o prefixo da região (não o nome de domínio completo).
:::

### SecretId

Insira o ID da sua chave de acesso do Tencent Cloud.

### SecretKey

Insira o Secret da sua chave de acesso do Tencent Cloud.

### Bucket

Insira o nome do *bucket* do COS, por exemplo: `qing-cdn-1234189398`.