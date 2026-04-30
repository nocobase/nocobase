# Capítulo 11: Subtarefas e cálculo de horas

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114042521847248&bvid=BV13jPcedEic&cid=28510064142&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Pessoal, finalmente um novo capítulo! Com a expansão dos negócios, as tarefas ficam cada vez mais numerosas e complexas. Aos poucos percebemos que o gerenciamento simples não basta. Precisamos de um controle mais detalhado, dividindo as tarefas em vários níveis para todo mundo trabalhar com mais eficiência.

### 11.1 Planejamento de tarefas: do todo às partes

Vamos decompor tarefas complexas em pequenas tarefas gerenciáveis, acompanhando o progresso para entender claramente o status, e organizar tudo em múltiplos níveis. Vamos começar o planejamento!

---

### 11.2 Criando a tabela de subtarefas

#### 11.2.1 Estrutura das subtarefas

Primeiro criamos a "tabela de Subtarefas" (Sub Tasks, [**tabela em árvore**](https://docs-cn.nocobase.com/handbook/collection-tree)) com estrutura em árvore. As propriedades das subtarefas são parecidas com as da tarefa principal: "Nome", "Status", "Responsável", "Progresso" etc. Conforme o caso, dá para acrescentar comentários, documentos etc.

Para ligar as subtarefas à tarefa principal, criamos uma relação muitos-para-um, fazendo com que cada subtarefa pertença a uma tarefa principal. Adicionamos a relação inversa para visualizar e gerenciar as subtarefas dentro da tarefa principal.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038668.png)

> Dica: recomendamos criar pelo bloco de relação na página da tarefa principal — fica mais prático!

#### 11.2.2 Mostrar subtarefas na página de gerenciamento de tarefas

No gerenciamento de tarefas, configuramos a exibição da "tabela de Tarefas" no [modo de **página**](https://docs-cn.nocobase.com/handbook/ui/pop-up#%E9%A1%B5%E9%9D%A2).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210038281.png)

Na página, criamos uma nova aba "Gerenciamento de subtarefas" e adicionamos a tabela de Subtarefas, exibindo-a com a estrutura em árvore. Assim conseguimos gerenciar e visualizar as subtarefas na mesma página.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039360.png)

---

### 11.3 Gráfico de comparação de horas: estimativa total e progresso (opcional)

A seguir, montamos os detalhes de horas e o gráfico de comparação para estimar o total e o avanço da tarefa.

#### 11.3.1 Adicionar campos de tempo e horas à subtarefa

Adicione os seguintes campos à tabela de Subtarefas:

- **Data de início**
- **Data de término**
- **Horas totais**
- **Horas restantes**

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039376.png)

Com esses campos, calculamos dinamicamente a duração e as horas das tarefas.

#### 11.3.2 Calcular a duração da tarefa

Crie um campo do tipo [fórmula](https://docs-cn.nocobase.com/handbook/field-formula) chamado "Dias" na tabela de Subtarefas para calcular a duração.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039534.png)

As formas de cálculo são:

- Math.js

  > Usa a biblioteca [math.js](https://mathjs.org/), capaz de calcular fórmulas numéricas complexas.
  >
- Formula.js

  > Usa a biblioteca [Formula.js](https://formulajs.info/functions/) para fórmulas comuns. Se você conhece fórmulas do Excel, vai se sentir em casa!
  >
- Template de string

  > Como o nome sugere, é uma forma de concatenação de strings. Útil para descrições e numerações dinâmicas.
  >

Aqui usamos `Formula.js`, similar ao Excel, prático para fórmulas comuns.

A fórmula do campo "Dias":

```html
DAYS(Data de término, Data de início)
```

Use letras minúsculas em inglês para evitar erros.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210039721.png)

Pronto! Na página, os dias mudam dinamicamente conforme as datas de início/fim!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040540.png)

---

### 11.4 Apontamento diário de horas: rastreando o progresso real (opcional)

#### 11.4.1 Criar a tabela de apontamento diário

Crie uma tabela de apontamento diário para registrar o avanço diário das tarefas. Adicione os campos:

- **Horas do dia** (`hours`, recomendado inteiro)
- **Data**
- **Horas ideais** (`ideal_hours`, recomendado inteiro)
- **Subtarefa correspondente**: relação [muitos-para-um](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o) com a subtarefa.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040220.png)

