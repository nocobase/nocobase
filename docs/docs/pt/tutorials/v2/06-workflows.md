# Capítulo 6: Workflow — Fazendo o Sistema Trabalhar Sozinho

No capítulo anterior, configuramos permissões no sistema, com diferentes funções vendo conteúdos diferentes. Mas todas as operações ainda dependem das pessoas — chega novo ticket, alguém precisa ir ver; status muda, ninguém fica sabendo.

Neste capítulo, vamos usar o [workflow](/workflow) do NocoBase para fazer o sistema **trabalhar sozinho** — configurar [condicional](/workflow/nodes/condition) e nó de [atualização automática](/workflow/nodes/update), implementando transição automática de status do ticket e registro automático da hora de criação.

## 6.1 O Que é [Workflow](/workflow) (Workflow)

Workflow é um conjunto de regras automatizadas do tipo "se... então...".

Comparação: você configurou um despertador no celular, toca todo dia às 8h. O despertador é o workflow mais simples — **condição satisfeita (chegou às 8h), executa automaticamente (toca a campainha)**.

O workflow do NocoBase segue o mesmo raciocínio:

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Trigger](/workflow/triggers/collection)**: ponto de entrada do workflow. Por exemplo, "alguém criou um novo ticket" ou "um dado foi atualizado"
- **Condicional**: passo de filtro opcional. Por exemplo, "só continua se o atendente não estiver vazio"
- **Ação executada**: o passo que de fato faz o trabalho. Por exemplo, "enviar notificação" ou "atualizar um campo"

A ação executada do workflow pode encadear vários nós; tipos de nó comuns são:

- **Controle de fluxo**: condicional, ramificação paralela, loop, atraso
- **Operação de dados**: novo dado, atualizar dado, consultar dado, excluir dado
- **Notificação e externos**: notificação, requisição HTTP, cálculo

Este tutorial só usa os mais comuns; depois de aprender as combinações, você consegue lidar com a maioria dos cenários.

### Visão geral dos tipos de trigger

O NocoBase oferece vários tipos de trigger, escolha ao criar o workflow:

| Trigger | Descrição | Cenário típico |
|-------|------|---------|
| [**Evento de tabela**](/workflow/triggers/collection) | Disparado ao adicionar, atualizar ou excluir dados | Notificação de novo ticket, registro de mudança de status |
| [**Tarefa agendada**](/workflow/triggers/schedule) | Disparado por expressão Cron ou horário fixo | Geração de relatório diário, limpeza periódica de dados expirados |
| [**Evento pós-ação**](/workflow/triggers/action) | Disparado após o usuário executar uma ação na interface | Notificação após envio de formulário, registro de log de operação |
| **Aprovação** | Inicia processo de aprovação, suporta multinível | Aprovação de licença, aprovação de compra |
| **Ação personalizada** | Vinculado a um botão personalizado, dispara ao clicar | Arquivamento com um clique, operações em lote |
| **Evento pré-ação** | Intercepta a operação do usuário, executa síncrono antes de liberar | Validação antes de submeter, autocompletar campos |
| **Funcionário de IA** | Disponibiliza o workflow como ferramenta para ser chamado pelo Funcionário de IA | IA executa operações de negócio automaticamente |

Este tutorial usa os triggers **Evento de tabela** e **Evento de ação personalizada**; o uso dos outros é parecido — depois de aprender, você se vira em casos similares.

O workflow do NocoBase é um plugin embutido, sem precisar de instalação adicional, pronto para usar.

## 6.2 Cenário 1: Novo Ticket Notifica o Atendente Automaticamente

**Necessidade**: quando alguém criar um novo ticket e definir o atendente, o sistema envia automaticamente uma mensagem interna ao atendente, avisando que "tem trabalho chegando".

### Passo 1: Criar workflow

Abra o menu de configuração de plugins no canto superior direito, vá em **Gerenciamento de Workflow**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Clique em **Novo**, no diálogo que aparece:

- **Nome**: preencha "Novo ticket notifica atendente"
- **Tipo de trigger**: escolha **Evento de tabela**

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Após submeter, clique no link **Configurar** na lista, entrando na interface de edição do fluxo.

### Passo 2: Configurar o trigger

Clique no card de trigger no topo, abrindo a gaveta de configuração:

