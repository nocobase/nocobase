# Capítulo 7: Workflow

<iframe  width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113600643469156&bvid=BV1qqidYQER8&cid=27196394345&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Parabéns por chegar a este último capítulo! Aqui apresentaremos e exploraremos brevemente as poderosas funcionalidades de **Workflow** do **NocoBase**. Com elas, você automatiza operações no sistema, economiza tempo e ganha eficiência.

### Resposta do desafio anterior

Antes de começar, vamos recapitular o desafio do capítulo anterior. Configuramos com sucesso as **permissões de comentário** para o papel "Parceiro":

1. **Permissão de Adicionar**: usuários podem publicar comentários.
2. **Permissão de Visualizar**: usuários podem ver todos os comentários.
3. **Permissão de Editar**: usuários só podem editar os próprios comentários.
4. **Permissão de Excluir**: usuários só podem excluir os próprios comentários.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172247599.gif)

Com essa configuração, Tom pode publicar comentários livremente, ver os comentários de outros membros e ainda assim apenas editar e excluir os seus.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248463.gif)

---

Agora, vamos implementar uma automação: **sempre que o responsável de uma tarefa for trocado, o sistema envia automaticamente uma notificação para o novo responsável, avisando que ele assumiu a tarefa**.

> **Workflow:** o plugin de workflow é uma poderosa ferramenta de automação, comum na área de Gerenciamento de Processos de Negócio (BPM).
>
> Ele permite projetar e orquestrar processos de negócio baseados em modelos de dados; com a configuração de gatilhos e nós do fluxo, automatiza o andamento dos processos. Esse tipo de plugin é especialmente adequado para processar tarefas repetitivas e orientadas a dados.

### 7.1 Criando o workflow

#### 7.1.1 Criar workflow no painel de administração

Primeiro, troque para o papel **Root**, o administrador do sistema com permissões totais. Em seguida, entre no [**módulo de Workflow**](https://docs-cn.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248323.png)

Clique em **"Adicionar"** no canto superior direito para criar um novo workflow e preencha as informações básicas:

- **Nome**: Notificação ao trocar de responsável.
- **Tipo de gatilho**: selecione "Evento da tabela".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248425.png)

#### 7.1.2 Sobre os tipos de gatilho:

1. [**Evento da tabela**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection): disparado quando os dados na tabela mudam (criação, atualização, exclusão). Ideal para acompanhar mudanças em campos de tarefas, como troca de responsável.
2. [**Tarefa agendada**](https://docs-cn.nocobase.com/handbook/workflow/triggers/schedule): disparada em horários específicos; adequado para automações de agenda.
3. [**Evento pós-ação**](https://docs-cn.nocobase.com/handbook/workflow/triggers/post-action): vinculado a um botão; é disparado depois que o usuário executa a ação. Por exemplo, ao clicar em salvar.

Mais à frente, descobriremos outros gatilhos: "Evento pré-ação", "Evento de ação personalizada", "Aprovação"... todos disponibilizados pelos plugins correspondentes.

Neste cenário, usamos o [**Evento da tabela**](https://docs-cn.nocobase.com/handbook/workflow/triggers/collection) para acompanhar a mudança do campo "Responsável" na tabela de Tarefas. Após enviar o workflow, clique em **Configurar** para entrar na página de configuração.

![demov3N-37.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172248988.gif)

---

### 7.2 Configurando os nós do workflow

#### 7.2.1 Configurar a condição do gatilho

Vamos lá, começando pelo fluxo de notificação automática!

Vamos configurar o primeiro nó com a condição que dispara o workflow.

- **Tabela**: selecione "Tabela de Tarefas". (A tabela que dispara o workflow; os dados correspondentes serão lidos e usados no fluxo. Naturalmente, queremos que o workflow seja disparado quando a tabela de Tarefas mudar.)
- **Momento do gatilho**: selecione "Após criar ou atualizar".
- **Campo do gatilho**: selecione "Responsável".
- **Condição do gatilho**: selecione "ID do responsável existe", garantindo que a notificação só seja enviada quando a tarefa tiver responsável atribuído.
- **Pré-carregamento**: selecione "Responsável" para usar suas informações nos próximos nós.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172249330.gif)

---

#### 7.2.2 Habilitar o canal "Mensagem in-app"

Em seguida, vamos criar um nó de envio de notificação.

Antes disso, criamos o canal de [**Mensagem in-app**](https://docs-cn.nocobase.com/handbook/notification-in-app-message) para envio.

- Volte à página de gerenciamento de plugins, selecione "Gerenciamento de Notificações" e crie a notificação de tarefa (`task_message`).
- Após criar o canal, voltamos ao workflow e adicionamos o nó "Notificação".
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250497.gif)
- Configuração do nó:
  **Canal:** selecione "Notificação de tarefa"
  **Destinatário:** selecione "Variável do gatilho/Dados do gatilho/Responsável/ID", para localizar o novo responsável.
  **Título da mensagem:** "Notificação de troca de responsável"
  **Conteúdo da mensagem:** "Você foi designado(a) como o(a) novo(a) responsável."

Após concluir, clique no interruptor no canto superior direito para ativar o workflow.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250472.gif)

Configurado!

#### 7.2.3 Testar a notificação

Momento empolgante! Voltamos à página, clicamos em qualquer tarefa, alteramos o responsável e enviamos. O sistema envia a notificação!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250461.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172250998.gif)

---

O fluxo de configuração do workflow é esse, mas ainda há trabalho:

A notificação precisa inserir dinamicamente as informações da tarefa, senão ninguém saberá qual tarefa foi transferida.

### 7.3 Refinando o workflow

#### 7.3.1 Versionamento

Voltando à configuração do workflow, você notará que a interface está cinza, sem permitir edição.

Calma! Clique nas reticências no canto superior direito e em [**Copiar para nova versão**](https://docs-cn.nocobase.com/handbook/workflow/advanced/revisions). Você cai na configuração da nova versão. As versões anteriores ficam preservadas — clique em **Versão** para alternar entre o histórico (atenção: versões já executadas não podem mais ser alteradas!).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251594.gif)

#### 7.3.2 Personalizar o conteúdo da notificação

Agora, vamos personalizar o conteúdo, adicionando detalhes sobre a transferência.

- **Edite o nó de Notificação.**

Altere o conteúdo para: "Tarefa《【Nome da tarefa】》, responsável atualizado para: 【Apelido do responsável】"

- Clique nas variáveis à direita para preencher o nome da tarefa e o responsável.
- Em seguida, clique no canto superior direito para ativar essa versão.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251780.gif)

Após ativar a nova versão, refazendo o teste, a notificação exibe o nome da nova tarefa.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172251734.gif)

---

### Resumo

Excelente! Você criou com sucesso um workflow automatizado baseado na mudança de responsável da tarefa. Essa funcionalidade economiza tempo de operações manuais e melhora a eficiência da equipe. Nosso sistema de gerenciamento de tarefas já tem funcionalidades robustas.

---

### Conclusão e próximos passos

Até aqui, você partiu do zero e construiu um sistema completo de gerenciamento de tarefas — abrangendo criação de tarefas, comentários, papéis e permissões, workflow e notificações.

A flexibilidade e extensibilidade do NocoBase trarão possibilidades infinitas. No futuro, você pode explorar mais plugins, customizar funcionalidades ou criar lógicas de negócio mais complexas. Acreditamos que, com este aprendizado, você já domina o uso básico e os conceitos centrais do NocoBase.

Aguardamos sua próxima criação! Se tiver dúvidas, consulte a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou participe da [comunidade do NocoBase](https://forum.nocobase.com/).

Continue explorando e crie sem limites!
