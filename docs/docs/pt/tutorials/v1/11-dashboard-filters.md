# Capítulo 10: Filtros e condições do painel

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114031331442969&bvid=BV1pnAreHEME&cid=28477164740&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Neste capítulo, vamos guiá-lo, passo a passo, pela próxima parte do painel de tarefas. Em caso de dúvidas, fique à vontade para consultar o fórum.

Começamos revisando o capítulo anterior. Vamos juntos!

### 10.1 Resposta do capítulo anterior

#### 10.1.1 Status e links

Vamos adicionar links para os diferentes status, facilitando a navegação. Esta é a estrutura dos links por status:

(Suponha que o link seja `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`.)

##### Solução do desafio


| Status<br/>            | Link<br/>                                            |
| ---------------------- | ---------------------------------------------------- |
| Não iniciado<br/>      | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>  |
| Em andamento<br/>      | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>  |
| Aguardando revisão<br/>| hliu6s5tp9xhliu6s5tp9x?task_status=To be review</br> |
| Concluído<br/>         | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>    |
| Cancelado<br/>         | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>    |
| Arquivado<br/>         | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>     |

#### 10.1.2 Adicionar múltipla seleção para o Responsável

1. **Criar [campo personalizado](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)**: crie um campo "Responsável", do tipo múltipla seleção, e preencha os apelidos (ou nomes) dos membros para selecioná-los rapidamente ao atribuir tarefas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339318.png)

2. **Na configuração do relatório**: defina "Responsável/Apelido contém Filtro atual/Responsável" como condição. Assim, encontra rapidamente as tarefas associadas ao responsável atual.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192339382.png)

Faça alguns testes para garantir o funcionamento.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192359351.png)

---

### 10.2 Vincular o painel ao usuário

Podemos exibir conteúdos diferentes conforme o usuário:

1. **Defina o valor padrão de "Responsável" como "Usuário atual/Apelido"**: o sistema mostra automaticamente as tarefas relevantes para o usuário, melhorando a eficiência.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192340770.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341604.png)

2. **Atualize a página**: o painel carrega os dados associados ao usuário logado. (Lembre-se de adicionar a condição de filtro de usuário aos gráficos onde for necessário.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192341915.png)

---

### 10.3 Reformular o filtro de tarefas

Talvez você tenha percebido um design indesejado:

Ao saltar diretamente via "Definir faixa de dados" no bloco de tabela, as tarefas ficam pré-restritas ao status correspondente. Quando filtramos outro status, os dados ficam vazios!

E agora? Vamos remover o filtro de dados e adotar outra abordagem.

1. **Remover o filtro de dados**: para evitar que o status fique travado, ajustamos os filtros de forma flexível.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342837.png)

2. **Configurar valor padrão no bloco de filtro do tipo formulário.**

Lembra do nosso [bloco de filtro](https://docs-cn.nocobase.com/handbook/ui/blocks/filter-blocks/form)?

Crie um bloco de filtro do tipo formulário para a tabela de Tarefas. Configure os campos **Status** e os outros que você precisar, alimentados pelas variáveis vindas da URL. (Lembre-se de conectá-lo ao bloco de tarefas a ser filtrado.)

- Defina o valor padrão do campo Status como `URL search params/task_status`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192342708.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343402.png)

3. **Testar o novo filtro**: agora dá para alternar livremente os status.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343943.gif)

- **Opcional**: para que cada usuário foque nas próprias tarefas, defina o valor padrão de "Responsável" como "Usuário atual".

---

### 10.4 Notícias, comunicados e foco em informações

Vamos adaptar a base de documentos! Mostre o que é necessário no painel.

Em uma gestão de longo prazo, com cada vez mais documentos, surgem várias necessidades:

- News: foco em novidades, conquistas e marcos do projeto
- Comunicados/lembretes temporários

#### 10.4.1 Notícias em destaque (News)

1. **Adicionar campo "Notícia em destaque"**: na tabela de Documentos, adicione o campo do tipo checkbox "Notícia em destaque" para marcar documentos importantes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192343408.png)

2. **Marcar documentos importantes**: escolha um documento qualquer e, no formulário de edição, adicione e marque o campo "Notícia em destaque".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344181.png)

3. **Criar bloco do tipo "Lista"**: no painel, crie um [bloco de Lista](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/list) > selecione a tabela de Documentos.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344092.png)

Arraste para a direita, exiba "Data de criação" e "Título", ajuste a largura dos campos e desative "Mostrar título".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192344920.png)

4. **Exibir as notícias em destaque**:

Para reforçar a sensação de tempo real, podemos exibir também a data.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345763.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345055.png)

Ordene em ordem decrescente pela data de criação para mostrar as notícias mais recentes primeiro.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192345348.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346268.png)

Pronto, uma área simples de notícias em destaque! A equipe pode acompanhar o avanço do projeto a qualquer momento.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346930.png)

#### 10.4.2 Comunicados

A seguir, uma funcionalidade simples de comunicados públicos — algo que você já viu várias vezes em nosso Demo online. Para esses comunicados temporários, não queremos que apareçam permanentemente nem queremos registrar progresso de projeto. É só um lembrete temporário.

1. **Criar [bloco Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)**: escolha uma área qualquer do painel e use sintaxe Markdown para escrever o comunicado.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192346846.png)

Para mais detalhes sobre o uso prático do Markdown, consulte nosso Demo oficial, a documentação ou o [tutorial "Documentação leve"](https://www.nocobase.com/cn/tutorials).

Como exemplo simples, vamos demonstrar a potência do [bloco Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown) com um comunicado em HTML.

- Código de exemplo:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Comunicado importante</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Caros colegas:</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Para melhorar nossa eficiência, faremos um treinamento geral em <span style="color: red; font-weight: bold; font-size: 1.5em;">10 de novembro</span>.</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Obrigado pela colaboração!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Saudações,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Equipe de Gestão</p>
</div>
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412192347259.png)

### 10.5 Resumo

Com essas configurações, criamos um painel personalizado para a equipe gerenciar tarefas com mais eficiência, acompanhar o avanço do projeto e receber comunicados em tempo hábil.

De filtros de status à definição do responsável e exibição de notícias, o objetivo é melhorar a experiência do usuário e a praticidade do sistema.

Nosso painel personalizado está pronto! Teste-o e adapte conforme suas necessidades. Avancemos para o [próximo capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-subtasks-and-work-hours-calculation)!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