- **[Tabela](/data-sources/data-modeling/collection)**: escolha Fonte de dados principal / «Tickets»
- **Momento de disparo**: escolha «Após adicionar ou atualizar dados»
- **[Campos](/data-sources/data-modeling/collection-fields) modificados**: marque «Atendente (Assignee)» — só dispara quando o campo atendente muda, evitando notificações desnecessárias por mudança de outros campos (ao adicionar dados, todos os campos são considerados modificados, então criar novo ticket também dispara)
- **Disparar quando satisfizer as condições**: modo «satisfazer **qualquer** condição do grupo», adicione duas condições:
  - `assignee_id` não está vazio
  - `Assignee / ID` não está vazio

  > Por que configurar duas condições? Porque ao disparar, o formulário pode ter só a chave estrangeira (assignee_id) sem o objeto relacionado consultado, ou pode ter o objeto relacionado mas com a chave estrangeira vazia. As duas condições com OR garantem que o disparo ocorra sempre que houver atendente.

- **Pré-carregar dados associados**: marque «Assignee» — o nó de notificação posterior precisa das informações do atendente, então é obrigatório carregar antecipadamente no trigger

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Clique em salvar. Assim, o trigger em si já completa o filtro de condição — só dispara quando o atendente não está vazio, sem precisar adicionar nó de condicional separado.

### Passo 3: Adicionar nó de notificação

Clique em **+** abaixo do trigger e escolha o nó **Notificação**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Abra a configuração do nó de notificação, o primeiro item é selecionar **canal de notificação** — mas ainda não criamos canal nenhum, a lista suspensa está vazia. Vamos criar um.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Passo 4: Criar canal de notificação

O NocoBase suporta vários tipos de canal de notificação:

| Tipo de canal | Descrição |
|---------|------|
| **Mensagem interna** | Notificação dentro do navegador, push em tempo real para o centro de notificações do usuário |
| **E-mail** | Envia e-mail por SMTP, requer configuração do servidor de e-mail |

Este tutorial usa o canal mais simples: **mensagem interna**:

1. Abra as configurações de plugins no canto superior direito, vá em **Gerenciamento de Notificações**
2. Clique em **Novo canal**

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Tipo de canal escolha **Mensagem interna**, preencha o nome do canal (como "Mensagem interna do sistema")
4. Salve

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Passo 5: Configurar o nó de notificação

Volte para a página de edição do workflow e abra a configuração do nó de notificação.

O nó de notificação tem as seguintes configurações:

- **Canal de notificação**: escolha o «Mensagem interna do sistema» recém-criado
- **Destinatário**: clique para escolher consulta de usuário → «id = variável do trigger/dado de gatilho/responsável/ID»
- **Título**: preencha o título da notificação, como "Você tem um novo ticket pendente". Suporta inserir variáveis, por exemplo adicionar o título do ticket: `Novo ticket: {{Dado de gatilho / Título}}`
- **Conteúdo**: preencha o corpo da notificação, também pode inserir variáveis referenciando prioridade, descrição, etc. do ticket

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(No próximo passo vamos buscar o endereço do ticket, antes de sair do popup, lembre de salvar primeiro!)

