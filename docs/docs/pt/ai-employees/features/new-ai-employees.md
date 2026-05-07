:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/features/new-ai-employees).
:::

# Novo Funcionário de IA

Se os funcionários de IA integrados não atenderem às suas necessidades, você pode criar e personalizar seu próprio funcionário de IA.

## Iniciar a criação

Acesse a página de gerenciamento de `AI employees` e clique em `New AI employee`.

## Configuração de informações básicas

Configure o seguinte na aba `Profile`:

- `Username`: identificador único.
- `Nickname`: nome de exibição.
- `Position`: descrição do cargo.
- `Avatar`: avatar do funcionário.
- `Bio`: breve introdução.
- `About me`: prompt do sistema.
- `Greeting message`: mensagem de saudação do chat.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Configuração de função (Role setting)

Na aba `Role setting`, configure o Prompt do Sistema (System Prompt) do funcionário. Este conteúdo define a identidade, os objetivos, os limites de trabalho e o estilo de saída do funcionário durante as conversas.

Recomenda-se incluir pelo menos:

- Posicionamento da função e escopo de responsabilidades.
- Princípios de tratamento de tarefas e estrutura de resposta.
- Itens proibidos, limites de informação e estilo de tom.

Você pode inserir variáveis conforme necessário (por exemplo: usuário atual, função atual, idioma atual, data e hora), para que o prompt se adapte automaticamente ao contexto em diferentes conversas.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Configuração de habilidades e conhecimento

Configure as permissões de habilidades na aba `Skills`; se a funcionalidade de base de conhecimento estiver ativada, você pode continuar a configuração nas abas relacionadas à base de conhecimento.

## Concluir a criação

Clique em `Submit` para concluir a criação.