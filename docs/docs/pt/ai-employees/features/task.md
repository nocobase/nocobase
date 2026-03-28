:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/features/task).
:::

# Tarefas de Atalho

Para permitir que os funcionários de IA comecem a trabalhar de forma mais eficiente, você pode vincular funcionários de IA a blocos de cenário e predefinir várias tarefas comuns.

Isso permite que os usuários iniciem o processamento de tarefas com um clique, sem precisar **selecionar o bloco** e **inserir o comando** todas as vezes.

## Vinculando um Funcionário de IA ao Bloco

Após entrar no modo de edição da interface (UI), nos blocos que suportam `Actions`, selecione o menu `AI employees` em `Actions` e escolha um funcionário de IA. Esse funcionário de IA será vinculado ao bloco atual.

![20251022135306](https://static-docs.nocobase.com/20251022135306.png)

Após a conclusão do vínculo, toda vez que você acessar a página, a área de Actions do bloco exibirá o funcionário de IA vinculado ao bloco atual.

![20251022135438](https://static-docs.nocobase.com/20251022135438.png)

## Configurando Tarefas

No modo de edição da interface, passe o mouse sobre o ícone do funcionário de IA vinculado ao bloco. Um botão de menu aparecerá; selecione `Edit tasks` para acessar a página de configurações de tarefas.

Na página de configurações de tarefas, você pode adicionar várias tarefas para o funcionário de IA atual.

Cada aba representa uma tarefa independente. Clique no sinal "+" ao lado para adicionar uma nova tarefa.

![clipboard-image-1771913187](https://static-docs.nocobase.com/clipboard-image-1771913187.png)

Formulário de configuração de tarefa:

- No campo `Title`, insira o título da tarefa. Este título, que descreve brevemente a tarefa, aparecerá na lista de tarefas do funcionário de IA.
- No campo `Background`, insira o conteúdo principal da tarefa. Este conteúdo será usado como o prompt do sistema (system prompt) ao conversar com o funcionário de IA.
- No campo `Default user message`, insira a mensagem padrão do usuário. Ao selecionar a tarefa, ela será preenchida automaticamente na caixa de entrada do usuário.
- Em `Work context`, selecione as informações de contexto da aplicação que serão enviadas por padrão ao funcionário de IA. Esta operação funciona da mesma forma que no painel de conversa.
- O seletor `Skills` exibe as habilidades que o funcionário de IA possui. Você pode desmarcar uma habilidade para que o funcionário de IA a ignore ao executar essa tarefa específica.
- A caixa de seleção `Send default user message automatically` configura se a mensagem padrão do usuário deve ser enviada automaticamente logo após clicar para executar a tarefa.


## Lista de Tarefas

Após configurar as tarefas para o funcionário de IA, elas aparecerão na janela flutuante de perfil do funcionário e na mensagem de saudação antes do início da conversa. Basta clicar para executar a tarefa.

![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)