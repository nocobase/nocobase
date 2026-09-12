---
title: "Alibaba Cloud OSS"
description: "Configuração do mecanismo de armazenamento Alibaba Cloud OSS: Bucket, Endpoint e AccessKey, com suporte a acessos pela rede pública e interna."
keywords: "Alibaba Cloud OSS, armazenamento de objetos Alibaba Cloud, armazenamento OSS, armazenamento em nuvem, NocoBase"
---

# Alibaba Cloud OSS

O mecanismo de armazenamento baseado no Alibaba Cloud OSS requer a preparação das contas e permissões correspondentes antes do uso.

## Parâmetros de configuração

![Exemplo de configuração do mecanismo de armazenamento Alibaba Cloud OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Observação}
Aqui são apresentados apenas os parâmetros específicos do mecanismo de armazenamento Alibaba Cloud OSS. Para os parâmetros gerais, consulte [Parâmetros gerais dos mecanismos](./index.md#引擎通用参数).
:::

### Região

Informe a região do armazenamento OSS, por exemplo: `oss-cn-hangzhou`.

:::info{title=Observação}
As informações da região do espaço de armazenamento podem ser consultadas no [console do Alibaba Cloud OSS](https://oss.console.aliyun.com/). Basta extrair o prefixo da região (não é necessário usar o nome de domínio completo).
:::

### AccessKey ID

Informe o ID da chave de acesso autorizada do Alibaba Cloud.

### AccessKey Secret

Informe o Secret da chave de acesso autorizada do Alibaba Cloud.

### Bucket

Informe o nome do bucket de armazenamento OSS.
