# Capítulo 9: Painel de tarefas e gráficos

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=113821700067176&bvid=BV1XVcUeHEDR&cid=27851621217&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Caros amigos, finalmente chegamos ao capítulo de visualização que tanto esperávamos! Aqui vamos discutir como, em meio a tantas informações, focar rapidamente no que realmente importa. Como gestores, não podemos nos perder no meio de tarefas complexas! Vamos resolver as estatísticas de tarefas e a exibição das informações de forma simples.

### 9.1 Foco em informações-chave

Queremos visualizar facilmente o status das tarefas da equipe e encontrar as tarefas pelas quais somos responsáveis ou que nos interessam, em vez de ficarmos perdidos em meio a informações desnecessárias.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001054.gif)

Para começar, vejamos como criar um [gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block) com estatísticas de tarefas da equipe.

#### 9.1.1 Criar [bloco de dados de gráficos](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block)

Crie uma nova página (por exemplo, "Painel pessoal"):

1. Adicione o bloco de dados de gráficos. (Atenção: dentro deste grande bloco podemos criar muitos gráficos.)
2. Dentro do bloco de gráficos, escolha o objetivo: tabela de Tarefas. Vamos para a configuração do gráfico.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200001737.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002850.png)

#### 9.1.2 Configurar a contagem por status

Para contar as tarefas por status, vamos preparar os dados:

- Métrica: escolha um campo único, como o ID, para contar.
- Dimensão: agrupe pelo Status.

Em seguida, configure o gráfico:

1. Selecione [gráfico de colunas](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/column) ou [gráfico de barras](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/bar).
2. No eixo X, escolha "Status"; no eixo Y, "ID". Lembre-se de escolher a categorização "Status"! (Sem isso, o gráfico não distingue cores.)

   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200002203.gif)

#### 9.1.3 Estatísticas multidimensionais: tarefas por pessoa

Para contar a quantidade de tarefas por pessoa em cada status, faça uma análise com duas dimensões! Acrescentamos a dimensão "Responsável/Apelido".

1. Clique em "Executar consulta" no canto superior esquerdo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003904.png)

2. O gráfico pode parecer estranho, sem o efeito desejado. Tudo bem: selecione "Agrupar" para expandir a comparação por responsável.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200003355.gif)

3. Para visualizar o total empilhado, selecione "Empilhar". Dá para ver a proporção por pessoa + o total!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004277.gif)

### 9.2 Filtros e exibição dinâmica

#### 9.2.1 Configurar filtro de dados

Podemos remover os dados "Cancelado" e "Arquivado" usando os filtros à esquerda — você já está bem familiarizado com esse tipo de condição.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200004306.png)

Após filtrar, clique em confirmar e saia da configuração; o primeiro gráfico está pronto.

#### 9.2.2 [Copiar gráfico](https://docs-cn.nocobase.com/handbook/data-visualization/user/chart-block#%E5%8C%BA%E5%9D%97%E8%AE%BE%E7%BD%AE)

E se você quiser exibir simultaneamente "Agrupar" e "Empilhar" sem reconfigurar?

- No canto superior direito do primeiro gráfico, clique em copiar.
- Role para baixo: o segundo gráfico apareceu. Arraste-o para a direita e altere "Empilhar" para "Agrupar".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005923.png)

#### 9.2.3 [Filtros](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) dinâmicos

E se quisermos [filtrar](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter) dinamicamente sob diferentes condições?

Sem problema! Abra o "Filtro" abaixo do bloco de dados de gráficos. Aparece a barra de filtro no topo. Exiba os campos desejados e configure as condições. (Por exemplo, mude o campo de data para "Entre".)

![202412200005784.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200005784.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006733.gif)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200006599.gif)

#### 9.2.4 Criar campo de filtro personalizado

E se, em situações especiais, quisermos incluir "Cancelado" e "Arquivado", com filtro dinâmico e valor padrão?

Vamos criar um [campo de filtro personalizado](https://docs-cn.nocobase.com/handbook/data-visualization/user/filter#%E8%87%AA%E5%AE%9A%E4%B9%89%E5%AD%97%E6%AE%B5)!

> Campo de filtro personalizado: você pode escolher um campo da tabela ou um campo personalizado (apenas em gráficos).
>
> É possível editar título, descrição, operadores e valor padrão (como "usuário atual" ou "data"), ajustando o filtro às suas necessidades.

1. Título: "Status".
2. Origem: deixe vazio.
3. Componente: "Checkbox".
4. Opções: preencha conforme os valores definidos no banco quando criamos os status (atenção: a ordem é rótulo - valor).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007629.gif)

Após criar, clique em "Definir valor padrão" e selecione as opções desejadas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200007565.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008813.gif)

Após definir o valor padrão, volte à configuração do gráfico e mude a condição para "Status - Contém qualquer um - Filtro atual/Status". Clique em confirmar! (Repita para os dois gráficos.)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008453.png)

Pronto. Vamos testar e os dados aparecem perfeitamente.

