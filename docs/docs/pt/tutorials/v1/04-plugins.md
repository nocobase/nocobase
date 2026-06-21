# Capítulo 4: Plugins de tarefas e comentários

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113532393752067&bvid=BV16XB2YqERC&cid=26937593203&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe

## Recapitulando o capítulo anterior

Você se lembra do desafio da seção anterior? Precisávamos configurar os campos **Status** e **Anexo** na tabela de Tarefas e exibi-los na lista. Vamos às respostas!

1. **Configuração do campo Status**:
   - Selecione o campo [**Dropdown (seleção única)**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/choices/select), preencha as opções: **Não iniciado, Em andamento, Aguardando revisão, Concluído, Cancelado, Arquivado**. Defina as cores de acordo com sua preferência para dar um toque de cor às tarefas!

![Configuração do campo Status](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162341275.png)

2. **Configuração do campo Anexo**:
   - Crie um campo do tipo [**Anexo**](https://docs-cn.nocobase.com/handbook/file-manager/field-attachment), dê um nome a ele (por exemplo "Anexo") e clique em enviar. Simples assim.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162343470.png)

3. **Exibir Criado por e Status na lista de tarefas**:
   - No bloco de tabela, marque os campos "Criado por", "Status" e "Anexo" para que a lista exiba mais informações relevantes.

![Exibir campos na lista de tarefas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162344570.png)

4. **Mostrar campos nos formulários de adição e edição**:
   - No formulário do modal, não esqueça de marcar os campos Status e Anexo, para que possa preenchê-los ao adicionar ou editar.

![Mostrar campos no formulário](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162345053.gif)

Bom, hein? Repita esses passos algumas vezes e você dominará o uso central do NocoBase. Cada operação fortalece a base do gerenciamento de tarefas. Vamos em frente!

---

## 4.1 Conteúdo da tarefa e comentários: interatividade no gerenciamento

Até aqui, seu sistema já é capaz de armazenar informações básicas das tarefas. No entanto, gerenciar tarefas vai além de algumas linhas de descrição — às vezes precisamos de conteúdos mais ricos e de interação em tempo real entre membros da equipe.

### 4.1.1 Markdown(Vditor): conteúdo de tarefa muito mais rico

Você já deve ter notado os editores de [**texto rico**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/rich-text) e [**Markdown**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/media/markdown) do NocoBase, mas talvez achem suas funcionalidades limitadas.
O editor de texto rico tem recursos limitados; o editor Markdown é prático, mas não suporta pré-visualização em tempo real.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162346447.png)

Existe um editor que ofereça pré-visualização em tempo real e funcionalidades mais completas? Sim! O [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor) é o editor de texto mais poderoso do NocoBase, com pré-visualização em tempo real, upload de imagens e até gravação de áudio. Ele já vem embutido no sistema, totalmente gratuito!

> **Sobre plugins:** plugins são uma funcionalidade central do NocoBase, permitindo adicionar recursos personalizados ou integrar serviços de terceiros conforme suas necessidades.
> Por meio de plugins, você implementa integrações práticas e até inesperadas, facilitando ainda mais a sua criação e desenvolvimento.

A seguir, vou guiar você passo a passo até esse editor poderoso. Lembra do nosso Gerenciador de Plugins? Pois é, é onde ele está!

> **Markdown(Vditor)**: armazena Markdown e usa o editor Vditor para renderizar; suporta a sintaxe Markdown comum (listas, código, citações etc.) e permite upload de imagens, gravação de áudio e edição WYSIWYG em tempo real.

1. **Habilitar o plugin Markdown(Vditor)**:
   - Abra o **Gerenciador de Plugins** no canto superior direito, busque por "markdown" e ative o [**Markdown(Vditor)**](https://docs-cn.nocobase.com/handbook/field-markdown-vditor). Não se preocupe com o breve refresh da página; em alguns segundos tudo volta ao normal.

![Habilitar plugin Markdown](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162348237.png)

2. **Criar campo Markdown**:

   - Volte à tabela de Tarefas, clique em "Criar campo": nosso Markdown Pro Plus apareceu!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162349275.png)

- Dê um nome a ele, por exemplo "Detalhes da tarefa (task_detail)", e marque todas as funcionalidades disponíveis.

3. Você deve ter notado a opção "tabela de arquivos" — não selecioná-la afetará o upload? Não se preocupe, os arquivos serão armazenados no espaço padrão. Pode usar tranquilamente.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162350389.gif)

4. **Testar o campo Markdown**:
   - Volte à página de Gerenciamento de tarefas e escreva o seu primeiro texto Markdown! Cole imagens, faça upload de arquivos — sentiu o poder?

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162351380.gif)

