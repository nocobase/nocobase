---
title: "Gerenciador de arquivos"
description: "Tabela de arquivos, campo de anexos e mecanismos de armazenamento, com suporte a armazenamento local, Alibaba Cloud OSS, Amazon S3 e Tencent Cloud COS, para gerenciar metadados e uploads de arquivos."
keywords: "Gerenciador de arquivos,tabela de arquivos,campo de anexos,mecanismo de armazenamento,OSS,S3,COS,NocoBase"
---

# Gerenciador de arquivos

<PluginInfo name="file-manager"></PluginInfo>

## Introdução

O plugin Gerenciador de arquivos fornece tabelas de arquivos, campos de anexos e mecanismos de armazenamento de arquivos para gerenciar arquivos de forma eficiente. Um arquivo é um registro de tabela de dados com uma estrutura específica. Essa tabela de dados é chamada de tabela de arquivos e é usada para armazenar os metadados dos arquivos, que podem ser gerenciados pelo Gerenciador de arquivos. Um campo de anexos é um campo de relação específico associado a uma tabela de arquivos. Os arquivos são compatíveis com vários métodos de armazenamento. Atualmente, os mecanismos de armazenamento de arquivos compatíveis incluem armazenamento local, Alibaba Cloud OSS, Amazon S3 e Tencent Cloud COS.

## Manual do usuário

### Tabela de arquivos

A tabela attachments vem integrada e é usada para armazenar os arquivos associados a todos os campos de anexos. Além disso, também é possível criar novas tabelas de arquivos para armazenar arquivos específicos.

[Consulte a documentação de introdução às tabelas de arquivos para obter mais informações](/data-sources/file-manager/file-collection)

### Campo de anexos

Um campo de anexos é um campo de relação específico associado a uma tabela de arquivos. Ele pode ser criado por meio de um «campo do tipo anexo» ou configurado por meio de um «campo de relação».

[Consulte a documentação de introdução aos campos de anexos para obter mais informações](/data-sources/file-manager/field-attachment)

### Mecanismo de armazenamento de arquivos

Os mecanismos de armazenamento de arquivos são usados para salvar arquivos em serviços específicos, incluindo armazenamento local (salvamento no disco rígido do servidor), armazenamento em nuvem e outros.

[Consulte a introdução aos mecanismos de armazenamento de arquivos para obter mais informações](./storage/index.md)

### API HTTP

O upload de arquivos pode ser processado por meio da API HTTP. Consulte [API HTTP](./http-api.md).

## Desenvolvimento de extensões

*