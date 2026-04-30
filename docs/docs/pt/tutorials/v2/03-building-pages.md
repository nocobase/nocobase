# Capítulo 3: Construindo Páginas — Do Branco ao Funcional

No capítulo anterior, montamos o esqueleto da tabela de dados, mas os dados existem apenas "no backend" — o usuário não consegue ver. Neste capítulo, vamos colocar os dados **em destaque**: criar [blocos de tabela](/interface-builder/blocks/data-blocks/table) para exibir dados de tickets, configurar exibição de campos, ordenação, [filtragem](/interface-builder/blocks/filter-blocks/form) e paginação, transformando-a numa lista de tickets realmente utilizável.

## 3.1 O Que É um Bloco (Block)

No NocoBase, **bloco** é como uma "peça de Lego" da página. Quer exibir uma tabela? Coloque um [bloco de tabela](/interface-builder/blocks/data-blocks/table). Quer exibir um formulário? Coloque um bloco de formulário. Uma página pode combinar livremente vários blocos, e ainda permite arrastar e ajustar o layout.

Tipos de blocos comuns:

| Tipo | Uso |
|------|------|
| Tabela (Table) | Exibe vários dados em forma de linhas e colunas |
| Formulário (Form) | Permite que o usuário insira ou edite dados |
| Detalhes (Details) | Mostra todas as informações de um registro |
| Formulário de filtro (Filter Form) | Fornece condições de filtragem para filtrar dados de outros blocos |
| Gráfico (Chart) | Gráficos de pizza, linha, etc., visualizações |
| Markdown | Coloca um texto personalizado ou explicativo |

Lembre-se da analogia: **bloco = peça de Lego**, e em seguida vamos usar esses Legos para montar a página de gerenciamento de tickets.

## 3.2 Adicionar Menu e Página

Primeiro, precisamos criar o ponto de entrada de "Gerenciamento de Tickets" no sistema.

1. Clique no botão **UI Editor** no canto superior direito para entrar no [modo de configuração](/get-started/how-nocobase-works) da interface (toda a página exibe bordas laranja editáveis).
2. Mova o mouse para o botão **«Adicionar item de menu (Add menu item)»** na barra de navegação superior, escolha **«Adicionar grupo (Add group)»**, dê o nome de **«Gerenciamento de Tickets»**.

![03-building-pages-2026-03-12-09-38-36](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-38-36.png)


3. O menu «Gerenciamento de Tickets» aparece imediatamente na barra de navegação superior. **Clique nele** e o menu de grupo se expande na lateral esquerda.
4. Na barra de menu da esquerda, clique no botão laranja **«Adicionar item de menu (Add menu item)»**, escolha **«Página nova versão (v2) (Modern page (v2))»**, e adicione duas subpáginas:
   - **Lista de Tickets** — exibe todos os tickets
   - **Categorias de Tickets** — gerencia os dados das categorias

