:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Motor de Armazenamento: Armazenamento Local

Os arquivos enviados serão salvos em um diretório local no disco rígido do servidor. Isso é ideal para cenários onde o volume total de arquivos enviados gerenciados pelo sistema é pequeno ou para fins experimentais.

## Parâmetros de Configuração

![Exemplo de configuração do motor de armazenamento de arquivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Observação}
Esta seção apresenta apenas os parâmetros específicos do motor de armazenamento local. Para os parâmetros gerais, consulte [Parâmetros Gerais do Motor](./index.md#parametros-gerais-do-motor).
:::

### Caminho

Representa tanto o caminho relativo para o armazenamento de arquivos no servidor quanto o caminho de acesso via URL. Por exemplo, "`user/avatar`" (sem barras iniciais ou finais) representa:

1. O caminho relativo no servidor onde os arquivos enviados são armazenados: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. O prefixo da URL para acessar os arquivos: `http://localhost:13000/storage/uploads/user/avatar`.