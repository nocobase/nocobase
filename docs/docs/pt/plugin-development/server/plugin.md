:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Plugin

No NocoBase, um **plugin** de servidor oferece uma forma modular de estender e personalizar as funcionalidades do lado do servidor. Você, como desenvolvedor(a), pode estender a classe `Plugin` de `@nocobase/server` para registrar eventos, APIs, configurações de permissão e outras lógicas personalizadas em diferentes estágios do ciclo de vida.

## Classe do Plugin

A estrutura básica de uma classe de **plugin** é a seguinte:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Ciclo de Vida

Os métodos do ciclo de vida do **plugin** são executados na seguinte ordem. Cada método tem seu momento de execução e propósito específicos:

| Método do Ciclo de Vida | Momento da Execução | Descrição |
|-------------------------|---------------------|-----------|
| **staticImport()**      | Antes do carregamento do **plugin** | Método estático da classe, executado durante a fase de inicialização independente do estado da aplicação ou do **plugin**. Usado para trabalhos de inicialização que não dependem de instâncias do **plugin**. |
| **afterAdd()**          | Executado imediatamente após o **plugin** ser adicionado ao gerenciador de **plugins** | A instância do **plugin** já foi criada, mas nem todos os **plugins** terminaram de inicializar. Você pode realizar alguns trabalhos básicos de inicialização. |
| **beforeLoad()**        | Executado antes de todos os `load()` dos **plugins** | Neste ponto, você pode acessar todas as **instâncias de plugins ativados**. É adequado para registrar modelos de banco de dados, ouvir eventos de banco de dados, registrar middlewares e outros trabalhos de preparação. |
| **load()**              | Executado quando o **plugin** é carregado | Todos os `beforeLoad()` dos **plugins** são concluídos antes que o `load()` comece a ser executado. É adequado para registrar recursos, interfaces de API, serviços e outras lógicas de negócios principais. |
| **install()**           | Executado quando o **plugin** é ativado pela primeira vez | Executado apenas uma vez quando o **plugin** é ativado pela primeira vez, geralmente usado para inicializar estruturas de tabelas de banco de dados, inserir dados iniciais e outras lógicas de instalação. |
| **afterEnable()**       | Executado após o **plugin** ser ativado | Executado toda vez que o **plugin** é ativado. Pode ser usado para iniciar tarefas agendadas, registrar tarefas programadas, estabelecer conexões e outras ações pós-ativação. |
| **afterDisable()**      | Executado após o **plugin** ser desativado | Executado quando o **plugin** é desativado. Pode ser usado para liberar recursos, parar tarefas, fechar conexões e outros trabalhos de limpeza. |
| **remove()**            | Executado quando o **plugin** é removido | Executado quando o **plugin** é completamente removido. Usado para escrever a lógica de desinstalação, como excluir tabelas de banco de dados, limpar arquivos, etc. |
| **handleSyncMessage(message)** | Sincronização de mensagens em implantações multi-nó | Quando a aplicação é executada em modo multi-nó, é usado para lidar com mensagens sincronizadas de outros nós. |

### Descrição da Ordem de Execução

O fluxo de execução típico dos métodos do ciclo de vida é:

1.  **Fase de Inicialização Estática**: `staticImport()`
2.  **Fase de Inicialização da Aplicação**: `afterAdd()` → `beforeLoad()` → `load()`
3.  **Fase de Primeira Ativação do Plugin**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4.  **Fase de Segunda Ativação do Plugin**: `afterAdd()` → `beforeLoad()` → `load()`
5.  **Fase de Desativação do Plugin**: `afterDisable()` é executado quando o **plugin** é desativado
6.  **Fase de Remoção do Plugin**: `remove()` é executado quando o **plugin** é removido

## `app` e Membros Relacionados

No desenvolvimento de **plugins**, você pode acessar várias APIs fornecidas pela instância da aplicação através de `this.app`. Esta é a interface principal para estender a funcionalidade do **plugin**. O objeto `app` contém vários módulos funcionais do sistema. Você, como desenvolvedor(a), pode usar esses módulos nos métodos do ciclo de vida do **plugin** para implementar requisitos de negócios.

### Lista de Membros de `app`

| Nome do Membro | Tipo/Módulo | Principal Finalidade |
|----------------|-------------|----------------------|
| **logger**     | `Logger`    | Registra logs do sistema, suporta diferentes níveis (info, warn, error, debug) de saída de log, facilitando a depuração e o monitoramento. Veja [Logs](./logger.md) |
| **db**         | `Database`  | Fornece operações da camada ORM, registro de modelos, escuta de eventos, controle de transações e outras funções relacionadas ao banco de dados. Veja [Banco de Dados](./database.md). |
| **resourceManager** | `ResourceManager` | Usado para registrar e gerenciar recursos de API REST e manipuladores de operação. Veja [Gerenciador de Recursos](./resource-manager.md). |
| **acl**        | `ACL`       | Camada de controle de acesso, usada para definir permissões, funções e políticas de acesso a recursos, implementando controle de permissões granular. Veja [Controle de Acesso (ACL)](./acl.md). |
| **cacheManager** | `CacheManager` | Gerencia o cache em nível de sistema, suporta Redis, cache em memória e outros backends de cache para melhorar o desempenho da aplicação. Veja [Cache](./cache.md) |
| **cronJobManager** | `CronJobManager` | Usado para registrar, iniciar e gerenciar tarefas agendadas, suporta configuração de expressões Cron. Veja [Tarefas Agendadas](./cron-job-manager.md) |
| **i18n**       | `I18n`      | Suporte à internacionalização, fornece funcionalidade de tradução e localização em vários idiomas, facilitando que os **plugins** suportem múltiplos idiomas. Veja [Internacionalização](./i18n.md) |
| **cli**        | `CLI`       | Gerencia a interface de linha de comando, registra e executa comandos personalizados, estende a funcionalidade do CLI do NocoBase. Veja [Linha de Comando](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Gerencia múltiplas instâncias de **fonte de dados** e suas conexões, suporta cenários de múltiplas **fontes de dados**. Veja [Gerenciamento de Fontes de Dados](./collections.md) |
| **pm**         | `PluginManager` | Gerenciador de **plugins**, usado para carregar, ativar, desativar e remover **plugins** dinamicamente, gerenciar dependências entre **plugins**. |

> Dica: Para o uso detalhado de cada módulo, consulte os capítulos de documentação correspondentes.