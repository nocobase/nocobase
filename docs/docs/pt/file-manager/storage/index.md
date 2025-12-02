:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

## Introdução

Mecanismos de armazenamento são usados para salvar arquivos em serviços específicos, incluindo armazenamento local (salvo no disco rígido do servidor), armazenamento em nuvem, etc.

Antes de fazer upload de qualquer arquivo, você precisa configurar um mecanismo de armazenamento. O sistema adiciona automaticamente um mecanismo de armazenamento local durante a instalação, que pode ser usado diretamente. Você também pode adicionar novos mecanismos ou editar os parâmetros dos existentes.

## Tipos de Mecanismos de Armazenamento

Atualmente, o NocoBase oferece suporte integrado para os seguintes tipos de mecanismos:

- [Armazenamento Local](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

O sistema adiciona automaticamente um mecanismo de armazenamento local durante a instalação, que pode ser usado diretamente. Você também pode adicionar novos mecanismos ou editar os parâmetros dos existentes.

## Parâmetros Comuns

Além dos parâmetros específicos para diferentes tipos de mecanismos, os seguintes são parâmetros comuns (usando o armazenamento local como exemplo):

![Exemplo de configuração do mecanismo de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

O nome do mecanismo de armazenamento, para identificação humana.

### Nome do Sistema

O nome do sistema do mecanismo de armazenamento, usado para identificação do sistema. Deve ser único dentro do sistema. Se deixado em branco, o sistema gerará um aleatoriamente.

### Prefixo da URL Pública

A parte do prefixo da URL publicamente acessível para o arquivo. Pode ser a URL base de uma CDN, como: "`https://cdn.nocobase.com/app`" (sem a barra final "`/`").

### Caminho

O caminho relativo usado ao armazenar arquivos. Esta parte também será automaticamente anexada à URL final durante o acesso. Por exemplo: "`user/avatar`" (sem a barra inicial ou final "`/`").

### Limite de Tamanho do Arquivo

O limite de tamanho para arquivos enviados para este mecanismo de armazenamento. Arquivos que excederem este tamanho não poderão ser enviados. O limite padrão do sistema é de 20MB, e pode ser ajustado até um máximo de 1GB.

### Tipos de Arquivo

Você pode restringir os tipos de arquivos que podem ser enviados, usando a sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por exemplo: `image/*` representa arquivos de imagem. Múltiplos tipos podem ser separados por vírgulas, como: `image/*, application/pdf` que permite arquivos de imagem e PDF.

### Mecanismo de Armazenamento Padrão

Quando marcada, esta opção define o mecanismo como o mecanismo de armazenamento padrão do sistema. Quando um campo de anexo ou **coleção** de arquivos não especifica um mecanismo de armazenamento, os arquivos enviados serão salvos no mecanismo de armazenamento padrão. O mecanismo de armazenamento padrão não pode ser excluído.

### Manter arquivo ao excluir registro

Quando marcada, o arquivo enviado no mecanismo de armazenamento será mantido mesmo quando o registro de dados na **coleção** de anexos ou arquivos for excluído. Por padrão, esta opção não é marcada, o que significa que o arquivo no mecanismo de armazenamento será excluído junto com o registro.

:::info{title=Dica}
Após um arquivo ser enviado, o caminho de acesso final é construído concatenando várias partes:

```
<Prefixo da URL Pública>/<Caminho>/<Nome do Arquivo><Extensão>
```

Por exemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::