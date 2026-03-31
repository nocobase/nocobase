:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Avançado

## Introdução

Geralmente, os modelos de linguagem grandes (LLMs) têm dados com baixa atualidade e não possuem as informações mais recentes. Por isso, plataformas de serviço de LLM online geralmente oferecem uma funcionalidade de busca na web, permitindo que a IA pesquise informações usando ferramentas antes de responder, e então baseie sua resposta nos resultados da busca.

Os funcionários de IA foram adaptados para a funcionalidade de busca na web de diversas plataformas de serviço de LLM online. Você pode ativar a busca na web tanto na configuração do modelo do funcionário de IA quanto nas conversas.

## Ativar a Funcionalidade de Busca na Web

Acesse a página de configuração do **plugin** de funcionários de IA, clique na aba `AI employees` para entrar na página de gerenciamento de funcionários de IA.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Selecione o funcionário de IA para o qual você deseja ativar a funcionalidade de busca na web, clique no botão `Edit` para acessar a página de edição do funcionário de IA.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Na aba `Model settings`, ative o interruptor `Web Search` e clique no botão `Submit` para salvar as alterações.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Usando a Funcionalidade de Busca na Web em Conversas

Depois que um funcionário de IA tiver a funcionalidade de busca na web ativada, um ícone de "Web" aparecerá na caixa de entrada da conversa. A busca na web é ativada por padrão, e você pode clicar nele para desativá-la.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Com a busca na web ativada, a resposta do funcionário de IA exibirá os resultados da busca na web.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Diferenças nas Ferramentas de Busca na Web Entre Plataformas

Atualmente, a funcionalidade de busca na web do funcionário de IA depende da plataforma de serviço de LLM online, então a experiência do usuário pode variar. As diferenças específicas são as seguintes:

| Plataforma  | Busca na Web | tools | Resposta em tempo real com termos de busca | Retorna links externos como referências na resposta |
| --------- | -------- | ----- | ------------------------------------ | -------------------------------------------------- |
| OpenAI    | ✅        | ✅     | ✅                                    | ✅                                                  |
| Gemini    | ✅        | ❌     | ❌                                    | ✅                                                  |
| Dashscope | ✅        | ✅     | ❌                                    | ❌                                                  |
| Deepseek  | ❌        | ❌     | ❌                                    | ❌                                                  |