A tabela de tarefas está cada vez mais rica! Seguindo cada passo, seu sistema ganha funcionalidades aos poucos. A seguir, vamos ver como ajustar o layout dos campos para deixar a interface mais agradável.

### 4.1.2 Ajustando a disposição dos campos

Conforme adicionamos mais campos à tabela de tarefas, o layout pode ficar bagunçado. A flexibilidade do NocoBase permite reorganizá-los facilmente.

**Reposicionar campos**:

- Passe o mouse sobre o ícone em cruz no canto superior direito do campo, clique e arraste-o para a posição desejada e solte. Pronto! A página fica imediatamente mais organizada.

![Reposicionar campos](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162352077.gif)

Após esse ajuste, o layout fica de acordo com suas preferências. Agora, vamos adicionar a funcionalidade de comentários para facilitar a interação na equipe.

## 4.2 Funcionalidade de comentários

Só a descrição não basta; às vezes a equipe precisa comentar nas tarefas, discutir e registrar feedback. Vamos implementar isso.

### 4.2.1 Método 1: usar o plugin de comentários

#### 4.2.1.1 Instalar o plugin de comentários

> **Plugin de comentários (plugin comercial):** fornece template de tabela de comentários e bloco de comentários, adicionando comentários a qualquer tabela de dados.
>
> Atenção: ao adicionar comentários, é preciso usar um campo de relação para vincular à tabela alvo, evitando conflitos.

No [**Gerenciador de Plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager), faça upload e ative o **plugin de comentários**. Após ativar, no data source aparecerá uma nova opção "Tabela de Comentários".
Clique em adicionar > upload de plugin > arraste o pacote zip > submeta.
Procure por "comentários" e o plugin estará lá! Ative-o, vá ao data source e veja a opção da tabela — instalado com sucesso!

![Instalar plugin de comentários](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162353550.gif)

#### 4.2.1.2 Criar tabela de comentários

Mude para o data source e crie a tabela de dados **Tabela de Comentários (Comments)**.

#### 4.2.1.3 Discussão sobre o relacionamento entre Comentários e Tarefas

Já criamos a **Tabela de Comentários (Comments)**. Talvez você pense: posso ir direto desenhar a área de comentários? Calma — primeiro pense: **cada tarefa tem sua área de comentários**, então a relação entre comentários e tarefas é **muitos-para-um**. Como conectá-los?

**É aí que entra o [campo de relação](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations)!**

O NocoBase nos permite estabelecer relações entre tabelas no nível dos dados, como uma ponte que conecta dados relacionados.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162355370.gif)

**Por que escolher muitos-para-um?**

Por que escolher a relação [**muitos-para-um**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), em vez de [**um-para-muitos**](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/o2m) ou outras? Pense: **cada tarefa tem vários comentários**; ou seja, vários comentários apontam para a mesma tarefa. Nesse caso, criamos um campo **muitos-para-um** na tabela de comentários, apontando para a tabela de tarefas.

> Você, esperto que é, pode estar pensando:
> Se comentário e tarefa têm relação muitos-para-um, então não posso criar um campo um-para-muitos na tabela de tarefas apontando para a tabela de comentários?
> **Exatamente!** Um-para-muitos e muitos-para-um são relações inversas. Então sim, podemos criar um campo um-para-muitos na tabela de tarefas, ligado à tabela de comentários. Muito bem!

#### 4.2.1.4 Configurar campo de relação muitos-para-um

Vamos criar o campo muitos-para-um na tabela de comentários para vincular à tabela de tarefas. Vamos chamá-lo de **tarefa associada (belong_task)**. Algumas configurações importantes:

1. **Tabela de origem**: a partir de onde criamos a relação? Aqui escolhemos a **tabela de Comentários**.
2. **Tabela alvo**: com qual tabela queremos relacionar? A **tabela de Tarefas**.