- **Página de detalhes do desktop**: preencha o caminho da URL da página de detalhes do ticket. Como obter: na frontend abra a gaveta de detalhes de qualquer ticket, copie o caminho da barra de endereços do navegador, formato similar a `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Cole esse caminho na caixa de configuração; o número após `filterbytk/` é o ID do ticket — substitua essa parte pela variável de ID do dado de gatilho (clique no seletor de variável → Dado de gatilho → ID). Após configurar, ao clicar nessa notificação na lista de notificações, o usuário vai direto para a página de detalhes do ticket correspondente, marcando-a automaticamente como lida

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Continuar em caso de falha de envio**: opcional, marcado, mesmo se a notificação falhar, o workflow não é interrompido

> Após o envio da notificação, o atendente pode ver essa mensagem no **centro de notificações** no canto superior direito da página, com indicador de bolinha vermelha para não lidas. Clicar na notificação vai direto para a página de detalhes do ticket para ver tudo.

### Passo 6: Testar e habilitar

> O fluxo completo do cenário 1 tem só dois nós: trigger (com filtro de condição) → notificação. Simples e direto.

Não habilite ainda — o workflow oferece a função de **execução manual**, com a qual você pode testar o fluxo com dados específicos:

1. Clique no botão **Executar** no canto superior direito (não o interruptor de habilitar)
2. Escolha um ticket existente como dado de gatilho
  > Se a barra de seleção de ticket exibir o ID, em Fonte de dados > Tabela > Tickets, defina a coluna "Título" como campo de título
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Clique em executar; o workflow executa e muda automaticamente para uma nova versão copiada
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Clique nos três pontos no canto superior direito e escolha histórico de execução. Você deve ver o registro de execução recente; ao clicar para ver, você vê os detalhes da execução, incluindo o disparo, detalhes de execução de cada nó, parâmetros.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Esse ticket parece ter sido para a Alice; vamos mudar para a conta dela, e... recebido com sucesso!

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Ao clicar, vai para a página do ticket alvo, e a notificação é marcada automaticamente como lida.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Confirme que o fluxo está OK e clique no interruptor **Habilitar/Desabilitar** no canto superior direito para mudar o workflow para o estado habilitado.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

> **Atenção**: uma vez que o workflow é executado (incluindo execução manual), ele vira **somente leitura** (cinza), não pode mais ser editado. Se precisa modificar, clique em **«Copiar para nova versão»** no canto superior direito e edite na nova versão. A versão antiga é desabilitada automaticamente.

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Volte à página de tickets, crie um novo ticket lembrando de escolher um atendente. Depois mude para a conta do atendente e logue, verifique o centro de notificações — você deve ver uma nova notificação.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

Parabéns, o primeiro fluxo automatizado está rodando!

## 6.3 Cenário 2: Mudança de Status Registra Hora de Conclusão Automaticamente

**Necessidade**: quando o status do ticket mudar para «Concluído», o sistema preenche automaticamente o campo «Hora de conclusão» com o horário atual. Sem precisar registrar manualmente, sem esquecer.

> Se ainda não criou o campo «Hora de conclusão» na tabela de tickets, vá em **Gerenciamento de tabelas → Tickets** e adicione um campo de tipo **Data**, com nome "Hora de conclusão". Veja os passos detalhados de criação de campo no Capítulo 2; não vou repetir aqui.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Passo 1: Novo workflow

Volte para a página de gerenciamento de workflow e clique em novo:

- **Nome**: preencha "Conclusão do ticket registra hora automaticamente"
- **Tipo de trigger**: escolha **Evento de ação personalizada** (dispara quando o usuário clica em um botão vinculado ao workflow)
- **Modo de execução**: síncrono
> Sobre síncrono e assíncrono:
> - Assíncrono: após a operação, podemos continuar fazendo outras coisas; o workflow executa automaticamente e nos notifica do resultado
> - Síncrono: após a operação, a interface fica em modo de espera, esperando o workflow terminar antes de podermos fazer outra coisa

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Passo 2: Configurar o trigger

Abra a configuração do trigger:

- **Tabela**: escolha «Tickets»
- **Modo de execução**: escolha **Modo de linha única** (cada execução só processa o ticket clicado naquele momento)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: Adicionar print de configuração do trigger -->


### Passo 3: Adicionar condicional

Diferente do trigger de evento de tabela que já contém condições de julgamento, precisamos adicionar nós de condicional manualmente:

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Recomendamos escolher «"Sim" e "Não" continuam separadamente», facilitando expansões futuras.

- Condição: **Dado de gatilho → Status** diferente de **Concluído** (ou seja, só tickets não concluídos passam, os já concluídos não são reprocessados)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Passo 4: Adicionar nó de atualizar dados

Na ramificação "Sim" do condicional, clique em **+** e escolha o nó **Atualizar dados**:

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Tabela**: escolha «Tickets»
- **Condição de filtro**: ID igual a Dado de gatilho → ID (garantindo que só atualiza esse ticket)
- **Valor dos campos**:
  - Status = **Concluído**
  - Hora de conclusão = **Variável de sistema / Hora do sistema**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> Assim, um único nó faz "alterar status" e "registrar hora" ao mesmo tempo, sem precisar configurar valores de campo separadamente no botão.

### Passo 5: Criar o botão de ação «Concluir»

Workflow configurado, mas o "Evento de ação personalizada" precisa estar vinculado a um botão de operação específico para disparar. Vamos criar um botão dedicado «Concluir» na coluna de operações da lista de tickets:

1. Entre no modo UI Editor, na coluna de operações da tabela de tickets clique em **«+»** e escolha o botão **«Disparar workflow»**

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Clique nas configurações do botão e mude o título para **«Concluir»**, escolha um ícone relacionado a conclusão (como ícone de tique)

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Configure **Regras de vinculação** no botão: quando o status do ticket já for «Concluído», esconder esse botão (ticket concluído não precisa clicar em "Concluir" de novo)
   - Condição: Dado atual → Status igual Concluído
   - Ação: esconder

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Abra **«Vincular workflow»** nas configurações do botão e escolha o workflow «Conclusão do ticket registra hora automaticamente» recém-criado

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Passo 6: Configurar fluxo de eventos para atualizar

Botão criado, mas após clicar a tabela não atualiza automaticamente — o usuário não vê a mudança de status. Precisamos configurar o **fluxo de eventos** do botão, para que ele atualize a tabela automaticamente após o workflow terminar.

1. Clique no segundo símbolo de raio (⚡) nas configurações do botão e abra a configuração do **Fluxo de eventos**
2. Configure o evento de gatilho:
   - **Evento de gatilho**: escolha **clique**
   - **Momento de execução**: escolha **após todos os fluxos**
3. Clique em **«Adicionar passo»** e escolha **«Atualizar bloco alvo»**

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Encontre a tabela de tickets na página atual, abra seu menu de configuração e escolha **«Copiar UID»** no fim, cole o UID no bloco alvo do passo de atualização

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

Assim, ao clicar no botão "Concluir", o workflow termina, a tabela atualiza automaticamente, e o usuário vê na hora a mudança de status e hora de conclusão.

### Passo 7: Habilitar e testar

Volte para a página de gerenciamento de workflow e habilite o workflow «Conclusão do ticket registra hora automaticamente».

Depois abra um ticket com status "Em processamento" e clique no botão **«Concluir»** na coluna de operações. Você pode ver:

- O campo "Hora de conclusão" do ticket é automaticamente preenchido com a hora atual
- A tabela atualiza automaticamente, e o botão "Concluir" desaparece nesse ticket (a regra de vinculação funcionou)

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

Não é prático? Esse é o segundo uso comum de workflow — **atualizar dados automaticamente**. E através do «Evento de ação personalizada + botão vinculado», implementamos um mecanismo de disparo preciso: só clicar em um botão específico executa o workflow.

## 6.4 Visualizar Histórico de Execução

Quantas vezes o workflow rodou? Houve erro? O NocoBase guarda tudo para você.

Na lista de gerenciamento de workflow, depois de cada workflow tem um número de **execuções** com link. Clique para ver os registros detalhados de cada execução:

- **Status da execução**: sucesso (verde) ou falha (vermelho), claríssimo
- **Hora do disparo**: quando foi disparado
- **Detalhes do nó**: ao entrar, dá pra ver o resultado de execução de cada nó

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

Se uma execução falhou, ao entrar nos detalhes você vê em qual nó deu o problema e a mensagem de erro específica. Essa é a ferramenta mais importante para depurar workflows.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Resumo

Neste capítulo criamos dois workflows simples mas práticos:

- **Notificação de novo ticket** (disparo por evento de tabela): após criar ou alterar atendente, notifica automaticamente, sem precisar avisar manualmente
- **Registro automático de hora de conclusão** (disparo por evento de ação personalizada): após clicar no botão "Concluir" preenche a hora automaticamente, evitando esquecimento humano

Os dois workflows demonstraram dois métodos de disparo diferentes; juntos, menos de 10 minutos de configuração, e o sistema já está trabalhando sozinho. O NocoBase ainda suporta mais tipos de nó (requisição HTTP, cálculo, loop, etc.), mas para iniciantes, dominar essas combinações já é suficiente para a maioria dos cenários.

## Prévia do Próximo Capítulo

Sistema já trabalha sozinho, mas ainda nos falta uma "visão global" — quantos tickets ao todo? Qual categoria tem mais? Quantos novos por dia? No próximo capítulo vamos usar [blocos](/interface-builder/blocks) de gráfico para montar um **dashboard de dados**, vendo tudo num piscar de olhos.

## Recursos Relacionados

- [Visão geral do workflow](/workflow) — conceitos centrais e cenários de uso do workflow
- [Trigger de evento de tabela](/workflow/triggers/collection) — configuração do disparo por mudança de dados
- [Nó de atualização de dados](/workflow/nodes/update) — configuração de atualização automática de dados
