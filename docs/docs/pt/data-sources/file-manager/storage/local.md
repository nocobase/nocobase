:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Armazenamento Local

Os arquivos enviados serão salvos em um diretório local no servidor. Isso é ideal para cenários de pequena escala ou experimentais, onde o volume total de arquivos gerenciados pelo sistema é relativamente pequeno.

## Opções

![Exemplo de opções do motor de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Dica}
Esta seção aborda apenas os parâmetros específicos do motor de armazenamento local. Para parâmetros comuns, consulte os [Parâmetros Gerais do Motor](./index.md#parâmetros-gerais-do-motor).
:::

### Caminho

O caminho representa tanto o caminho relativo do arquivo armazenado no servidor quanto o caminho de acesso via URL. Por exemplo, "`user/avatar`" (sem as barras "`/`" no início e no fim) representa:

1. O caminho relativo do arquivo enviado armazenado no servidor: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. O prefixo da URL para acessar o arquivo: `http://localhost:13000/storage/uploads/user/avatar`.