:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Tencent COS

Um motor de armazenamento baseado no Tencent Cloud COS. Antes de usar, você precisa preparar a conta e as permissões relevantes.

## Opções de Configuração

![Exemplo de opções de configuração do Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Dica}
Esta seção aborda apenas as opções específicas para o motor de armazenamento Tencent Cloud COS. Para parâmetros comuns, consulte [Parâmetros Comuns do Motor](./index.md#common-engine-parameters).
:::

### Região

Preencha a região de armazenamento do COS, por exemplo: `ap-chengdu`.

:::info{title=Dica}
Você pode visualizar as informações de região do bucket de armazenamento no [Console Tencent Cloud COS](https://console.cloud.tencent.com/cos), e só precisa usar a parte do prefixo da região (sem o nome de domínio completo).
:::

### SecretId

Preencha o ID da chave de acesso autorizada do Tencent Cloud.

### SecretKey

Preencha o Secret da chave de acesso autorizada do Tencent Cloud.

### Bucket

Preencha o nome do bucket COS, por exemplo: `qing-cdn-1234189398`.