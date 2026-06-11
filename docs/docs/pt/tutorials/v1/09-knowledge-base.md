# Capítulo 8: Base de conhecimento - Tabela em árvore

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113815089907668&bvid=BV1mfcgeTE7H&cid=27830914731&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

### 8.1 Bem-vindo a um novo capítulo

Neste capítulo, vamos aprender a fundo como construir uma base de conhecimento. Será um módulo abrangente, que ajuda a gerenciar e organizar documentos, tarefas e informações. Projetando uma tabela de documentos em árvore, alcançaremos uma gestão eficiente do status, anexos e tarefas associadas.

### 8.2 Primeira incursão no design do banco

#### 8.2.1 Design básico e criação da tabela de documentos

Vamos começar com um design simples, criando a "tabela de documentos" para registrar todas as informações de documentos da base. A tabela inclui os seguintes campos-chave:

1. **Título (Title)**: o nome do documento, em formato de texto de linha única.
2. **Conteúdo (Content)**: o conteúdo detalhado do documento, em texto de várias linhas com suporte a Markdown.
3. **Status do documento (Status)**: marca o estado atual do documento, com as opções: rascunho, publicado, arquivado e excluído.
4. **Anexo (Attachment)**: permite anexar arquivos e imagens ao documento.
5. **Tarefa associada (Related Task)**: campo de relação muitos-para-um para vincular o documento a uma tarefa, facilitando referências.

![](https://static-docs.nocobase.com/2412061730%E6%96%87%E6%A1%A3-%E4%BB%BB%E5%8A%A1er.svg)

À medida que estendemos a funcionalidade, vamos adicionando outros campos ao sistema de gerenciamento de documentos.

#### 8.2.2 Construindo a estrutura em árvore e a gestão de diretórios

> Tabela em árvore (fornecida pelo plugin de Tree Collection): estrutura em árvore na qual cada item pode ter um ou mais filhos, e estes podem, por sua vez, ter os seus próprios filhos.

Para garantir organização e hierarquia, escolhemos uma [**tabela em árvore**](https://docs-cn.nocobase.com/handbook/collection-tree) para a tabela de documentos, facilitando o gerenciamento das relações pai-filho. Ao criar a tabela em árvore, o sistema gera automaticamente os seguintes campos:

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190010004.png)

- **ID do registro pai**: registra o documento superior do documento atual.
- **Registro pai**: campo muitos-para-um que representa a associação pai-filho.
- **Registros filhos**: campo um-para-muitos para visualizar todos os filhos de um documento.
  ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011580.png)

Esses campos mantêm a hierarquia do diretório de uma tabela em árvore — não é recomendável modificá-los.

Também precisamos criar a relação com a tabela de Tarefas [(muitos-para-um)](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), com o relacionamento inverso, para que possamos criar a lista de documentos no modal associado à tarefa quando precisarmos.

### 8.3 Criando a página de gerenciamento de documentos

#### 8.3.1 Adicionar o menu "Gerenciamento de documentos"

No menu principal do sistema, adicione uma nova página "Gerenciamento de documentos" e escolha um ícone adequado. Em seguida, crie um bloco de tabela para a tabela de Documentos. Adicione operações básicas de CRUD ao bloco e insira alguns dados de teste para validar o design.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190011929.gif)

#### Exercício

1. Tente adicionar um documento pai chamado "Documento 1" na página de gerenciamento de documentos.
2. Adicione um documento filho a "Documento 1" chamado "Capítulo 1".

#### 8.3.2 Converter para visualização em árvore

Você pode estar se perguntando: por que não está aparecendo como árvore?

Por padrão, o bloco de tabela mostra a tabela em modo padrão; vamos habilitar o modo árvore manualmente:

1. Clique no canto superior direito do bloco de tabela > Tabela em árvore.

   Ao marcar, aparece o interruptor "Expandir tudo" abaixo da tabela em árvore.

   E o "Capítulo 1" criado anteriormente desapareceu.
2. Ative o "Expandir tudo" abaixo da tabela em árvore.

   Agora a estrutura pai-filho aparece de forma intuitiva, e podemos expandir todos os níveis.

   Aproveitamos para adicionar a ação "Adicionar registro filho".

Conversão concluída!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012338.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012178.png)

### 8.3.3 Configurando "Adicionar registro filho"

Vamos definir o conteúdo básico ao adicionar. Note que se marcarmos o campo de registro pai, ele aparece como "Somente leitura (não editável)" por padrão, pois estamos criando dentro do documento atual.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012648.png)

Se houver muitas tarefas, atribuir a tarefa associada pode ficar trabalhoso. Podemos definir um valor padrão para o filtro de tarefa, deixando-o igual à tarefa associada ao registro pai.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190012417.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013403.png)

O valor padrão talvez não tenha sido aplicado imediatamente; feche e clique novamente — agora ele preenche automaticamente!

### 8.4 Configurando templates de formulário e associação com tarefas

