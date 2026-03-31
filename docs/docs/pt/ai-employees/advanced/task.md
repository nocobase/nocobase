:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Avançado

## Introdução

Os Funcionários de IA podem ser vinculados a páginas ou blocos. Após a vinculação, você pode configurar tarefas específicas para o negócio atual, permitindo que os usuários utilizem rapidamente o Funcionário de IA para processar essas tarefas diretamente na página ou no bloco.

## Vincular Funcionário de IA a uma Página

Depois que a página entra no modo de edição da UI, um sinal de "+" aparecerá ao lado do botão de acesso rápido do Funcionário de IA no canto inferior direito. Ao passar o mouse sobre o sinal de "+", uma lista de Funcionários de IA será exibida. Selecione um Funcionário de IA para vinculá-lo à página atual.

![20251022134656](https://static-docs.nocobase.com/20251022134656.png)

Após a vinculação ser concluída, o Funcionário de IA vinculado à página atual será exibido no canto inferior direito toda vez que você acessar a página.

![20251022134903](https://static-docs.nocobase.com/20251022134903.png)

## Vincular Funcionário de IA a um Bloco

Depois que a página entra no modo de edição da UI, em um bloco que suporte a configuração de `Actions`, selecione o menu `AI employees` em `Actions` e, em seguida, escolha um Funcionário de IA para vinculá-lo ao bloco atual.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Após a vinculação ser concluída, o Funcionário de IA vinculado ao bloco atual será exibido na área de `Actions` do bloco toda vez que você acessar a página.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurar Tarefas

Depois que a página entra no modo de edição da UI, passe o mouse sobre o ícone do Funcionário de IA vinculado à página ou ao bloco. Um botão de menu aparecerá. Selecione `Edit tasks` para acessar a página de configuração de tarefas.

![20251022135710](https://static-docs.nocobase.com/20251022135710.png)

Ao acessar a página de configuração de tarefas, você pode adicionar várias tarefas para o Funcionário de IA atual.

Cada aba representa uma tarefa independente. Clique no sinal de "+" ao lado para adicionar uma nova tarefa.

![20251022140058](https://static-docs.nocobase.com/20251022140058.png)

Formulário de configuração de tarefas:

- No campo `Title`, insira o título da tarefa. Descreva brevemente o conteúdo da tarefa; este título aparecerá na lista de tarefas do Funcionário de IA.
- No campo `Background`, insira o conteúdo principal da tarefa. Este conteúdo será usado como o prompt do sistema ao conversar com o Funcionário de IA.
- No campo `Default user message`, insira a mensagem de usuário padrão a ser enviada. Ela será preenchida automaticamente no campo de entrada do usuário após a seleção da tarefa.
- Em `Work context`, selecione as informações de contexto do aplicativo padrão a serem enviadas ao Funcionário de IA. Esta operação é a mesma que a realizada na caixa de diálogo.
- A caixa de seleção `Skills` exibe as habilidades disponíveis para o Funcionário de IA atual. Você pode desmarcar uma habilidade para que o Funcionário de IA a ignore e não a utilize ao executar esta tarefa.
- A caixa de seleção `Send default user message automatically` configura se a mensagem de usuário padrão deve ser enviada automaticamente após clicar para executar a tarefa.

![20251022140805](https://static-docs.nocobase.com/20251022140805.png)

## Lista de Tarefas

Depois de configurar as tarefas para um Funcionário de IA, elas serão exibidas no pop-up de perfil do Funcionário de IA e na mensagem de saudação antes do início de uma conversa. Clique em uma tarefa para executá-la.

![20251022141231](https://static-docs.nocobase.com/20251022141231.png)