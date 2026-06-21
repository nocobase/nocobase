# Capítulo 7: Dashboard — Visão Completa em um Piscar de Olhos

No capítulo anterior, usamos workflow para que o sistema notificasse e registrasse a hora automaticamente. O sistema está ficando cada vez mais inteligente, mas ainda nos falta algo — **visão global**.

Quantos tickets há? Quantos foram tratados? Qual tipo de problema é o mais frequente? Quantos novos por dia? Essas perguntas, navegando na lista, não têm resposta. Neste capítulo, vamos usar [bloco de gráfico](/data-visualization) (gráfico de pizza, linha, barra) e [bloco Markdown](/interface-builder/blocks/other-blocks/markdown) para construir um **painel de dados**, transformando dados em uma imagem que entendemos num piscar.

## 7.1 Adicionar a Página do Dashboard

Primeiro, vamos adicionar um novo item de menu na barra de navegação superior.

Entre no [modo de configuração](/get-started/how-nocobase-works), na barra de menu superior clique em **«Adicionar item de menu»** (ícone `+`), escolha **«Página nova versão (v2)»**, dê o nome de «Dashboard de Dados».

![07-dashboard-2026-03-15-21-39-35](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-39-35.png)

Essa página é dedicada a gráficos, é o palco principal do nosso dashboard.

## 7.2 Gráfico de Pizza: Distribuição do Status dos Tickets

O primeiro gráfico, vamos usar um gráfico de pizza para exibir quanto há de "Pendente, Em processamento, Concluído".

Na página do dashboard, clique em **Criar [bloco](/interface-builder/blocks) (Add block) → [Gráfico](/data-visualization)**.

Após adicionar, clique no botão **Configurar** no canto superior direito do bloco; o painel de configuração do gráfico abre à direita.

### Configurar consulta de dados

- **[Tabela](/data-sources/data-modeling/collection)**: escolha «Tickets»
- **Medida (Measures)**: escolha qualquer [campo](/data-sources/data-modeling/collection-fields) único (por exemplo ID), modo de agregação **Contagem (Count)**
- **Dimensão (Dimensions)**: escolha o campo «Status»

![07-dashboard-2026-03-15-21-44-32](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-44-32.png)

Clique em **Executar consulta**, prévia dos dados retornados aparece embaixo.

### Configurar opções do gráfico

- **Tipo de gráfico**: escolha **Gráfico de pizza**
- **Mapeamento de campo**: Categoria escolha «Status», Value escolha o valor de contagem
- **Rótulo**: ative o interruptor

Na página esquerda já deve aparecer um lindo gráfico de pizza. Cada fatia representa um status, exibindo quantidade e percentual.

![07-dashboard-2026-03-15-21-45-40](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-45-40.png)

Clique em **Salvar**, o primeiro gráfico está pronto.

## 7.3 Gráfico de Linha: Tendência de Novos Tickets por Dia

O gráfico de pizza mostra "a distribuição agora", o gráfico de linha mostra "a tendência de mudança".

Adicione mais um bloco de gráfico na página, configure assim:

### Consulta de dados

- **Tabela**: escolha «Tickets»
- **Medida**: ID, contagem
- **Dimensão**: escolha o campo «Data de criação», formato **YYYY-MM-DD** (agrupamento por dia)

> **Dica**: o formato da dimensão de data é importante. Escolher `YYYY-MM-DD` é estatística por dia; escolher `YYYY-MM` é por mês. Escolha a granularidade adequada conforme seu volume de dados.

### Opções do gráfico

- **Tipo de gráfico**: escolha **Gráfico de linha**
- **Mapeamento de campo**: xField escolha «Data de criação», yField escolha valor de contagem

![07-dashboard-2026-03-15-21-48-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-48-33.png)

Após salvar, você vê a curva de variação do volume de tickets ao longo do tempo. Se um dia disparou muito, é sinal de que algo aconteceu naquele dia, vale prestar atenção.

