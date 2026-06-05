:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Tencent Cloud COS

Um motor de armazenamento baseado no Tencent Cloud COS. Antes de usar, você precisa preparar a conta e as permissões relevantes.

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