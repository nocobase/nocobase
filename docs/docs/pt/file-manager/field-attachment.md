:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Campo de Anexo

## Introdução

O sistema possui um tipo de campo "Anexo" integrado, que permite aos usuários fazer upload de arquivos em suas **coleções** personalizadas.

No fundo, o campo de Anexo é um campo de relacionamento Muitos-para-Muitos que aponta para a **coleção** interna de "Anexos" (`attachments`). Quando você cria um campo de Anexo em qualquer **coleção**, uma tabela de junção para o relacionamento Muitos-para-Muitos é gerada automaticamente. Os metadados dos arquivos enviados são armazenados na **coleção** "Anexos", e as informações dos arquivos referenciados na **coleção** são associadas por meio dessa tabela de junção.

## Configuração do Campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrições de Tipo MIME

Usado para restringir os tipos de arquivos permitidos para upload, utilizando o formato de sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por exemplo: `image/*` representa arquivos de imagem. Múltiplos tipos podem ser separados por vírgula, como: `image/*,application/pdf` permite arquivos de imagem e PDF.

### Mecanismo de Armazenamento

Selecione o mecanismo de armazenamento para os arquivos enviados. Se você deixar em branco, o mecanismo de armazenamento padrão do sistema será usado.