## 7.4 Gráfico de Barras: Quantidade de Tickets por Categoria

O terceiro gráfico, vamos ver qual categoria tem mais tickets. Aqui usamos **gráfico de barras horizontal** em vez de gráfico de colunas vertical — quando há muitas categorias, os rótulos do eixo X do vertical podem se sobrepor e ser ocultados, e o horizontal exibe melhor.

Adicione um terceiro bloco de gráfico:

### Consulta de dados

- **Tabela**: escolha «Tickets»
- **Medida**: contagem de ID
- **Dimensão**: escolha o campo de relacionamento «Categoria» (escolha o campo nome da categoria)

### Opções do gráfico

- **Tipo de gráfico**: escolha **Barra (Bar)**
- **Mapeamento de campo**: xField escolha valor de contagem (contagem de ID), yField escolha «Nome da categoria»

![07-dashboard-2026-03-15-22-05-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-05-11.png)

Após salvar, qual problema é o mais frequente fica claro. Se "Falha de rede" tem barra muito maior que outras categorias, talvez seja hora de pensar em melhorar a infra de rede.

## 7.5 Bloco de Tabela: Tickets Não Concluídos

Os gráficos dão uma visão resumida, mas o administrador costuma também precisar ver detalhes. Vamos adicionar uma tabela **Tickets não concluídos**, exibindo diretamente todos os tickets ainda não resolvidos.

Adicione um **bloco de tabela** na página, escolha a tabela «Tickets».

### Configurar condição de filtro

Clique nas configurações no canto superior direito do bloco de tabela e encontre **Configurar escopo de dados**, adicione uma condição de [filtro](/interface-builder/blocks/filter-blocks/form):

- **Status** diferente de **Concluído**

Assim, a tabela só exibe tickets ainda não concluídos; um que conclui sai automaticamente da lista.

### Configurar campos

Selecione as colunas a exibir: Título, Status, Prioridade, Atendente, Data de criação.

![07-dashboard-2026-03-15-22-20-11](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-20-11.png)

> **Dica**: você pode adicionar **ordenação padrão** (por data de criação decrescente), deixando os tickets mais recentes no topo.

## 7.6 Bloco Markdown: Anúncio do Sistema

Além de gráficos, podemos colocar texto informativo no dashboard.

Adicione um **[bloco Markdown](/interface-builder/blocks/other-blocks/markdown)** e escreva um anúncio do sistema ou instruções de uso:

```markdown
## Sistema de Tickets de TI

Bem-vindo! Em caso de problemas, abra um ticket; a equipe técnica vai atender o quanto antes.

**Problemas urgentes** ligar diretamente para a hotline de TI: 8888
```

