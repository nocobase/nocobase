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
Quando a opção "URL original" está selecionada, o endereço final de armazenamento é formado por várias partes:

```
<Prefixo da URL Pública>/<Caminho>/<Nome do Arquivo><Extensão>
```

Por exemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Quando a opção "URL do NocoBase" está selecionada, o registro do arquivo retorna um caminho do NocoBase no formato `/files/...`. A configuração acima continua sendo usada ao acessar o serviço de armazenamento.
:::

## URLs de arquivos e controle de acesso

Um mecanismo de armazenamento pode retornar uma URL do NocoBase ou a URL original do serviço de armazenamento. A URL do NocoBase é usada por padrão. Selecione a URL original somente quando um serviço externo precisar usar diretamente o endereço de armazenamento.

Essa configuração se aplica por mecanismo de armazenamento. Depois de salva, tanto os arquivos existentes quanto os novos arquivos enviados por esse mecanismo retornam URLs no formato selecionado. Os arquivos não são movidos nem enviados novamente.

![Configuração da URL do arquivo](https://static-docs.nocobase.com/20260723221234.png)

### URL do NocoBase

O registro do arquivo retorna um caminho de acesso fornecido pelo NocoBase, por exemplo:

```text
/files/main/main/attachments/1.png
```

As solicitações para essa URL passam primeiro pelo NocoBase e seguem as permissões de visualização configuradas para o registro de arquivo correspondente. O NocoBase só lê o arquivo ou redireciona para o endereço gerado pelo serviço de armazenamento depois que a verificação de permissão é aprovada.

Essa é a opção padrão recomendada. O registro retorna um caminho do NocoBase, portanto quem o utiliza não precisa saber se o armazenamento é local ou em nuvem.

### URL original

O registro do arquivo retorna diretamente o endereço gerado pelo serviço de armazenamento, por exemplo:

```text
https://storage.example.com/path/to/file.png
```

Essa URL não passa pelo NocoBase e não verifica as permissões de visualização do registro. Para armazenamento local, é um endereço de arquivo estático local. Para armazenamento em nuvem, geralmente é um endereço de armazenamento de objetos ou CDN.

Selecione a URL original somente quando Markdown, uma página externa ou um serviço de terceiros precisar usar diretamente o endereço de armazenamento.

:::warning Observação

Depois que a URL original é selecionada, qualquer pessoa com uma URL válida pode ignorar as verificações de permissão do NocoBase e acessar o arquivo. Se a URL não tiver assinatura nem validade, verifique se o bucket e o arquivo permitem leitura pública.

:::

### Permitir acesso público

"Permitir acesso público" só tem efeito quando "URL do NocoBase" está selecionada. Quando marcada, o mecanismo continua retornando uma URL do NocoBase, mas o NocoBase deixa de verificar as permissões do registro ao acessar a URL. Qualquer pessoa com a URL pode acessar o arquivo.

Essa opção não altera a configuração de leitura pública do próprio serviço de armazenamento. Ela controla apenas se o NocoBase verifica as permissões do registro de arquivo.

### Como escolher

| Caso de uso | URL do arquivo | Permitir acesso público |
| --- | --- | --- |
| Os arquivos devem seguir as permissões de função e de dados | URL do NocoBase | Desmarcado |
| É necessário um endereço de arquivo do NocoBase que possa ser compartilhado publicamente | URL do NocoBase | Marcado |
| Markdown, uma página externa ou um serviço de terceiros precisa ler diretamente o endereço de armazenamento | URL original | Não aplicável |

:::warning Observação

[Armazenamento local](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss) e [Tencent COS](./tencent-cos) não geram URLs assinadas temporárias. Mesmo com a URL do NocoBase e as permissões do registro ativadas, quem já obteve o endereço original do serviço de armazenamento ainda pode acessar o arquivo diretamente.

Para contratos, documentos de identidade, materiais internos ou outros arquivos que não devem ser públicos, use [S3 Pro](./s3-pro) e consulte sua configuração específica de controle de acesso.

:::

Se você já usa um mecanismo de armazenamento público e deseja migrar os arquivos existentes para o S3 Pro, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).