#### 11.4.2 Mostrar apontamento diário na página da subtarefa

Volte à página de edição da subtarefa e exiba a tabela de apontamento como [subtabela](https://docs-cn.nocobase.com/handbook/ui/fields/specific/sub-table), arrastando os campos pelo layout. Assim, é fácil registrar e consultar o apontamento diário na própria subtarefa.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040223.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210040658.png)

---

### 11.5 Cálculos-chave e regras de associação (opcional)

Para estimar com mais precisão o progresso e as horas restantes, vamos fazer algumas configurações importantes.

#### 11.5.1 Definir campos da subtarefa como [obrigatórios](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required)

Marque **Data de início**, **Data de término** e **Horas estimadas** como [obrigatórios](https://docs-cn.nocobase.com/handbook/ui/fields/field-settings/required), garantindo que esses dados estejam completos para os cálculos.

#### 11.5.2 Definir [regras de associação](https://docs-cn.nocobase.com/handbook/ui/actions/action-settings/linkage-rule) para percentual concluído e horas restantes

Na tabela de Subtarefas, adicione as regras:

- **Percentual concluído**: soma das horas diárias / horas estimadas

```html
SUM(【Formulário atual / Apontamento diário / Horas do dia】)  /  【Formulário atual / Horas estimadas】
```

- **Horas restantes**: horas estimadas - soma das horas diárias

```html
【Formulário atual / Horas estimadas】 - SUM(【Formulário atual / Apontamento diário / Horas do dia】)
```

![202411170353551731786835.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041551.png)

- Da mesma forma, configuramos as horas ideais nas regras de associação do apontamento diário:

```html
  【Formulário atual / Horas estimadas】 / 【Formulário atual / Duração da tarefa】
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041181.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041066.png)

Com isso, calculamos em tempo real o progresso e as horas restantes.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210041018.png)

### 11.6 Criando o gráfico de progresso da tarefa (opcional)

#### 11.6.1 Criar [gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) de progresso da tarefa

Crie um bloco de gráfico para somar as **horas diárias** e as **horas ideais** ao longo do tempo, exibindo o avanço da tarefa por data.

Restringimos com 【Tarefa associada/Id】igual a 【Registro do modal atual/ID】, garantindo que o gráfico reflita a tarefa atual.

![202411170417341731788254.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042680.png)

![202411170418231731788303.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210042027.png)

#### 11.6.2 Mostrar informações básicas e variação do progresso

Lembra do [bloco Markdown](https://docs-cn.nocobase.com/handbook/ui/blocks/other-blocks/markdown)? Usaremos o bloco `markdown` para exibir as informações básicas e o avanço da tarefa.

Renderize o percentual de progresso usando templates [`Handlebars.js`](https://docs-cn.nocobase.com/handbook/template-handlebars):

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412210043291.png)

```html
Progress of Last Update:
<p style="font-size: 54px; font-weight: bold; color: green;">
{{floor (multiply $nRecord.complete_percent 100)}}
 %
</p>
```

A renderização dinâmica usa [Handlebars.js](https://docs-cn.nocobase.com/handbook/template-handlebars); consulte a documentação oficial para conhecer a sintaxe.

---

### 11.7 Resumo

Parabéns! Você concluiu a divisão em subtarefas. Com gestão multinível, apontamento diário de horas e gráficos, conseguimos enxergar com clareza o progresso e ajudar a equipe a trabalhar com mais eficiência. Obrigado pela paciência! Continue empenhado e nos vemos no [próximo capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-meeting-room-booking)!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
