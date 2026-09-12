# Capítulo 5: Abas e blocos dinâmicos

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113544406238001&bvid=BV1RfzNYLES5&cid=27009811403&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Pessoal, bem-vindos ao Capítulo 5! Este capítulo é especialmente interessante: vamos adicionar mais recursos à página de gerenciamento de tarefas, suportando diferentes formas de visualização. Você já estava esperando por isso, né? Sem pressa: vou guiá-lo passo a passo, como sempre, e tudo será simples.

### 5.1 Container de abas: hospedando vários blocos

Já criamos a página de gerenciamento de tarefas, mas, para deixá-la mais intuitiva, vamos permitir alternar entre diferentes modos de exibição: [**tabela**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table), [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**calendário**](https://docs-cn.nocobase.com/handbook/calendar) e até [**Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). O recurso de abas do NocoBase nos permite trocar diferentes layouts de blocos dentro da mesma página. Vamos com calma.

- Criar abas
  Primeiro, vamos criar as abas.

1. **Adicionar uma sub-aba**:

   - Abra a sua página de gerenciamento de tarefas e crie uma sub-aba dentro dela. A primeira aba pode se chamar **"Visualização em tabela"**, e nela exibiremos o bloco de lista de tarefas que já configuramos.
2. **Criar outra aba**:

   - Em seguida, crie outra aba chamada **"Visualização kanban"**. Nela vamos criar o bloco de kanban das tarefas.
     ![Criar abas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172155490.gif)

Pronto? Vamos criar os diversos blocos!

> **Sobre blocos:** blocos são os recipientes de dados e conteúdo, exibindo dados de forma adequada na página, podendo ser colocados em uma página (Page), modal (Modal) ou drawer. Vários blocos podem ser arrastados livremente, e várias operações sobre os dados podem ser configuradas dentro deles.
> Usar a funcionalidade de blocos do NocoBase, neste estudo de caso, ajuda você a montar e gerenciar páginas e funcionalidades mais rapidamente. Os blocos podem ser salvos como templates para serem copiados e referenciados, reduzindo significativamente o trabalho de criação.

### 5.2 Bloco kanban: status das tarefas em um piscar

O [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban) é uma funcionalidade muito importante em sistemas de gerenciamento de tarefas; ele permite gerenciar o status das tarefas com arrastar e soltar. Por exemplo, você pode agrupar tarefas pelo status e ver em qual etapa cada uma está.

#### 5.2.1 Criar bloco kanban

1. **Criar um novo bloco kanban**:

- Na aba **Visualização kanban**, clique em "Criar bloco" e selecione a tabela de Tarefas. Surgirá uma opção perguntando por qual campo agrupar as tarefas.

2. **Selecionar o campo de agrupamento**:

- Selecionamos o campo **Status** que criamos antes para agrupar pelas etapas. (Atenção: o campo de agrupamento só pode ser do tipo [**Dropdown (seleção única)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select) ou [**Radio**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/radio-group).)

3. **Adicionar campo de ordenação**:

- Cards no kanban podem ser reordenados por meio de um campo de ordenação. Para isso, criamos um novo campo. Clique em "Adicionar campo" e crie um campo chamado **status_sort (ordem do status)**.
- Esse campo serve para posicionar os cards ao arrastá-los, como coordenadas: agrupamento horizontal pelo status, posição vertical pelo valor de ordenação. Mais adiante, ao arrastar um card, você verá o valor de ordenação mudar no formulário.
  ![Criar bloco kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156926.gif)

#### 5.2.2 Selecionar campos e ações

- Por fim, marque os campos a exibir no bloco kanban — por exemplo, nome e status da tarefa — para que os cards apresentem informações completas.

![Exibir campos no kanban](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156326.gif)

### 5.3 Usando templates: copiar e referenciar

Após criar o bloco kanban, precisamos criar um **formulário de novo registro**. O NocoBase oferece um recurso muito prático: você pode [**copiar** ou **referenciar**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB) um template de formulário criado anteriormente, evitando configurar tudo de novo.

#### 5.3.1 **Salvar formulário como template**

- No formulário "Adicionar" anterior, passe o mouse sobre a configuração e clique em "Salvar como template". Dê um nome ao template, por exemplo "Tabela_Tarefas formulário Adicionar".

![Salvar formulário como template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172156356.gif)

#### 5.3.2 **Copiar ou referenciar o template**

Ao criar um novo formulário na visualização kanban, você verá duas opções: "**Copiar template**" e "**Referenciar template**". Qual a diferença?

- [**Copiar template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): cria uma cópia do formulário, que pode ser modificada de forma independente sem afetar o original.
- [**Referenciar template**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-templates#%E5%A4%8D%E5%88%B6%E5%92%8C%E5%BC%95%E7%94%A8%E7%9A%84%E5%8C%BA%E5%88%AB): "empresta" o formulário original; qualquer alteração se sincroniza com todos os lugares que referenciam o template. Por exemplo, se você reordenar campos, todos os formulários referenciados refletirão a mudança.

![Copiar vs referenciar template](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157435.gif)

Você pode escolher copiar ou referenciar conforme a necessidade. Em geral, **referenciar** é mais conveniente, pois basta alterar uma vez para tudo se sincronizar — economiza tempo.

### 5.4 Bloco de calendário: progresso das tarefas em um relance

A seguir, vamos criar um [**bloco de calendário**](https://docs-cn.nocobase.com/handbook/calendar) para gerenciar a agenda das tarefas com mais facilidade.

#### 5.4.1 Criar visualização em calendário

##### 5.4.1.1 **Criar campos de data**:

A visualização em calendário precisa saber a **data de início** e a **data de término** das tarefas; portanto, na tabela de Tarefas, adicionamos dois novos campos:

- **Data de início (start_date)**: marca o início da tarefa.
- **Data de término (end_date)**: marca o fim da tarefa.

![Adicionar campos de data](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157585.png)

#### 5.4.2 Criar bloco de calendário:

Volte à aba "Visualização em calendário", crie um bloco de calendário, selecione a tabela de Tarefas e use os campos **Data de início** e **Data de término** que acabamos de criar. As tarefas aparecem no calendário como períodos contínuos, mostrando o avanço de forma intuitiva.

![Montagem da visualização em calendário](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172157957.gif)

#### 5.4.3 Experimente o calendário:

No calendário você pode arrastar tarefas livremente, clicar para editar os detalhes (não esqueça de copiar ou referenciar templates).

![Operação no calendário](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158379.gif)

### 5.5 Bloco de Gantt: ferramenta poderosa para acompanhar o progresso

O último bloco é o [**Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt), uma ferramenta clássica em gestão de projetos para acompanhar progresso e dependências entre tarefas.

#### 5.5.1 Criar a aba "Visualização em Gantt"

#### 5.5.2 **Adicionar o campo "Percentual concluído"**:

Para que o Gantt mostre bem o progresso, criamos um novo campo chamado **complete_percent (percentual concluído)**, que registra o avanço da tarefa, com valor padrão 0%.

![Adicionar campo percentual concluído](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158044.gif)

#### 5.5.3 **Criar o bloco Gantt**:

Na aba de Gantt, crie um bloco do tipo Gantt, selecione a tabela de Tarefas e configure os campos de data de início, data de término e percentual concluído.

![Montagem do Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172158860.gif)

#### 5.5.4 **Arrastar e soltar no Gantt**:

No Gantt, você pode arrastar tarefas para ajustar progresso e datas; data de início, data de término e percentual concluído são atualizados automaticamente.

![Arrastar Gantt](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172159140.gif)

### Resumo

Excelente! Você já domina o uso de diferentes blocos no NocoBase para apresentar dados de tarefas, incluindo [**kanban**](https://docs-cn.nocobase.com/handbook/block-kanban), [**calendário**](https://docs-cn.nocobase.com/handbook/calendar) e [**Gantt**](https://docs-cn.nocobase.com/handbook/block-gantt). Esses blocos tornam o gerenciamento mais intuitivo e flexível.

Mas isso é só o começo! Imagine: numa equipe, cada pessoa tem responsabilidades diferentes — como garantir colaboração contínua e segurança dos dados, deixando cada um ver e operar apenas o que lhe diz respeito?

Pronto? Vamos para o próximo capítulo: [Capítulo 6: Parceiros — colaboração harmoniosa, controle flexível](https://www.nocobase.com/cn/tutorials/task-tutorial-user-permissions).

Veja como, com operações simples, podemos elevar a colaboração da equipe a um novo nível!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