![202411162003151731758595.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200008517.png)

### 9.3 Links dinâmicos e filtro de tarefas

Agora vamos implementar uma funcionalidade prática: ao clicar em uma estatística, ir direto para o filtro correspondente. Para isso, criamos gráficos de quantidade por status no topo.

#### 9.3.1 Como exemplo, "Não iniciado", crie um [gráfico estatístico](https://docs-cn.nocobase.com/handbook/data-visualization/antd/statistic)

1. Métrica: contagem de ID.
2. Filtro: Status igual a "Não iniciado".
3. Nome do container: "Não iniciado", tipo "Estatística"; deixe o nome do gráfico abaixo em branco.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009179.png)

A estatística "Não iniciado" foi exibida. Replique para os cinco status restantes e arraste para o topo.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200009609.png)

#### 9.3.2 Configurar o link de filtro

1. Volte à página onde está o bloco de tabela de Tarefas e veja o formato do link na barra de endereços (algo como `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200011236.png)

   Imagine que `xxxxxxxxx` é o domínio e `/admin/0z9e0um1vcn` é o caminho. (Procuramos pelo último `/admin`.)
2. Copie a parte do link

   - Precisamos saltar via link. Para isso, extraia a parte específica.
   - A partir de `admin/` (sem incluir `admin/` em si), copie até o final do link. No exemplo: `0z9e0um1vcn`.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200015179.png)

Ao passar o mouse sobre "Não iniciado", o cursor vira mãozinha; clique e o salto funciona.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200016385.gif)

3. Configure o link do gráfico
   Agora adicione um parâmetro de filtro ao link. Lembra do identificador do status no banco? Vamos adicionar esse parâmetro ao final do link.
   - Ao final do link adicione `?task_status=Not started`, ficando: `0z9e0um1vcn?task_status=Not started`
     ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200021168.png)

> Entenda o formato dos parâmetros na URL:
> Algumas regras ao adicionar parâmetros:
>
> - **Interrogação (?)**: início dos parâmetros.
> - **Nome e valor do parâmetro**: no formato `nome=valor`.
> - **Vários parâmetros**: separe-os com `&`, por exemplo:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`
>   Aqui, `user` é outro parâmetro, e `123` é o valor.

4. Volte à página, clique para saltar — sucesso! A URL agora traz o parâmetro desejado.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200034337.png)

#### 9.3.3 [Vincular condições de filtro com a URL](https://docs-cn.nocobase.com/handbook/ui/variables#url-%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0)

Por que a tabela ainda não respondeu? Falta o último passo!

- Volte à configuração do bloco de tabela e clique em "Definir faixa de dados".
- Selecione "Status" igual a "Parâmetro de URL/status".

Confirme — filtro funcionando!

![2c588303ad88561cd072852ae0e93ab3.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035431.png)
![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200035362.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036841.png)

![202411162111151731762675.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200036320.png)

### 9.4 [Visualização de Dados](https://docs-cn.nocobase.com/handbook/data-visualization): gráficos incríveis

> Visualização de Dados: [ECharts](https://docs-cn.nocobase.com/handbook/data-visualization-echarts) (plugin comercial, pago).
> O ECharts oferece mais opções de configuração e gráficos personalizados, como [Linhas (várias dimensões)](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/line), [Radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar), [Word Cloud](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)...

Para mais opções, ative o bloco "Visualização de Dados: ECharts"!

#### 9.4.1 Configurando rapidamente um [Radar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/radar) bonito

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037284.png)

Se notar sobreposição, ajuste o tamanho ou o raio para que tudo apareça claramente!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037077.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200037464.png)

Após configurar, ajuste o layout e está pronto!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038221.gif)

#### 9.4.2 Mais containers de gráficos

Há muitos outros gráficos para explorar.

##### [Word Cloud](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200038880.gif)

##### [Funil](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039012.gif)

##### [Múltiplas métricas (Dual-axes, ECharts Linhas)](https://docs-cn.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

No Dual-axes, você pode adicionar mais métricas.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039494.gif)

##### [Barras divergentes](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412200039203.gif)

### 9.5 Pequeno desafio

Antes de encerrarmos, mais um pequeno desafio:

1. Adicione os parâmetros de URL para os demais status (**Em andamento, Aguardando revisão, Concluído, Cancelado, Arquivado**), garantindo o salto e o filtro funcionando.
2. Configure o campo "Responsável" como múltipla seleção, igual ao "Status", e defina o valor padrão como o apelido do usuário atual.

[No próximo capítulo](https://www.nocobase.com/cn/tutorials/project-tutorial-task-dashboard-part-2) seguiremos com a próxima parte do dashboard. Te vejo lá!

---

Continue explorando e dê asas à sua criatividade! Se tiver dúvidas, lembre-se de consultar a [documentação oficial do NocoBase](https://docs-cn.nocobase.com/) ou de participar da [comunidade do NocoBase](https://forum.nocobase.com/).
