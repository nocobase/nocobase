:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Campo de Anexo

## Introdução

O sistema possui um tipo de campo "Anexo" integrado para permitir que você faça upload de arquivos em suas **coleções** personalizadas.

Internamente, o campo de anexo é um campo de relacionamento muitos-para-muitos que aponta para a **coleção** "Anexos" (`attachments`) integrada do sistema. Quando você cria um campo de anexo em qualquer **coleção**, uma tabela de junção muitos-para-muitos é gerada automaticamente. Os metadados dos arquivos enviados são armazenados na **coleção** "Anexos", e as informações dos arquivos referenciados em sua **coleção** são vinculadas através desta tabela de junção.

## Configuração do Campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrição de Tipo MIME

Usado para restringir os tipos de arquivos permitidos para upload, utilizando a sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por exemplo, `image/*` representa arquivos de imagem. Vários tipos podem ser separados por vírgulas, como `image/*,application/pdf`, que permite arquivos de imagem e PDF.

### Motor de Armazenamento

Selecione o motor de armazenamento para os arquivos enviados. Se deixado em branco, o motor de armazenamento padrão do sistema será usado.