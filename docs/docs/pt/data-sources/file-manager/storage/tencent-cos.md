---
title: "腾讯云 COS"
description: "Configuração do mecanismo de armazenamento Tencent Cloud COS: Bucket, Region, SecretId e upload de arquivos para armazenamento de objetos."
keywords: "腾讯云 COS,腾讯云对象存储,COS 存储,云存储,NocoBase"
---

# Tencent Cloud COS

Baseado no Tencent Cloud COS, o mecanismo de armazenamento requer a preparação de contas e permissões relevantes antes do uso.

## Parâmetros de configuração

![Exemplo de configuração do mecanismo de armazenamento Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Dica}
São apresentados apenas os parâmetros específicos do mecanismo de armazenamento Tencent Cloud COS. Para os parâmetros gerais, consulte[os parâmetros gerais do mecanismo](./index.md#引擎通用参数).
:::

### Região

Informe a região do armazenamento COS, por exemplo: `ap-chengdu`.

:::info{title=Dica}
Você pode consultar as informações da região do espaço de armazenamento no[console do Tencent Cloud COS](https://console.cloud.tencent.com/cos). É necessário apenas extrair o prefixo da região (não é necessário usar o nome de domínio completo).
:::

### SecretId

Informe o ID da chave de acesso autorizada da Tencent Cloud.

### SecretKey

Informe o Secret da chave de acesso autorizada da Tencent Cloud.

### Bucket

Informe o nome do bucket do armazenamento COS, por exemplo: `qing-cdn-1234189398`.