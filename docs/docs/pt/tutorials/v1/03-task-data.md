# Capítulo 3: Gerenciamento de dados de tarefas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113504258425496&bvid=BV1XvUxYREWx&cid=26827688969&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Agora que já analisamos os requisitos do sistema de gerenciamento de tarefas, é hora de pôr a mão na massa! Lembre-se: nosso sistema precisa **[criar](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new), [editar](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) e [excluir](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete)** tarefas e também **consultar a lista de tarefas** — tudo isso pode ser feito por meio das páginas, blocos e ações do NocoBase.

> Acesse a documentação oficial para ver as definições detalhadas de [menus](https://docs-cn.nocobase.com/handbook/ui/menus) e [páginas](https://docs-cn.nocobase.com/handbook/ui/pages).

### 3.1 Como começar?

Você deve se lembrar de que já vimos como criar uma página e exibir a lista de usuários. Essas páginas funcionam como uma tela em branco, capazes de comportar diferentes tipos de blocos, que você pode reorganizar livremente. Para reforçar:

1. [**Criar página**](https://docs-cn.nocobase.com/handbook/ui/pages): basta alguns cliques para criar a página.
   ![Criar página](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333648.gif)
2. **Criar [bloco de tabela](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table)**: depois de selecionar o bloco de tabela, você pode exibir diferentes dados.
   ![Criar bloco de tabela](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162333239.gif)

Bem simples, certo?
Mas, ao abrir a "lista de dados", você vai notar que as opções padrão só trazem as tabelas "Usuários" e "Papéis".
Onde está a tabela de tarefas? Não se preocupe, a resposta está em [**Data Source**](https://docs-cn.nocobase.com/handbook/data-source-manager) do NocoBase.

> **Sobre Data Source:** um data source pode ser um banco de dados, uma API ou outro tipo de armazenamento de dados, com suporte a vários bancos relacionais, como MySQL, PostgreSQL, SQLite e MariaDB.
> No NocoBase, já existe o **plugin de gerenciamento de data source**, usado para gerenciar fontes de dados e tabelas. No entanto, o plugin de gerenciamento apenas fornece a interface — ele não fornece a capacidade de conectar diretamente a fontes de dados; precisa ser combinado com **plugins de data source** específicos.

### 3.2 Data Source: o repositório das suas tabelas

![](https://static-docs.nocobase.com/20241009144356.png)

No NocoBase, todas as tabelas ficam armazenadas em [**data sources**](https://docs-cn.nocobase.com/handbook/data-source-manager); cada data source é como um livro repleto do design e da estrutura de cada tabela. Vamos escrever a próxima página: a **tabela de Tarefas**.

> [!NOTE] Note
> Para conhecer mais recursos de data sources e tabelas, consulte [Gerenciamento de Data Source](https://docs-cn.nocobase.com/handbook/data-source-manager) e [Visão geral de Collections](https://docs-cn.nocobase.com/handbook/data-modeling/collection).

- **Acessar configurações do data source**:
  - Clique em **Configurações** no canto superior direito > **Data Source** > **Configuração do Data Source principal**.
  - Você verá todas as tabelas existentes no data source principal do NocoBase, normalmente apenas "Usuários" e "Papéis".
    ![Configuração do data source](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334835.gif)

Agora é hora de criar a terceira tabela, a nossa **Tabela de Tarefas**. É a primeira vez que criaremos uma tabela no NocoBase, um momento e tanto! Basta seguir o nosso design e criar uma tabela simples com os campos abaixo:

```
Tabela de Tarefas (Tasks):
        Nome da tarefa (task_name) Texto de linha única
        Descrição da tarefa (task_description) Texto de várias linhas
```

### 3.3 Criando a tabela de Tarefas

1. **Criar tabela de tarefas**:

   - Clique em "Criar tabela" > selecione **Tabela comum** > preencha o **nome da tabela** (ex.: "Tabela de Tarefas") e o **identificador da tabela** (ex.: "tasks").
   - O **identificador** é o ID único da tabela; recomendamos usar letras inglesas, números ou sublinhados, facilitando manutenções futuras.
   - Submeta para criar.
     ![Criar tabela de tarefas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162334006.gif)
2. **Campos padrão**:
   O NocoBase gera automaticamente alguns campos para cada tabela comum:

   - **ID**: identificador único de cada registro.
   - **Data de criação**: registra automaticamente quando a tarefa foi criada.
   - **Criado por**: registra automaticamente o autor da tarefa.
   - **Última modificação** e **modificado por**: registram quando e por quem a tarefa foi alterada.

Esses campos padrão atendem ao que precisamos e poupam o trabalho de adicioná-los manualmente.

3. **Criar campos personalizados**:
   - **Nome da tarefa**: clique em "Adicionar campo" > selecione **Texto de linha única** > defina o nome como "Nome da tarefa" e identificador como `task_name`.
     ![Criar campo nome da tarefa](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335943.gif)
   - **Descrição da tarefa**: crie outro campo do tipo **Texto de várias linhas** com identificador `task_description`.
     ![Criar campo descrição da tarefa](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162335521.gif)

Parabéns! A nossa **Tabela de Tarefas** já está definida — você criou com sucesso sua estrutura de dados. Mereceu!

### 3.4 Criando a página de gerenciamento de tarefas

Agora que temos a tabela, basta usar um bloco apropriado para exibi-la em uma página. Vamos criar uma **página de gerenciamento de tarefas** e adicionar um bloco de tabela exibindo os dados da tabela.

1. **Criar página "Gerenciamento de tarefas"**:

   - Clique em "Nova página" e nomeie como "Gerenciamento de tarefas".
   - Crie um bloco de tarefas que exiba os dados da tabela.
     ![Criar bloco de tarefas](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162336833.gif)
2. **Adicionar dados**:

   - "Ué, por que não há dados?" Não se preocupe, vamos adicionar agora!
   - Clique em "Configurar ações" no canto superior direito da página, clique em **"Adicionar"** e você verá um modal vazio.
     As ações [Adicionar](https://docs-cn.nocobase.com/handbook/ui/actions/types/add-new) e [Editar](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) ficam vinculadas a um modal por padrão.
   - Em seguida, entra em cena um novo bloco (formulário): crie um bloco no modal > selecione a **tabela atual**.
   - Exiba os campos de nome e descrição da tarefa, configure a ação de submissão e pronto!
     ![Configurar ações](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162337313.gif)
3. **Inserir dados**:

   - Insira um registro de teste e clique em enviar — pronto, sua tarefa foi adicionada!
     ![Submeter dados](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338074.gif)

Momento empolgante! Você cadastrou sua primeira tarefa. Bem simples, não?

### 3.5 Consulta e filtro de tarefas — encontre rapidamente o que precisa

Quando as tarefas começam a se acumular, como localizar rapidamente aquela que você quer? É aí que entra a [**ação de Filtro**](https://docs-cn.nocobase.com/handbook/ui/actions/types/filter). No NocoBase, você pode encontrar tarefas específicas combinando condições no filtro.

#### 3.5.1 Habilitar a ação de filtro

Primeiro, vamos habilitar a ação:

- **Passe o mouse sobre "Configurar ações"** e clique no **interruptor de filtro** para ativá-lo.
  ![Habilitar filtro](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338152.png)

#### 3.5.2 Usar condições de filtro

Após habilitar, você verá o botão de filtro na página. Vamos testar filtrar pelo **nome da tarefa**:

- No painel de filtro, escolha "Nome da tarefa" e digite o que deseja procurar.
- Clique em "Submeter" e veja se a lista exibe os resultados filtrados corretamente.
  ![Habilitar filtro](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162338495.gif)

#### 3.5.3 Desativar a ação de filtro

Se não precisar mais do filtro, normalmente para ações do tipo interruptor basta um clique para cancelar:

- **Limpe os filtros**: certifique-se de que nenhum filtro esteja em vigor; clique em "Resetar".
- Clique novamente no **interruptor de "Filtro"**, e ele desaparece da página.
  ![Desativar filtro](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339299.gif)

Pronto! O filtro vai facilitar muito o gerenciamento de muitas tarefas e, conforme avançarmos, mais formas de consulta serão reveladas. (Você pode consultar [Bloco de filtro - Formulário](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form) e [Bloco de filtro - Painel recolhível](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/collapse).)

Mantenha o entusiasmo, vamos seguir em frente!

### 3.6 Edição e exclusão de tarefas

Além de adicionar e consultar, precisamos também [**editar**](https://docs-cn.nocobase.com/handbook/ui/actions/types/edit) e [**excluir**](https://docs-cn.nocobase.com/handbook/ui/actions/types/delete) tarefas. Como você já está familiarizado com a adição de blocos, campos e ações, este passo é tranquilo:

1. **Editar tarefa**:

   - Na configuração da lista de tarefas, adicione a ação **Editar**, clique em editar > adicione um bloco de formulário (edição) > selecione os campos a editar.
2. **Excluir tarefa**:

   - Da mesma forma, na configuração da coluna de ações, ative o interruptor de **Excluir**; o botão aparecerá. Clique em excluir > confirme, e a tarefa é removida da lista.
     ![Editar tarefa](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412162339672.gif)

Pronto! As operações de **CRUD** da lista de tarefas estão todas implementadas.

Excelente! Mais uma etapa concluída!

### Desafio

Conforme você ficar mais confortável com o NocoBase, experimente este pequeno desafio: precisamos marcar o status das tarefas e permitir o upload de anexos. Como faria?

Dica:

- Adicione à tabela de Tarefas:
  1. O campo **Status (status)**, do tipo dropdown (seleção única), com as opções: **Não iniciado, Em andamento, Aguardando revisão, Concluído, Cancelado, Arquivado**.
  2. O campo **Anexo (attachment)**.
- Nos blocos da tabela de Tarefas, no formulário de "Adicionar" e no de "Editar", exiba os campos "Status" e "Anexo".

Já tem ideias? Calma, o [próximo capítulo (Capítulo 4: Plugins de tarefas e comentários — recursos extras dominados)](https://www.nocobase.com/cn/tutorials/task-tutorial-plugin-use) revelará as respostas. Vamos lá!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
