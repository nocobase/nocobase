:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Motor de Armazenamento: Amazon S3

Este é um motor de armazenamento baseado no Amazon S3. Antes de usá-lo, você precisará preparar a conta e as permissões necessárias.

## Parâmetros de Configuração

![Exemplo de Configuração do Motor de Armazenamento Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Dica}
Esta seção apresenta apenas os parâmetros específicos do motor de armazenamento Amazon S3. Para os parâmetros gerais, consulte [Parâmetros Comuns do Motor](./index#引擎通用参数).
:::

### Região

Informe a região de armazenamento do S3, por exemplo: `us-west-1`.

:::info{title=Dica}
Você pode visualizar as informações de região do seu bucket no [console do Amazon S3](https://console.aws.amazon.com/s3/), e você só precisa usar o prefixo da região (não o nome de domínio completo).
:::

### AccessKey ID

Informe o ID da AccessKey do Amazon S3.

### AccessKey Secret

Informe o Secret da AccessKey do Amazon S3.

### Bucket

Informe o nome do bucket S3.