# Motor de Armazenamento: Armazenamento Local

Os arquivos enviados serão salvos em um diretório local no disco rígido do servidor. Isso é ideal para cenários onde o volume total de arquivos enviados gerenciados pelo sistema é pequeno ou para fins experimentais.


:::warning Observação

Sempre que possível, use URLs estáveis `/files/` para arquivos locais, para que o NocoBase verifique o registro e a permissão de visualização da função atual. URLs legadas `/storage/uploads/` não aplicam permissões no nível do registro, mas Docker, o Nginx integrado e as configurações geradas pela CLI do NocoBase as restringem por padrão a usuários autenticados.

Se você precisa armazenar contratos, documentos de identidade, materiais internos ou outros arquivos que não devem ser públicos, use [S3 Pro](./s3-pro). Se já houver arquivos históricos, consulte [Migrar para S3 Pro](./migrate-to-s3-pro.md).

Se um Nginx personalizado servir uploads locais por `alias`, seu location `/storage/uploads/` deve usar `auth_request` para chamar o endpoint de autenticação do NocoBase. Caso contrário, a verificação de login padrão será ignorada. Defina também `X-Content-Type-Options: nosniff` e retorne arquivos com conteúdo ativo, como `html`, `svg`, `xhtml` e `pdf`, como anexos. Consulte [Proxy reverso Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) para um exemplo completo e a configuração de subaplicações, e o [guia de segurança: armazenamento de arquivos](../../security/guide.md#armazenamento-de-arquivos) para os riscos relacionados.

Se uma integração existente depender de acesso anônimo às URLs legadas, defina `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` e reinicie a aplicação. Essa opção de compatibilidade afeta apenas `/storage/uploads/` e não altera as permissões no nível do registro para `/files/`.

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
