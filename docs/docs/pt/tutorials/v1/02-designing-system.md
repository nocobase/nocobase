# Capítulo 2: Projetando o sistema de gerenciamento de tarefas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113593597037138&bvid=BV1oCi2YdEAU&cid=27174896249&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Projetar um sistema de gerenciamento de tarefas pode parecer complicado, mas com a ajuda do NocoBase esse processo se torna leve e divertido. Vamos analisar requisitos, projetar a estrutura de dados e planejar funcionalidades futuras, passo a passo. Fique tranquilo, não vamos nos enredar em pilhas de código — vamos montar seu sistema de gerenciamento de tarefas da maneira mais intuitiva e simples possível.

### 2.1 Análise de requisitos

Antes de pôr a mão na massa, vamos definir quais funcionalidades nosso sistema deve ter. Imagine como você gerencia tarefas no dia a dia, ou o que o sistema dos seus sonhos deveria fazer:

- **Gerenciamento de tarefas**: usuários podem criar, editar, excluir tarefas, atribuí-las a diferentes pessoas e acompanhar o progresso a qualquer momento.
- **Múltiplas visualizações**: tarefas podem ser exibidas como lista, kanban, gráfico de Gantt ou em uma visão de calendário.
- **Documentos online**: deve ser possível editar documentos de tarefas online para que a equipe entenda os detalhes.
- **Gerenciamento de anexos**: anexar imagens, vídeos, registros importantes etc. às tarefas.
- **Comentários**: pessoas envolvidas podem comentar nas tarefas, compartilhar opiniões e registrar discussões.

Em seguida, vamos organizar a relação entre esses módulos com um diagrama simples:
![](https://static-docs.nocobase.com/20241219-0-%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER.drawio.svg)

Ficou bem mais claro, não é?

---

> **Sobre Collections:** o NocoBase usa o conceito chamado "Collection" para descrever a estrutura de dados, unificando dados de fontes diferentes e fornecendo uma base sólida para gerenciamento e análise.
>
> Ele permite criar diversos tipos de tabelas, incluindo tabelas comuns, tabelas com herança, tabelas em árvore, tabelas de calendário, tabelas de arquivos, tabelas de expressão, tabelas SQL, tabelas de visão e tabelas externas, atendendo às mais variadas necessidades. Esse design torna a manipulação de dados mais flexível e eficiente.

### 2.2 Design das tabelas

Bom, agora precisamos pensar um pouco. Para suportar essas funcionalidades, precisamos planejar as tabelas do sistema. Não se preocupe, não precisamos de uma estrutura de banco de dados complexa — algumas tabelas simples serão suficientes.

Com base nos requisitos acima, normalmente projetaríamos as seguintes tabelas:

1. **Tabela de Usuários (Users)**: registra os usuários do sistema. Quem está executando tarefas? Quem é responsável pela gestão?
2. **Tabela de Tarefas (Tasks)**: registra os detalhes de cada tarefa, incluindo nome, documento, responsáveis e status do progresso.
3. **Tabela de Anexos (Attachments)**: registra todos os anexos relacionados às tarefas, como imagens, arquivos etc.
4. **Tabela de Comentários (Comments)**: registra os comentários dos usuários nas tarefas, facilitando a interação.

A relação entre essas tabelas é simples: cada tarefa pode ter vários anexos e comentários, e todos os anexos e comentários são criados ou enviados por algum usuário. Essa é a estrutura central do nosso sistema de gerenciamento de tarefas.

Veja o diagrama abaixo, que ilustra essas relações básicas:
![](https://static-docs.nocobase.com/%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86ER241219-0.drawio.svg)

### 2.3 Design das tabelas no NocoBase

Então, para implementar esse sistema no NocoBase, quais tabelas realmente precisamos criar? Mais simples do que você imagina:

- **Tabela de Tarefas**: o coração do sistema, onde armazenamos os detalhes de cada tarefa.
- **Tabela de Comentários**: armazena os comentários sobre as tarefas, para que a equipe possa interagir.

Para outras funcionalidades, como gestão de anexos e informações de usuário, o NocoBase já oferece soluções prontas — não é preciso criar nada manualmente. Bem mais leve, não é?

Vamos começar com um sistema simples de gerenciamento de dados de tarefas e expandir aos poucos. Por exemplo, primeiro definimos os campos básicos das tarefas e, depois, adicionamos a funcionalidade de comentários. Todo o processo é flexível e controlável.

A estrutura geral das tabelas, com os campos que precisamos, ficará mais ou menos assim:
![](https://static-docs.nocobase.com/241219-1.svg)

### Resumo

Com este capítulo, você já entendeu como projetar um sistema básico de gerenciamento de tarefas. No NocoBase, começamos pela análise de requisitos e planejamos tabelas e campos. A seguir, você verá que implementar essas funcionalidades é ainda mais simples do que projetá-las.

Por exemplo, a tabela de tarefas começa de forma bem enxuta, assim:

```text
Tabela de Tarefas (Tasks):
        Nome da tarefa (task_name) Texto de linha única
        Descrição da tarefa (task_description) Texto de várias linhas
```

Bem direto, não é? Pronto para o [próximo capítulo (Capítulo 3: Gerenciamento de dados de tarefas — eficiência ao alcance da mão)](https://www.nocobase.com/cn/tutorials/task-tutorial-data-management-guide)?

---

Continue explorando e crie sem limites! Se tiver dúvidas durante a prática, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou participar da [comunidade do NocoBase](https://forum.nocobase.com/). Até o próximo capítulo!
