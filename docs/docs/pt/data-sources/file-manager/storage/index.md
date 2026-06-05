:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

## Motores Integrados

Atualmente, o NocoBase oferece suporte aos seguintes tipos de motores integrados:

- [Armazenamento Local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Um motor de armazenamento local é adicionado automaticamente durante a instalação do sistema e pode ser usado diretamente. Você também pode adicionar novos motores ou editar os parâmetros dos existentes.

## Parâmetros Comuns do Motor

Além dos parâmetros específicos para cada tipo de motor, as seções a seguir descrevem os parâmetros comuns (usando o armazenamento local como exemplo):

![Exemplo de Configuração do Motor de Armazenamento de Arquivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

O nome do motor de armazenamento, usado para identificação humana.

### Nome do Sistema

O nome do sistema do motor de armazenamento, usado para identificação pelo sistema. Deve ser único em todo o sistema. Se deixado em branco, será gerado automaticamente de forma aleatória pelo sistema.

### URL Base de Acesso

O prefixo do endereço URL para acesso externo ao arquivo. Pode ser a URL base de um CDN, por exemplo: "`https://cdn.nocobase.com/app`" (sem a barra final "`/`").

### Caminho

O caminho relativo usado ao armazenar arquivos. Esta parte também será automaticamente concatenada à URL final quando o arquivo for acessado. Por exemplo: "`user/avatar`" (sem a barra inicial ou final "`/``).

### Limite de Tamanho do Arquivo

O limite de tamanho para arquivos enviados a este motor de armazenamento. Arquivos que excederem este tamanho não poderão ser enviados. O limite padrão do sistema é de 20MB, e o limite máximo ajustável é de 1GB.

### Tipo de Arquivo

Permite limitar os tipos de arquivos que podem ser enviados, utilizando o formato de descrição de sintaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por exemplo, `image/*` representa arquivos de imagem. Vários tipos podem ser separados por vírgulas, como: `image/*, application/pdf` para permitir arquivos de imagem e PDF.

### Motor de Armazenamento Padrão

Ao marcar esta opção, ele será definido como o motor de armazenamento padrão do sistema. Quando um campo de anexo ou uma **coleção** de arquivos não especificar um motor de armazenamento, os arquivos enviados serão salvos no motor de armazenamento padrão. O motor de armazenamento padrão não pode ser excluído.

### Manter Arquivos ao Excluir Registros

Ao marcar esta opção, os arquivos enviados no motor de armazenamento serão mantidos mesmo quando os registros de dados na **coleção** de anexos ou arquivos forem excluídos. Por padrão, esta opção não está marcada, o que significa que os arquivos no motor de armazenamento serão excluídos junto com os registros.

:::info{title=Dica}
Após o envio de um arquivo, o caminho de acesso final é construído pela concatenação de várias partes:

```
<URL Base de Acesso>/<Caminho>/<Nome do Arquivo><Extensão>
```

Por exemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::