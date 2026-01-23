---
pkg: "@nocobase/plugin-file-manager"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Gerenciador de Arquivos

## Introdução

O plugin Gerenciador de Arquivos oferece uma coleção de arquivos, campo de anexo e motores de armazenamento de arquivos para gerenciar arquivos de forma eficaz. Arquivos são registros em um tipo especial de coleção, conhecida como coleção de arquivos, que armazena metadados de arquivos e pode ser gerenciada através do Gerenciador de Arquivos. Campos de anexo são campos de associação específicos relacionados à coleção de arquivos. O plugin suporta vários métodos de armazenamento, incluindo armazenamento local, Alibaba Cloud OSS, Amazon S3 e Tencent Cloud COS.

## Manual do Usuário

### Coleção de Arquivos

Uma coleção de anexos é integrada para armazenar todos os arquivos associados a campos de anexo. Além disso, novas coleções de arquivos podem ser criadas para armazenar arquivos específicos.

[Saiba mais na documentação da Coleção de Arquivos](/data-sources/file-manager/file-collection)

### Campo de Anexo

Campos de anexo são campos de associação específicos relacionados à coleção de arquivos, que podem ser criados através do tipo de campo "Anexo" ou configurados através de um campo de "Associação".

[Saiba mais na documentação do Campo de Anexo](/data-sources/file-manager/field-attachment)

### Motor de Armazenamento de Arquivos

O motor de armazenamento de arquivos é usado para salvar arquivos em serviços específicos, incluindo armazenamento local (salvando no disco rígido do servidor), armazenamento em nuvem, etc.

[Saiba mais na documentação do Motor de Armazenamento de Arquivos](./storage/index.md)

### API HTTP

Uploads de arquivos podem ser tratados via API HTTP, veja [API HTTP](./http-api.md).

## Desenvolvimento

*