#### 8.4.1 Criar [templates](https://docs-cn.nocobase.com/handbook/block-template) de tabela e formulário

Para facilitar o gerenciamento, salvamos a tabela e os formulários (criar/editar) de documento como [templates](https://docs-cn.nocobase.com/handbook/block-template), reutilizáveis em outras páginas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013599.png)

#### 8.4.2 Exibição copiada do bloco de tabela de documentos

No modal de visualização da tabela de Tarefas, adicione uma nova [aba](https://docs-cn.nocobase.com/manual/ui/pages) — "Documentos". Nessa aba, adicione o bloco do tipo formulário > Outros registros > Tabela de Documentos > "Copiar template" > clique para usar o template do formulário de documentos criado antes. (Lembre-se de selecionar [**Copiar template**](https://docs-cn.nocobase.com/handbook/block-template).)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190013140.png)

Essa abordagem facilita criar listas de documentos.

#### 8.4.3 Vincular à tarefa

Como copiamos um template externo de tabela, ele não está vinculado à tabela de Tarefas. Você verá todos os documentos, o que não é o que esperávamos.

Esse caso é comum: se não criamos um campo de relação adequado e ainda assim queremos exibir dados associados, precisamos vincular manualmente. (Lembre-se de usar [**Copiar template**](https://docs-cn.nocobase.com/handbook/block-template), não [Referenciar template](https://docs-cn.nocobase.com/handbook/block-template), para que as alterações não se sincronizem com outros blocos!)

- Vincular dados exibidos

Clique no canto superior direito do bloco de tabela e em [**Definir faixa de dados**](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/data-scope):

【Tarefa/ID】= 【Registro do modal atual/ID】

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014372.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014983.gif)

Pronto! Os documentos exibidos serão apenas os vinculados à tarefa atual.

- Vincular o bloco de adição.

No bloco de adicionar:

Para o campo de tarefa associada, defina o [valor padrão](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/default-value) > 【Registro do modal superior】.

O modal superior pertence à ação "Visualizar" do registro da tarefa atual e já estará vinculado.

Definimos como [Somente leitura (modo de leitura)](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/pattern), de forma que, dentro do modal atual, só possa estar vinculado à tarefa atual.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014424.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190014289.gif)

Pronto! Agora, ao adicionar e ao exibir, sempre relacionados à tarefa em questão.

Você, atento, pode também ajustar os filtros de associação em "Editar" e "Adicionar subtarefa".

Para deixar a árvore mais clara e a coluna de ações mais alinhada, mova o título para a primeira coluna.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015378.png)

### 8.5 Filtro e busca no gerenciamento de documentos

#### 8.5.1 Adicionar [bloco de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Aproveitando, vamos adicionar o filtro à tabela de documentos.

- Na página de gerenciamento de documentos, adicione um [bloco de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form).
- Selecione o tipo formulário e arraste para o topo.
- Marque os campos Título, Status, Tarefa associada etc. como condições de filtro.
- Adicione as ações "Filtrar" e "Resetar".

Esse formulário é a nossa caixa de busca, prática para encontrar documentos rapidamente.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015868.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190015365.gif)

#### 8.5.2 [Conectar blocos de dados](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

Você notará que clicar não tem efeito. Falta um último passo: conectar os blocos com capacidade de busca.

- Clique no canto superior direito do bloco > [Conectar blocos de dados](https://docs-cn.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  São listados os blocos conectáveis.

  Como criamos um formulário de documentos, ele lista os blocos relacionados à tabela de Documentos (nesta página há apenas um) como opção.

  Não se preocupe: ao passar o mouse, a tela foca automaticamente o bloco correspondente.
  ```
- Clique para ativar o bloco a ser conectado e teste a busca.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412190016981.gif)

Clicando no botão de configuração no canto superior direito do bloco de filtro, conecte-o ao bloco principal de dados da tabela de Documentos. Assim, sempre que ajustar as condições no bloco de filtro, o bloco de tabela atualiza automaticamente.

### 8.6 Configuração de [permissões](https://docs-cn.nocobase.com/handbook/acl) na base de conhecimento

Para garantir segurança e padronização, configure [permissões](https://docs-cn.nocobase.com/handbook/acl) por papel para a base de documentos. Cada papel pode visualizar, editar ou excluir documentos conforme suas permissões.

Como vamos evoluir a tabela de documentos para incluir notícias e comunicados, podemos manter as permissões um pouco mais abertas.

### 8.7 Resumo e próximos passos

Neste capítulo, criamos uma base de conhecimento com a tabela de Documentos, [estrutura em árvore](https://docs-cn.nocobase.com/handbook/collection-tree) e relação com tarefas. Adicionamos filtros e reaproveitamos templates, alcançando um gerenciamento eficiente.

A seguir, [no próximo capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-1), aprenderemos a montar um dashboard com [gráficos de análise de dados](https://docs-cn.nocobase.com/handbook/data-visualization) e exibição de informações importantes!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
