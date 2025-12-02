:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Visão Geral

Um gatilho é o ponto de entrada para um fluxo de trabalho. Quando um evento que atende às condições do gatilho ocorre enquanto o aplicativo está em execução, o fluxo de trabalho será acionado e executado. O tipo de gatilho também define o tipo do fluxo de trabalho, sendo selecionado durante a criação e não podendo ser modificado posteriormente. Os tipos de gatilho atualmente suportados são:

- [Eventos de Coleção](./collection) (Embutido)
- [Agendamento](./schedule) (Embutido)
- [Antes da Ação](./pre-action) (Fornecido pelo plugin @nocobase/plugin-workflow-request-interceptor)
- [Depois da Ação](./post-action) (Fornecido pelo plugin @nocobase/plugin-workflow-action-trigger)
- [Ação Personalizada](./custom-action) (Fornecido pelo plugin @nocobase/plugin-workflow-custom-action-trigger)
- [Aprovação](./approval) (Fornecido pelo plugin @nocobase/plugin-workflow-approval)
- [Webhook](./webhook) (Fornecido pelo plugin @nocobase/plugin-workflow-webhook)

O momento em que cada evento é acionado é mostrado na figura abaixo:

![Workflow Events](https://static-docs.nocobase.com/20251029221709.png)

Por exemplo, quando um usuário envia um formulário, ou quando dados em uma coleção mudam devido a uma ação do usuário ou uma chamada de programa, ou quando uma tarefa agendada atinge seu tempo de execução, um fluxo de trabalho configurado pode ser acionado.

Gatilhos relacionados a dados (como ações, eventos de coleção) geralmente carregam dados de contexto do gatilho. Esses dados atuam como variáveis e podem ser usados pelos nós no fluxo de trabalho como parâmetros de processamento para realizar o processamento automatizado de dados. Por exemplo, quando um usuário envia um formulário, se o botão de envio estiver vinculado a um fluxo de trabalho, esse fluxo de trabalho será acionado e executado. Os dados enviados serão injetados no ambiente de contexto do plano de execução para serem usados como variáveis pelos nós subsequentes.

Após criar um fluxo de trabalho, na página de visualização do fluxo de trabalho, o gatilho é exibido como um nó de entrada no início do processo. Clicar neste cartão abrirá a gaveta de configuração. Dependendo do tipo de gatilho, você pode configurar suas condições relevantes.

![Trigger_Entry Node](https://static-docs.nocobase.com/20251029222231.png)