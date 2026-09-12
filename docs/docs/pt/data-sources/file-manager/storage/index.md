---
title: "Motores de armazenamento de arquivos"
description: "Motores de armazenamento do campo de anexos: armazenamento local, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS, S3 Pro; configuração do título, caminho, URL de acesso etc."
keywords: "Armazenamento de arquivos,Storage,OSS,S3,COS,Armazenamento local,Armazenamento em nuvem,NocoBase"
---

# Visão geral

## Motores integrados

Atualmente, o NocoBase oferece suporte integrado aos seguintes tipos de motores:

- [Armazenamento local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Durante a instalação do sistema, um motor de armazenamento local é adicionado automaticamente e pode ser usado diretamente. Também é possível adicionar novos motores ou editar os parâmetros dos motores existentes.

## Parâmetros gerais do motor

Além dos parâmetros específicos de cada categoria de motor, os parâmetros a seguir são comuns a todos (usando o armazenamento local como exemplo):

![Exemplo de configuração do motor de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

Nome do motor de armazenamento, usado para identificação manual.

### Nome do sistema

Nome do sistema do motor de armazenamento, usado para identificação pelo sistema. Deve ser exclusivo no sistema; se não for preenchido, será gerado aleatoriamente pelo sistema.

### URL de acesso base

Parte do prefixo da URL pela qual o arquivo pode ser acessado externamente. Pode ser a URL de acesso base de uma CDN, por exemplo: “`https://cdn.nocobase.com/app`” (não é necessário incluir o “`/`” final).

### Caminho

Caminho relativo usado ao armazenar os arquivos. Ao acessá-los, essa parte também será concatenada automaticamente à URL final. Por exemplo: “`user/avatar`” (não é necessário incluir o “`/`” no início nem no final).

### Limite de tamanho do arquivo

Limite de tamanho para o upload de arquivos neste motor de armazenamento. Arquivos que excederem o tamanho definido não poderão ser enviados. O limite padrão do sistema é de 20 MB, podendo ser ajustado até o limite máximo de 1 GB.

### Tipo de arquivo

É possível restringir os tipos de arquivos enviados usando o formato descrito pela sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por exemplo: `image/*` representa arquivos de imagem. Vários tipos podem ser separados por vírgulas em inglês, como em: `image/*, application/pdf`, que permite arquivos de imagem e PDF.

### Motor de armazenamento padrão

Marque esta opção para defini-lo como o motor de armazenamento padrão do sistema. Quando nenhum motor de armazenamento for especificado no campo de anexos ou na tabela de arquivos, os arquivos enviados serão salvos no motor de armazenamento padrão. O motor de armazenamento padrão não pode ser excluído.

### Manter arquivos ao excluir registros

Quando marcada, os arquivos já enviados ao motor de armazenamento serão mantidos mesmo quando os registros de dados da tabela de anexos ou da tabela de arquivos forem excluídos. Por padrão, a opção não fica marcada; nesse caso, os arquivos do motor de armazenamento também serão excluídos ao excluir os registros.

:::info{title=Aviso}
Após o upload do arquivo, o caminho de acesso final será formado pela concatenação de várias partes:

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Por exemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::