:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

O desenvolvimento de **plugins** do lado do cliente no NocoBase oferece diversas funcionalidades e recursos para ajudar você a personalizar e estender os recursos de frontend do NocoBase. Abaixo, você encontra as principais capacidades e os capítulos relacionados ao desenvolvimento de **plugins** do lado do cliente no NocoBase:

| Módulo                          | Descrição                                                                                                    | Capítulo Relacionado                                      |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Classe de Plugin**            | Crie e gerencie **plugins** do lado do cliente, estendendo a funcionalidade do frontend.                     | [plugin.md](plugin.md)                                    |
| **Roteador**                    | Personalize o roteamento do frontend, implementando navegação e redirecionamentos de página.                 | [router.md](router.md)                                    |
| **Recurso**                     | Gerencie recursos de frontend, lidando com a busca e operações de dados.                                     | [resource.md](resource.md)                                |
| **Requisição**                  | Personalize requisições HTTP, processando chamadas de API e transmissão de dados.                            | [request.md](request.md)                                  |
| **Contexto**                    | Obtenha e utilize o contexto da aplicação, acessando estados e serviços globais.                             | [context.md](context.md)                                  |
| **ACL (Controle de Acesso)**    | Implemente o controle de acesso no frontend, gerenciando permissões para páginas e funcionalidades.          | [acl.md](acl.md)                                          |
| **Gerenciador de Fonte de Dados** | Gerencie e utilize múltiplas **fontes de dados**, implementando a troca e o acesso entre elas.               | [data-source-manager.md](data-source-manager.md)          |
| **Estilos e Temas**             | Personalize estilos e temas, implementando a customização e o embelezamento da interface do usuário.        | [styles-themes.md](styles-themes.md)                      |
| **I18n (Suporte a Múltiplos Idiomas)** | Integre suporte a múltiplos idiomas, implementando internacionalização e localização.                       | [i18n.md](i18n.md)                                        |
| **Logger (Registro de Logs)**   | Personalize formatos e métodos de saída de logs, aprimorando as capacidades de depuração e monitoramento.   | [logger.md](logger.md)                                    |
| **Testes**                      | Escreva e execute casos de teste para garantir a estabilidade e a precisão funcional dos **plugins**.        | [test.md](test.md)                                        |

Extensões de UI

| Módulo                      | Descrição                                                                                                                                                                                           | Capítulo Relacionado                                      |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------- |
| **Configuração de UI**      | Utilize o FlowEngine e modelos de fluxo para implementar a configuração dinâmica e a orquestração de propriedades de componentes, permitindo a personalização visual de páginas e interações complexas. | [flow-engine](../../flow-engine/index.md) e [flow-model](../../flow-engine/flow-model.md) |
| **Extensões de Bloco**      | Personalize blocos de página para criar módulos e layouts de UI reutilizáveis.                                                                                                                      | [blocks](../../ui-development-block/index.md)            |
| **Extensões de Campo**      | Personalize tipos de campo para implementar a exibição e edição de dados complexos.                                                                                                                 | [fields](../../ui-development-field/index.md)            |
| **Extensões de Ação**       | Personalize tipos de ação para implementar lógica complexa e tratamento de interações.                                                                                                              | [actions](../../ui-development-action/index.md)           |