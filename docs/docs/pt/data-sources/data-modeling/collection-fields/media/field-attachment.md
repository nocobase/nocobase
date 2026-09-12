---
title: "Campo de anexos"
description: "Campo de anexos, associado à tabela de arquivos para armazenar imagens, documentos e outros arquivos."
keywords: "Campo de anexos,field-attachment,associação de arquivos,imagens,documentos,NocoBase"
---

# Campo de anexos

## Introdução

O sistema possui um campo integrado do tipo "Anexo", usado para permitir que os usuários carreguem arquivos em tabelas de dados personalizadas.

Internamente, o campo de anexos é um campo de relacionamento muitos-para-muitos que aponta para uma tabela de arquivos integrada ao sistema, chamada "Anexo" (`attachments`). Depois que um campo de anexos é criado em qualquer tabela de dados, uma tabela intermediária para o relacionamento muitos-para-muitos com a tabela de anexos é gerada automaticamente. Os metadados dos arquivos carregados são armazenados na tabela "Anexo", enquanto as informações dos arquivos referenciados na tabela de dados são associadas por meio dessa tabela intermediária.

## Configuração do campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrição de tipos MIME

Usado para restringir os tipos de arquivo permitidos para upload, utilizando a sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types) para descrever o formato. Por exemplo: `image/*` representa arquivos de imagem. Vários tipos podem ser separados por vírgulas em inglês, como: `image/*,application/pdf` representa arquivos dos tipos imagem e PDF.

### Mecanismo de armazenamento

Selecione o mecanismo de armazenamento usado para armazenar os arquivos carregados. Se não for preenchido, será usado o mecanismo de armazenamento padrão do sistema.