> **Chave estrangeira e identificador da tabela alvo: um exemplo:**
> A próxima parte é a chave: **chave estrangeira** e **identificador da tabela alvo**.
> Parece complicado? Vejamos um exemplo.
>
> **Imagine** que você tem várias provas finais e a missão é encontrar o aluno correspondente a cada prova. Como faríamos?
> Pegamos uma prova com as informações:
>
> - **Nome**: Zhang San
> - **Turma**: 3º ano, classe 15
> - **Número de matrícula**: 202300000001
> - **CPF**: 111111111111
>   Agora, suponha que você queira identificar Zhang San apenas pelo **nome** e pela **turma**. Mas há um problema — na escola toda há vários "Zhang San", e a classe 15 do 3º ano tem **20 alunos com esse nome**! Só com o nome e a turma fica difícil identificar o aluno certo.
>   **Precisamos de um identificador mais único.** Por exemplo, o **número de matrícula**. Cada aluno tem um número exclusivo; com ele identificamos o aluno com precisão. Por exemplo, você consulta o número 202300000001 e a escola responde: "Esta prova é do Zhang San, da classe 15, o terceiro da fila, o que usa óculos!"
>   **De forma análoga**, no design do relacionamento dos **comentários**, talvez você tenha tido a ideia: podemos pegar um identificador único da tabela de tarefas (como o **id**) e gravá-lo no comentário, definindo a qual tarefa ele pertence?
>   Esse é o conceito central da relação muitos-para-um: a **chave estrangeira**. Simples, né?

Na tabela de comentários armazenamos o id único da tarefa, que chamaremos de **task_id**, e usamos ele para amarrar comentários e tarefas.

#### 4.2.1.5 Estratégia de chave estrangeira ao excluir

No NocoBase, ao definir a relação muitos-para-um, é preciso pensar no que acontece com os comentários quando a tarefa é excluída. Você pode escolher uma destas opções:

- **CASCADE**: ao excluir a tarefa, todos os comentários relacionados também são excluídos.
- **SET NULL** (padrão): ao excluir a tarefa, os comentários permanecem, mas a chave estrangeira é zerada.
- **RESTRICT** e **NO ACTION**: se a tarefa tem comentários relacionados, o sistema impede a exclusão, garantindo que nenhum comentário se perca.

#### 4.2.1.7 Criar relação inversa na tabela de Tarefas

Por fim, marque "**criar campo de relação inverso na tabela alvo**" para podermos visualizar todos os comentários relacionados a partir da tarefa. Isso facilita o gerenciamento dos dados.

No NocoBase, o local onde o campo de relação fica armazenado define como os dados são acessados. Para também visualizarmos os comentários a partir da tabela de tarefas, criamos um campo **um-para-muitos** na tabela de Tarefas apontando para a tabela de Comentários.

Quando você abrir novamente a tabela de Tarefas, o sistema gerou automaticamente o campo de relação com os comentários, marcado como **um-para-muitos**, para você visualizar e gerenciar facilmente todos os comentários ligados à tarefa.

## 4.3 Montando a página

### 4.3.1 Habilitar o bloco de comentários

Chegou o momento esperado: voltamos ao modal de edição, criamos o bloco da tabela de Comentários, marcamos os campos necessários e pronto!

![demov3N-16.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162357118.gif)

### 4.3.2 Ajustar a página

Vamos deixar o estilo bonito: passe o mouse no canto superior direito do botão de edição, escolha o modal mais largo. Aproveite o que aprendemos sobre arrastar blocos e mova o de comentários para a direita do modal. Perfeito!

![demov3N-17.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162358300.gif)

Talvez você esteja com vontade de também implementar comentários, mas sem o plugin comercial. Não se preocupe, há uma alternativa gratuita.

### 4.2.2 Método 2: tabela de comentários personalizada

Se você não comprou o plugin de comentários, podemos criar uma tabela comum para implementar uma funcionalidade similar.

1. **Criar tabela de comentários**:

   - Crie a tabela **comments2**, adicione o campo **Conteúdo (content)** (tipo Markdown) e o campo **Tarefa associada (belong_task)** (tipo muitos-para-um).
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170001040.gif)
2. **Criar bloco de lista de comentários na página**:

   - No modal de edição da tabela de Tarefas, adicione um [**bloco de lista**](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) (eis nosso terceiro tipo de bloco — listas também conseguem mostrar detalhes dos campos), selecione "comentários" e teste:
     ![Criar bloco de lista de comentários](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412170003544.gif)

## Resumo

Você aprendeu a usar o Markdown(Vditor) para enriquecer o conteúdo das tarefas e adicionou a funcionalidade de comentários! O sistema de gerenciamento de tarefas já tem uma base completa de funcionalidades. Sente-se mais perto de construir uma ferramenta profissional de gerenciamento de tarefas?

Continue explorando e operando — o NocoBase é cheio de possibilidades. Se tiver dúvidas, calma, estou aqui para guiá-lo a cada passo.

[Próximo capítulo (Capítulo 5: Abas e blocos — visões variadas, exibições incríveis)](https://www.nocobase.com/cn/tutorials/task-tutorial-tabs-blocks): vamos explorar mais funcionalidades de blocos do NocoBase para elevar o sistema a um novo nível. Bora!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
