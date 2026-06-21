# Capítulo 6: Usuários e permissões

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113595157318206&bvid=BV1EwiUYYE4f&cid=27181319746&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Em uma colaboração em equipe, cada pessoa precisa entender suas responsabilidades e permissões para que o trabalho flua. Hoje vamos aprender a criar papéis e gerenciar permissões para tornar a colaboração mais fluida e organizada.

Calma, o processo não é complicado. Vamos guiá-lo passo a passo, em cada etapa importante. Se tiver dúvidas, fique à vontade para pedir ajuda em nosso fórum oficial.

### Discussão de requisitos:

Precisamos de um papel "Parceiro" (Partner) com permissões para participar do gerenciamento de tarefas, mas que não possa modificar livremente as tarefas dos outros. Assim, podemos atribuir e colaborar de forma flexível.

![](https://static-docs.nocobase.com/241219-5-er.svg)

> **Sobre papéis e permissões:** papéis e permissões são mecanismos importantes para gerenciar acesso e operações dos usuários, garantindo a segurança do sistema e a integridade dos dados. Os papéis podem ser atribuídos aos usuários — um usuário pode ter vários papéis. Configurando as permissões dos papéis, é possível controlar comportamentos, operações e exibição das funcionalidades para cada usuário, com importância para o controle de acesso.
> Usar a funcionalidade de papéis e permissões e vincular aos usuários permite gerenciar melhor seu sistema. Como administrador, você pode definir quais permissões de operação cada um terá!

### 6.1 **Criar e atribuir papéis**

#### 6.1.1 **Criar o papel "Parceiro (Partner)"**

- Clique em [**Usuários e Permissões**](https://docs-cn.nocobase.com/handbook/users) no canto superior direito e selecione [**Papéis e Permissões**](https://docs-cn.nocobase.com/handbook/acl). É aqui que configuramos papéis e permissões.
- Clique no botão **Criar papel**, abre uma janela. Nomeie o papel como **Parceiro (Partner)** e confirme.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172222974.gif)

Você criou um novo papel! Agora vamos atribuir permissões para que esse papel possa participar do gerenciamento de tarefas.

#### 6.1.2 **Atribuir o novo papel a si mesmo**

Para garantir que as permissões funcionem, vamos vincular o papel à sua própria conta para testar. É simples:

- Em "Gerenciamento de Usuários", encontre sua conta, clique para entrar e selecione **Atribuir papel** > **Parceiro**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223483.gif)

Assim, você consegue simular o papel de "Parceiro" com sua própria conta. Em seguida, vamos ver como trocar de papel.

#### 6.1.3 **Trocar para o papel "Parceiro"**

Agora que você atribuiu o papel "Parceiro", vamos trocar de papel.

- Clique no **menu pessoal** no canto superior direito e selecione **Trocar de papel**.
- A opção "Parceiro" pode não estar listada de imediato; basta **atualizar a página/cache** que ela aparece!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223922.gif)

### 6.2 Atribuir permissões de página ao papel

Após trocar para o papel "Parceiro", você notará que não há páginas nem menus visíveis. É porque ainda não atribuímos permissão de acesso às páginas. Vamos resolver.

#### 6.2.1 **Atribuir acesso à página de tarefas para o papel "Parceiro"**

- Volte ao papel **Root** (super administrador) e entre em **Papéis e Permissões**.
- Clique no papel "Parceiro" para entrar nas configurações. Você verá a aba **Menu**, com todas as páginas do sistema.
- Marque a permissão da página **Gerenciamento de Tarefas** para que "Parceiro" possa acessá-la.

Volte ao **menu pessoal** e troque novamente para "Parceiro". O menu de Gerenciamento de Tarefas já deve aparecer.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172223592.gif)

#### 6.2.2 Configurar permissões de tabelas e operações

Mesmo com acesso à página, ainda precisamos restringir as operações. Queremos que "Parceiro":

- Possa **visualizar e editar** as tarefas atribuídas a ele;
- Possa **atualizar o progresso da tarefa**;
- Mas **não possa criar nem excluir tarefas**.

Para isso, configuramos as permissões da "tabela de Tarefas". Vamos lá!

##### 6.2.2.1 **Configurar permissões de tabela para "Parceiro"**

- Vá até **Papéis e Permissões**, clique no papel "Parceiro" e mude para a aba **Data Source**.
- Você verá as configurações de **Permissões de operação na tabela**. Encontre a **Tabela de Tarefas** e atribua a "Parceiro" as permissões "Visualizar" e "Editar".
- Por que damos a permissão de edição para "Todos os dados"? Por enquanto damos a permissão completa de edição. Mais tarde restringiremos por campo conforme o "responsável da tarefa". Manter o acesso máximo agora dá mais flexibilidade no controle posterior.
- Não queremos que outros papéis tenham "Adicionar" e "Excluir", então não atribuímos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224941.gif)

Até aqui, o papel "Parceiro" pode visualizar e editar todas as tarefas. A seguir, vamos avançar e garantir que ele só edite as tarefas atribuídas a ele.

### 6.3 Adicionar campo "Responsável" à tabela de Tarefas

Vamos atribuir um responsável a cada tarefa. Indicar um responsável garante que apenas ele possa modificar a tarefa, e os demais apenas visualizem. Para isso, usamos um **campo de relação** entre a tabela de Tarefas e a de Usuários.

