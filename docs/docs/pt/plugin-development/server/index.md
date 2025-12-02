:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

O desenvolvimento de **plugins** para o lado do servidor do NocoBase oferece diversas funcionalidades e recursos para ajudar você a personalizar e estender as capacidades principais do NocoBase. Abaixo, você encontra as principais funcionalidades e os capítulos relacionados ao desenvolvimento de **plugins** para o lado do servidor do NocoBase:

| Módulo                                      | Descrição                                                                                             | Capítulo Relacionado                                      |
| :------------------------------------------ | :---------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Classe de Plugin**                        | Crie e gerencie **plugins** para o lado do servidor, estendendo as funcionalidades principais.         | [plugin.md](plugin.md)                                    |
| **Operações de Banco de Dados**             | Oferece interfaces para operações de banco de dados, com suporte a operações CRUD e gerenciamento de transações. | [database.md](database.md)                                |
| **Coleções Personalizadas**                 | Personalize a estrutura das suas **coleções** de acordo com as necessidades do seu negócio para um gerenciamento flexível do modelo de dados. | [collections.md](collections.md)                          |
| **Compatibilidade de Dados na Atualização de Plugins** | Garanta que as atualizações de **plugins** não afetem os dados existentes, realizando migração e tratamento de compatibilidade de dados. | [migration.md](migration.md)                              |
| **Gerenciamento de Fontes de Dados Externas** | Integre e gerencie **fontes de dados** externas para possibilitar a interação de dados.                 | [data-source-manager.md](data-source-manager.md)          |
| **APIs Personalizadas**                     | Estenda o gerenciamento de recursos da API, escrevendo interfaces personalizadas.                      | [resource-manager.md](resource-manager.md)                |
| **Gerenciamento de Permissões de API**      | Personalize as permissões de API para um controle de acesso granular.                                 | [acl.md](acl.md)                                          |
| **Interceptação e Filtragem de Requisições/Respostas** | Adicione interceptadores ou middlewares para requisições e respostas, lidando com tarefas como log, autenticação, etc. | [context.md](context.md) e [middleware.md](middleware.md) |
| **Escuta de Eventos**                       | Escute eventos do sistema (por exemplo, da aplicação ou do banco de dados) e acione os manipuladores correspondentes. | [event.md](event.md)                                      |
| **Gerenciamento de Cache**                  | Gerencie o cache para melhorar o desempenho da aplicação e a velocidade de resposta.                  | [cache.md](cache.md)                                      |
| **Tarefas Agendadas**                       | Crie e gerencie tarefas agendadas, como limpeza periódica, sincronização de dados, etc.               | [cron-job-manager.md](cron-job-manager.md)                |
| **Suporte a Múltiplos Idiomas**             | Integre suporte a múltiplos idiomas para implementar internacionalização e localização.                | [i18n.md](i18n.md)                                        |
| **Saída de Log**                            | Personalize formatos de log e métodos de saída para aprimorar as capacidades de depuração e monitoramento. | [logger.md](logger.md)                                    |
| **Comandos Personalizados**                 | Estenda o CLI do NocoBase, adicionando comandos personalizados.                                       | [command.md](command.md)                                  |
| **Escrevendo Casos de Teste**               | Escreva e execute casos de teste para garantir a estabilidade e a precisão funcional do **plugin**.    | [test.md](test.md)                                        |