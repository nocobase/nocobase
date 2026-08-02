# Motor de Armazenamento: Armazenamento Local

Os arquivos enviados serão salvos em um diretório local no disco rígido do servidor. Isso é ideal para cenários onde o volume total de arquivos enviados gerenciados pelo sistema é pequeno ou para fins experimentais.


:::warning Observação

O armazenamento local não oferece acesso privado. Depois que um arquivo é enviado, o NocoBase gera uma URL diretamente acessível, e qualquer pessoa com essa URL pode acessar o arquivo.

Se você precisa armazenar contratos, documentos de identidade, materiais internos ou outros arquivos que não devem ser públicos, use [S3 Pro](./s3-pro). Se já houver arquivos históricos, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).

Se você não usa Docker nem a configuração oficial do nginx, e acessa arquivos locais enviados por meio de um proxy personalizado, confirme que o caminho `/storage/uploads/` define `X-Content-Type-Options: nosniff` e retorna arquivos com conteúdo ativo, como `html`, `svg`, `xhtml` e `pdf`, como anexos. Para mais detalhes, consulte o [guia de segurança: armazenamento de arquivos](../../security/guide.md).

:::

## Parâmetros de Configuração

![Exemplo de configuração do motor de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Observação}
Esta seção apresenta apenas os parâmetros específicos do motor de armazenamento local. Para os parâmetros gerais, consulte [Parâmetros Gerais do Motor](./index.md#parametros-gerais-do-motor).
:::

### Caminho

Representa tanto o caminho relativo para o armazenamento de arquivos no servidor quanto o caminho de acesso via URL. Por exemplo, "`user/avatar`" (sem barras iniciais ou finais) representa:

1. O caminho relativo no servidor onde os arquivos enviados são armazenados: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. O prefixo da URL para acessar os arquivos: `http://localhost:13000/storage/uploads/user/avatar`.