![07-dashboard-2026-03-15-21-53-54](https://static-docs.nocobase.com/07-dashboard-2026-03-15-21-53-54.png)

O bloco Markdown no topo do dashboard serve como mensagem de boas-vindas e quadro de avisos. O conteúdo pode ser editado a qualquer momento, super flexível.

![07-dashboard-2026-03-15-22-30-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-30-57.png)

## 7.7 Bloco JS: Banner de Boas-vindas Personalizado

O Markdown tem formato relativamente fixo; e se quisermos efeitos mais ricos? O NocoBase oferece o **Bloco JS (JavaScript Block)**, que permite personalizar livremente o conteúdo exibido com código.

Vamos usá-lo para fazer um banner de boas-vindas estilo corporativo — exibindo saudação personalizada conforme o usuário logado e o horário.

Adicione um **bloco JS** na página (Criar bloco → Outros blocos → Bloco JS).

![07-dashboard-2026-03-15-22-33-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-33-24.png)

No bloco JS, é possível obter o nome de usuário do usuário logado via `ctx.getVar("ctx.user.username")`. Abaixo está um banner de boas-vindas estilo corporativo simples:

```js
const uname = await ctx.getVar("ctx.user.username")
const name = uname || 'Usuário';
const hour = new Date().getHours();
const hi = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

const d = new Date();
const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const week = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][d.getDay()];

ctx.render(`
<div style="padding: 24px 32px; background: #f7f8fa; border-radius: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <div style="font-size: 22px; font-weight: 600; color: #1d2129;">${hi}, ${name}</div>
      <div style="font-size: 14px; color: #86909c; margin-top: 4px;">Bem-vindo de volta ao Sistema de Tickets de TI</div>
    </div>
    <div style="font-size: 14px; color: #86909c;">${date}　${week}</div>
  </div>
</div>`);
```

![07-dashboard-2026-03-15-22-51-27](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-51-27.png)

O efeito é um card com fundo cinza claro, saudação à esquerda, data à direita. Limpo, prático, sem roubar a cena.

> **Dica**: `ctx.getVar("ctx.user.xxx")` é como o bloco JS obtém informações do usuário atual. Campos comuns: `nickname` (apelido), `username` (nome de usuário), `email` (e-mail), etc. O bloco JS também pode chamar API para consultar dados; depois você pode usá-lo para fazer mais conteúdos personalizados.

## 7.8 Painel de Ações: Atalhos + Reuso de Popup

O dashboard não é só lugar de ver dados, deve também ser ponto de partida de ações. Vamos adicionar um **Painel de Ações (Action Panel)**, permitindo que o usuário envie tickets ou vá direto para a lista de tickets a partir da home.

Adicione um bloco **Painel de Ações** na página (Criar bloco → Outros blocos → Painel de ações), e adicione duas [ações](/interface-builder/actions) no painel:

![07-dashboard-2026-03-15-22-54-06](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-54-06.png)

1. **Link: ir para a lista de tickets** — adicione uma ação «Link», configure URL apontando para a página de lista de tickets (por exemplo `/admin/camcwbox2uc`)

![07-dashboard-2026-03-15-22-57-49](https://static-docs.nocobase.com/07-dashboard-2026-03-15-22-57-49.png)

2. **Botão: adicionar ticket** — adicione um botão de ação «Popup», com título «Adicionar ticket»

![07-dashboard-2026-03-15-23-00-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-00-36.png)

Mas o popup de "Adicionar ticket", quando aberto, está vazio; precisamos configurar seu conteúdo. Montar tudo do zero é trabalhoso — aqui apresentamos uma funcionalidade muito prática: **reuso de popup**.

### Salvar template de popup

> Atenção: o template de popup aqui é diferente do "template de bloco" do Capítulo 4. O template de bloco salva os campos e layout de um único bloco de formulário, e o template de popup salva o **popup inteiro** — incluindo todos os blocos, campos e botões de operação dentro dele.

1. Vá para a **página de lista de tickets**, encontre o botão «Adicionar ticket»
2. Clique nas configurações do botão e encontre **«Salvar como template»**, salve o popup atual
3. Dê um nome ao template (como "Popup de novo ticket")

![07-dashboard-2026-03-15-23-05-17](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-05-17.png)

### Reusar o popup na home

1. Volte para a página do dashboard, clique nas configurações do botão «Adicionar ticket» do painel de ações
2. Encontre **«Configurações de popup»** e escolha o template «Popup de novo ticket» recém-salvo
3. Após salvar, clicar no botão abre o mesmo popup de formulário de novo ticket que aparece na lista de tickets

![07-dashboard-2026-03-15-23-06-33](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-06-33.png)

![07-dashboard-2026-03-15-23-07-20](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-07-20.gif)

### Clique no título abre popup de detalhes

Da mesma forma, podemos fazer com que o título da tabela de tickets não concluídos seja clicável, abrindo direto os detalhes do ticket:

1. Vá para a **página de lista de tickets**, encontre as configurações do botão «Visualizar», também **«Salvar como template»** (como "Popup de detalhes do ticket")

![07-dashboard-2026-03-15-23-08-02](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-08-02.png)

2. Volte para a página do dashboard, na tabela de tickets não concluídos clique nas configurações do campo «Título»
3. Ative o interruptor **«Habilitar abrir ao clicar»** — aí aparece a opção «Configurações de popup»
4. Em configurações de popup escolha o template «Popup de detalhes do ticket» salvo

![07-dashboard-2026-03-15-23-11-24](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-11-24.png)

Agora, o usuário no dashboard clica no título do ticket e vai direto ver os detalhes, sem precisar pular para a página da lista de tickets. O dashboard inteiro fica mais compacto e eficiente.

![07-dashboard-2026-03-15-23-12-36](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-12-36.png)

> **Vantagem do reuso de popup**: o mesmo template de popup pode ser usado em várias páginas; ao modificar o template, todos os locais que referenciam atualizam juntos. Mesmo raciocínio do modo "Referência" do Capítulo 4 — manutenção em um lugar, efeito em todos.

## 7.9 Ajustar Layout

Agora a página tem 6 blocos (banner JS de boas-vindas + painel de ações + 3 gráficos + tabela de tickets), vamos ajustar o layout para deixar mais bonito.

No modo de configuração, você pode **arrastar** para ajustar a posição e o tamanho de cada bloco:

Layout sugerido:

- **Primeira linha**: banner JS de boas-vindas (esquerda) + painel de ações (direita)
- **Segunda linha**: gráfico de pizza (esquerda) + tabela de tickets (direita)
- **Terceira linha**: gráfico de linha (esquerda) + gráfico de barras (direita)

![07-dashboard-2026-03-15-23-14-19](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-14-19.png)

Atenção, você pode notar que as alturas dos blocos não estão alinhadas; nesse caso, em configurações do bloco > altura do bloco, ajuste manualmente — por exemplo, ajustei os dois blocos da segunda linha para 500px.

Arraste a borda para ajustar a largura do bloco, deixando dois gráficos cada um com metade. Depois de testar algumas vezes você acha o arranjo mais agradável.

![07-dashboard-2026-03-15-23-18-57](https://static-docs.nocobase.com/07-dashboard-2026-03-15-23-18-57.png)

## Resumo

Neste capítulo, com 6 blocos construímos um dashboard rico e prático:

- **Banner JS de boas-vindas**: exibe saudação personalizada conforme o usuário e horário
- **Painel de ações**: ir rápido para a lista de tickets, adicionar ticket com um clique (reuso de popup)
- **Gráfico de pizza**: vê de relance a proporção de status dos tickets
- **Gráfico de linha**: acompanha a tendência do volume de tickets ao longo do tempo
- **Gráfico de barras**: compara horizontalmente a quantidade por categoria, sem temer rótulos sobrepostos
- **Tabela de tickets não concluídos**: visão geral dos pendentes, clicar no título abre os detalhes (reuso de popup)

Também aprendemos a técnica importante de **reuso de popup** — salvar o popup de uma página como template e referenciar em outras páginas, evitando configuração duplicada.

A visualização de dados é um plugin embutido no NocoBase, sem precisar instalar separadamente. A configuração é tão simples quanto montar páginas — escolher dados, escolher tipo de gráfico, mapear campos, três passos resolvem.

## Prévia Posterior

Até aqui, as funcionalidades do nosso sistema de tickets estão bem completas: modelagem de dados, construção de páginas, formulários, controle de permissões, workflow automatizado, dashboard de dados — tudo pronto. Em seguida, planejamos lançar o **tutorial de construção em versão Agente de IA** — usando Agente de IA para concluir a construção do sistema localmente de forma automatizada. Aguardem!

## Recursos Relacionados

- [Visualização de dados](/data-visualization) — explicação detalhada da configuração de gráficos
- [Bloco Markdown](/interface-builder/blocks/other-blocks/markdown) — uso do bloco Markdown
- [Layout de blocos](/interface-builder/blocks) — layout da página e configuração de blocos