![03-building-pages-2026-03-12-09-41-26](https://static-docs.nocobase.com/03-building-pages-2026-03-12-09-41-26.png)

> **Atenção**: ao adicionar uma página você verá as opções «Página antiga (v1)» e «Página nova (v2)». Este tutorial usa **v2** uniformemente.

## 3.3 Adicionar Bloco de Tabela

Agora entre na página «Lista de Tickets» e adicione um bloco de tabela:

1. Na página em branco, clique em **«Criar bloco (Add block)»**.
2. Escolha **bloco de dados → tabela**.
3. Na lista de tabelas que aparece, escolha **«Tickets»** (a tabela `tickets` que criamos no capítulo anterior).

![03-building-pages-2026-03-13-08-44-07](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-07.png)

Após adicionar o bloco de tabela com sucesso, uma tabela vazia aparece na página.

![03-building-pages-2026-03-13-08-44-29](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-44-29.png)

Tabela vazia sem dados não é prática para depurar; vamos adicionar rapidamente um botão de novo, e inserir alguns dados de teste:

1. Clique em **«Configurar ações (Configure actions)»** no canto superior direito da tabela e marque **«Adicionar (Add new)»**.

![03-building-pages-2026-03-17-14-58-39](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-58-39.png)

2. Clique no novo botão **«Adicionar»** que apareceu, no popup escolha **Adicionar bloco (Add block) → Formulário (Adicionar) (Form (Add New)) → Tabela atual (Current collection)**.

![03-building-pages-2026-03-17-14-59-42](https://static-docs.nocobase.com/03-building-pages-2026-03-17-14-59-42.png)

3. No popup, clique em **«Configurar campos (Configure fields)»**, marque os campos título, status, prioridade, etc.; clique em **«Configurar ações (Configure actions)»** e ative o botão **«Submeter (Submit)»**.

![03-building-pages-2026-03-17-15-00-54](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-00-54.png)

![03-building-pages-2026-03-17-15-01-49](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-01-49.png)

4. Preencha alguns dados de ticket à vontade e submeta — agora a tabela exibe conteúdo.

![03-building-pages-2026-03-17-15-03-04](https://static-docs.nocobase.com/03-building-pages-2026-03-17-15-03-04.png)

> A configuração detalhada do formulário (regras de campos, formulário de edição, popup de detalhes, etc.) será explicada no [Capítulo 4](/tutorials/v2/04-forms-and-details). Aqui basta conseguir inserir dados.

## 3.4 Configurar Colunas Exibidas

Por padrão, a tabela não exibe automaticamente todos os campos. Precisamos selecionar manualmente as colunas a exibir:

1. À direita do cabeçalho do bloco de tabela, clique em **«[Campos](/data-sources/data-modeling/collection-fields) (Fields)»**.
2. Marque os campos que deseja exibir:
   - **Título** — assunto do ticket, visível à primeira vista
   - **Status** — progresso atual
   - **Prioridade** — nível de urgência
   - **Categoria** — campo de relacionamento, exibe o nome da categoria
   - **Criador** — quem submeteu o ticket
   - **Atendente** — quem está responsável
3. Os campos que não precisam ser exibidos (como ID, data de criação) não marque, mantenha a tabela limpa.

![03-building-pages-2026-03-13-08-47-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-47-18.png)

> **Dica**: a ordem de exibição dos campos pode ser ajustada por arrastar. Coloque os mais importantes "Título" e "Status" no início, para facilitar a visualização rápida das informações chave.

### Problema dos campos de relacionamento exibirem ID

Após marcar «Categoria», você notará que a tabela exibe o ID da categoria (número), não o nome. Isso é porque, por padrão, o campo de relacionamento usa o ID como campo de título. Há duas formas de corrigir:

**Forma 1: modificar nas configurações da coluna da tabela (vale só para a tabela atual)**

Clique nas configurações da coluna «Categoria», encontre **«Campo de título (Title field)»**, mude de ID para **Nome**. Essa abordagem só afeta o bloco de tabela atual.

![03-building-pages-2026-03-13-09-23-03](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-03.png)

![03-building-pages-2026-03-13-09-57-40](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-57-40.gif)

**Forma 2: modificar na fonte de dados (vale globalmente, recomendado)**

Vá em **Configurações → [Fonte de dados](/data-sources) → [Tabela](/data-sources/data-modeling/collection) → Tabela de categorias**, mude o **«Campo de título»** para **Nome**. Assim, todos os locais que referenciam a tabela de categorias passam a exibir o nome por padrão, de uma vez por todas. Após a modificação, você precisa voltar à página e adicionar esse campo novamente para que tenha efeito.
![03-building-pages-2026-03-13-09-23-41](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-23-41.png)

## 3.5 Adicionar Filtro e Ordenação

Quando os tickets aumentam, precisamos encontrar tickets específicos rapidamente. O NocoBase oferece várias formas; vamos apresentar primeiro a mais comum: **bloco de formulário de filtro**.

### Adicionar formulário de filtro

1. Na página de lista de tickets, clique em **«Criar bloco»**, escolha **bloco de filtro → formulário de filtro**.
2. Em páginas v2, não é necessário escolher tabela — o formulário de filtro é adicionado direto à página.
3. No formulário de filtro, clique em **«Campos (Fields)»**: a lista de blocos de dados filtráveis na página atual aparece, por exemplo `Table: tickets #c48b` (o código depois é o UID do bloco, para distinguir múltiplos blocos da mesma tabela).

![03-building-pages-2026-03-13-08-48-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-08-48-37.png)

4. Mova o mouse sobre o nome do bloco para expandir a lista de campos filtráveis daquele bloco. Clique em um campo para adicioná-lo como filtro: **Status**, **Prioridade**, **Categoria**.

![03-building-pages-2026-03-13-09-25-44](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-25-44.png)

5. Após adicionar, quando o usuário insere uma condição no formulário de filtro, os dados da tabela são **filtrados automaticamente em tempo real**.

![03-building-pages-2026-03-13-10-00-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-10-00-25.gif)

### Pesquisa difusa multi-campo

E se quisermos pesquisar vários campos com uma única caixa de busca, como fazer?

Clique nas configurações no canto superior direito do campo de busca: você verá a opção **«Conectar campos (Connect fields)»**. Ao expandir, lista os campos pesquisáveis em cada bloco — você verá que por padrão só «Título» está conectado.
![03-building-pages-2026-03-13-09-30-06](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-30-06.png)

Podemos selecionar mais campos, como **Descrição** — assim, ao digitar uma palavra-chave, o usuário pesquisa esses campos simultaneamente.

E também é possível filtrar pelos campos de objetos relacionados — clique em «Categoria», na próxima opção marque «Nome da categoria», e a busca passará a casar com o nome da categoria.

![03-building-pages-2026-03-13-09-31-35](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-31-35.png)
![03-building-pages-2026-03-13-09-32-20](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-32-20.png)

> **Conectar campos é poderoso**: pode atravessar vários blocos e vários campos. Se houver vários blocos de dados na página, experimente criar novos blocos para ver o efeito!

### Não quer filtrar automaticamente?

Se você quer que o filtro só dispare após o usuário clicar num botão, no canto inferior direito do formulário de filtro clique em **«[Ações](/interface-builder/actions) (Actions)»** e marque os botões **«Filtrar (Filter)»** e **«Resetar (Reset)»**. Assim, o usuário precisa preencher as condições e clicar manualmente para filtrar.
![03-building-pages-2026-03-13-09-33-15](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-33-15.png)

### Outra forma de filtrar: ação de filtragem nativa da tabela

Além do bloco de formulário de filtro independente, o bloco de tabela também tem o botão **«Filtrar (Filter)»** nativo. Acima do bloco de tabela, clique em **«Ações (Actions)»**, marque **«Filtrar»** — um botão de filtro aparece na barra de ferramentas da tabela. Ao clicar, abre um painel de condições onde o usuário pode filtrar os dados diretamente por condições de campo.
![03-building-pages-2026-03-13-09-34-25](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-34-25.png)
![03-building-pages-2026-03-13-09-36-09](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-36-09.png)

Se você não quer ter que abrir o filtro toda vez para procurar campos, pode pré-configurar os campos de filtragem padrão nas configurações do botão de filtro. Assim, o usuário ao abrir já vê as condições mais comuns.
![03-building-pages-2026-03-13-09-38-37](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-38-37.png)

> **Atenção**: a ação de filtragem nativa da tabela atualmente **não suporta pesquisa difusa multi-campo**. Se você precisa de busca multi-campo, use o bloco de formulário de filtro acima junto com a função «Conectar campos».

### Definir ordenação padrão

Queremos que os tickets mais recentes apareçam primeiro:

1. Clique nas **configurações do bloco** no canto superior direito do bloco de tabela (ícone de três traços).
2. Encontre **«Configurar regra de [ordenação](/interface-builder/blocks/data-blocks/table)»**.
3. Adicione campo de ordenação: escolha **Data de criação**, modo de ordenação **decrescente**.

![03-building-pages-2026-03-13-09-40-54](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-40-54.png)

Assim, os tickets recém-submetidos sempre aparecem no topo, mais fácil de tratar.

## 3.6 Configurar Ações de Linha

Só ver a lista não basta — também precisamos poder clicar para ver detalhes do ticket e editar.

1. Acima da coluna de ação, clique no segundo "+".
2. Clique nas ações: **Visualizar**, **[Editar](/interface-builder/actions/edit)**, **[Excluir](/interface-builder/actions/delete)**.
3. Em cada linha de dados, na coluna de operações, vão aparecer os botões «Visualizar», «Editar» e «Excluir».

![03-building-pages-2026-03-13-09-42-42](https://static-docs.nocobase.com/03-building-pages-2026-03-13-09-42-42.png)

Ao clicar em «Visualizar», abre uma gaveta (Drawer), onde você pode colocar um bloco de detalhes para mostrar todas as informações. Vamos configurá-lo em detalhe no próximo capítulo.
Ao clicar em «Excluir», a linha é apagada.

## 3.7 Ajustar o Layout da Página

Até aqui a página tem dois blocos: formulário de filtro e tabela, mas eles ficam empilhados verticalmente por padrão, o que pode não ficar bonito. O NocoBase suporta **arrastar** para reorganizar a posição e o layout dos blocos.

No modo de configuração, mova o mouse para o canto superior esquerdo do bloco até a alça de arrastar (cursor vira flecha em cruz), segure e arraste.

**Coloque o formulário de filtro acima da tabela**: arraste o bloco de formulário de filtro para a borda superior da tabela; quando aparecer a linha azul de orientação, solte — o formulário de filtro fica acima da tabela.

![03-building-pages-2026-03-13-11-50-18](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-18.gif)

**Coloque os campos de filtro na mesma linha**: dentro do formulário de filtro, os campos por padrão são empilhados verticalmente. Arraste «Prioridade» para a direita de «Status»; quando aparecer a linha vertical de orientação, solte — os dois campos ficam lado a lado, economizando espaço vertical.

![03-building-pages-2026-03-13-11-50-58](https://static-docs.nocobase.com/03-building-pages-2026-03-13-11-50-58.gif)

> Quase tudo no NocoBase suporta arrastar — botões de ação, colunas de tabela, itens de menu, etc. Explore!

## 3.8 Configurar a Página de Categorias de Tickets

Não esqueça que na seção 3.2 criamos a subpágina «Categorias de Tickets». Agora vamos colocar conteúdo nela. O processo de configuração é parecido com a lista de tickets — adicionar bloco de tabela, marcar campos, configurar ações — não vou repetir, só destacar uma diferença chave.

Lembra que no Capítulo 2 criamos a tabela «Categorias de Tickets»? Ela é uma **tabela em árvore** (suporta hierarquia pai-filho). Para que a tabela exiba corretamente a estrutura em árvore, precisamos ativar uma opção:

1. Entre na página «Categorias de Tickets», adicione um bloco de tabela, escolha a tabela «Categorias de Tickets».
2. Clique nas **configurações do bloco** (ícone de três traços) e encontre **«Ativar tabela em árvore (Tree table)»** — ative.


Depois de ativar, a tabela exibe os relacionamentos pai-filho com indentação, em vez de listar todos os registros.

3. Marque os campos a exibir (nome, descrição, etc.) e configure as ações de linha (adicionar, editar, excluir).
4. **Sugestão de layout**: coloque «Nome» na primeira coluna e «Operações» na segunda. A tabela de categorias tem poucos campos — esse layout em duas colunas é mais compacto e amigável.

![03-building-pages-2026-03-13-18-51-36](https://static-docs.nocobase.com/03-building-pages-2026-03-13-18-51-36.png)

## Resumo

Parabéns! Nosso sistema de tickets já tem uma **interface administrativa** decente:

- Uma estrutura de menu clara (Gerenciamento de Tickets → Lista de Tickets / Categorias de Tickets)
- Um **bloco de tabela** que exibe os dados de tickets
- Um **formulário de filtro** para filtrar rapidamente por status, prioridade, categoria
- Uma **regra de ordenação** que ordena por data de criação decrescente
- Botões de ação de linha, facilitando visualizar e editar
- Uma **tabela em árvore** que exibe a hierarquia de categorias

Não é mais simples do que parecia? Todo o processo foi feito sem escrever uma linha de código, apenas com arrastar e configurar pela interface.

## Prévia do Próximo Capítulo

Só conseguir "ver" não basta — o usuário precisa **submeter novos tickets**. No próximo capítulo, vamos construir blocos de formulário, configurar regras de campo e ainda ativar histórico de registros para acompanhar cada mudança em tickets.

## Recursos Relacionados

- [Visão geral dos blocos](/interface-builder/blocks) — explicação de todos os tipos de bloco
- [Bloco de tabela](/interface-builder/blocks/data-blocks/table) — configuração detalhada do bloco de tabela
- [Bloco de filtro](/interface-builder/blocks/filter-blocks/form) — configuração do formulário de filtro