#### 6.3.1 **Criar o campo "Responsável"**

1. Entre na **Tabela de Tarefas**, clique em **Adicionar campo** e escolha **Campo de relação**.
2. Selecione a relação **muitos-para-um** (uma tarefa só tem um responsável, mas um usuário pode ser responsável por várias tarefas).
3. Nomeie o campo como **Responsável (Assignee)**. Não precisa marcar a relação inversa por enquanto.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224751.gif)

#### 6.3.2 **Exibir o campo "Responsável"**

Em seguida, exiba o campo "Responsável" na tabela e nos formulários da página de gerenciamento de tarefas, para atribuir o responsável de cada tarefa facilmente. (Se o campo aparecer mostrando o ID, basta alterar o campo de título de "ID" para "Apelido".)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172224547.png)

### 6.4 Controlando permissões com **Gerenciamento de Permissões**

Agora vem a parte principal! Vamos usar o [**Gerenciamento de Permissões**](https://docs-cn.nocobase.com/handbook/acl) do NocoBase para implementar uma funcionalidade poderosa: **somente o responsável e o criador podem editar a tarefa**, os demais apenas visualizam. A próxima camada de flexibilidade do NocoBase está prestes a aparecer.

#### 6.4.1 **Tentativa simples: somente o responsável pode editar o formulário**

Queremos que apenas o responsável edite a tarefa, então definimos as condições:

- Volte às permissões da tabela do papel "Parceiro", abra a configuração da tabela de Tarefas e clique em "Faixa de dados" ao lado da permissão "Editar".
- Crie uma nova regra personalizada chamada "Responsável pode editar":
  **Quando "Responsável/ID" for igual a "Usuário atual/ID"**, a edição é permitida;
  ou seja, só o responsável pode editar; os demais apenas visualizam.
- Como o campo "Responsável" usa a tabela de Usuários e o usuário logado também está nessa tabela, essa regra atende exatamente ao primeiro requisito.

Clique em adicionar e confirme.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172226879.gif)

Voltemos à página para ver:

Perfeito. Trocando para o papel Parceiro e voltando à página, a ação de editar só aparece quando o responsável somos nós.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227581.gif)

#### 6.4.2 **Condição adicional: criador pode editar o formulário**

Em seguida, você pode notar uma novidade:

Como na maioria das tarefas não somos o responsável, não conseguimos editar nem ver os detalhes; outros membros também não veem os detalhes!

Calma — lembra-se de que demos ao Parceiro a permissão de **Visualizar** todos os dados?

- Voltamos à página, na configuração clicamos em "Visualizar" e adicionamos uma ação de visualização.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227426.png)

- Similar ao layout do modal de edição, criamos um modal de visualização. Lembre-se de selecionar o bloco de **Detalhes**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227807.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172227352.gif)

Pronto!

### 6.5 **Validar o controle de permissões**

Se você trocar de usuário e abrir o formulário, verá que ele exibe automaticamente as ações conforme as permissões. Para todas as tarefas das quais somos responsáveis, a edição fica disponível; para as outras, apenas a visualização.

Ao trocar para o papel Root, recuperamos todas as permissões. Esse é o poder do controle de permissões do NocoBase!

A partir de agora você pode atribuir tarefas livremente e chamar a equipe para colaborar. Vamos adicionar um novo membro e testar as permissões.

#### 6.5.1 **Criar um novo usuário e atribuir papel**

- Crie um novo usuário, por exemplo **Tom**, e atribua o papel **Parceiro**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228278.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172228648.gif)

- Na página de gerenciamento de tarefas, atribua algumas tarefas ao **Tom**.

#### 6.5.2 **Teste de login**

Tom faz login e verifica se consegue visualizar e editar as tarefas atribuídas a ele. Pelas regras configuradas, Tom só pode editar as tarefas das quais é responsável; as outras são somente leitura.

Todas as permissões do formulário de edição se sincronizaram corretamente!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412172229408.gif)

### Resumo

Parabéns! Você aprendeu a criar papéis no NocoBase, atribuir permissões e configurar regras personalizadas para garantir que cada membro só edite as tarefas atribuídas a ele. Com isso, você estabeleceu um sistema de gerenciamento de permissões claro e organizado para a equipe.

### Desafio

Até aqui, Tom já consegue ver e editar as tarefas das quais é responsável, mas você pode ter notado que ele **ainda não consegue comentar** nem participar das discussões. Como atribuir permissões para que ele possa comentar livremente, mas sem afetar as outras restrições? Será um desafio interessante!

**Dica:**

Volte às configurações de permissão e ajuste o papel "Parceiro" no contexto das tabelas — veja como permitir que Tom comente, mantendo as restrições nas outras tarefas.

Vamos lá! Revelaremos a resposta no próximo conteúdo.

No próximo capítulo, vamos implementar a funcionalidade de "Atividades dos membros" e apresentar outra funcionalidade poderosa: o [**Workflow**](https://docs-cn.nocobase.com/handbook/workflow). Com o workflow, você implementa o fluxo dinâmico de dados, dispara várias operações e deixa o sistema cuidar de processos repetitivos. Pronto para continuar? Vamos para o [Capítulo 7: Workflow — automação que dispara a eficiência](https://www.nocobase.com/cn/blog/task-tutorial-workflow)!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
