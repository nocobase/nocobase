:::tip{title="Aviso de tradução por IA"}
Este documento foi traduzido por IA. Para informações precisas, consulte a [versão em inglês](/ai-employees/features/built-in-employee).
:::

# Funcionários de IA integrados

O NocoBase vem com vários funcionários de IA integrados, adaptados para cenários específicos.

Você só precisa configurar o serviço de LLM e ativar o funcionário correspondente para começar a trabalhar; os modelos podem ser alternados sob demanda durante a conversa.


## Introdução

![clipboard-image-1766653060](https://static-docs.nocobase.com/clipboard-image-1766653060.png)

| Nome do Funcionário | Posicionamento da Função | Principais Capacidades |
| :--- | :--- | :--- |
| **Cole** | Assistente do NocoBase | Perguntas e respostas sobre o produto, recuperação de documentos |
| **Ellis** | Especialista em E-mail | Redação de e-mails, geração de resumos, sugestões de resposta |
| **Dex** | Organizador de Dados | Tradução de campos, formatação, extração de informações |
| **Viz** | Analista de Insights | Insights de dados, análise de tendências, interpretação de métricas-chave |
| **Lexi** | Assistente de Tradução | Tradução multilíngue, auxílio na comunicação |
| **Vera** | Analista de Pesquisa | Pesquisa na web, agregação de informações, pesquisa profunda |
| **Dara** | Especialista em Visualização de Dados | Configuração de gráficos, geração de relatórios visuais |
| **Orin** | Especialista em Modelagem de Dados | Auxílio no design de estruturas de coleções, sugestões de campos |
| **Nathan** | Engenheiro de Frontend | Auxílio na escrita de trechos de código frontend, ajustes de estilo |


Você pode clicar na **esfera flutuante de IA** no canto inferior direito da interface do aplicativo e selecionar o funcionário que deseja para começar a colaborar.


## Funcionários de IA para cenários dedicados

Alguns funcionários de IA integrados (do tipo construtor) não aparecem na lista de funcionários de IA do canto inferior direito; eles possuem cenários de trabalho exclusivos, por exemplo:

* **Orin** aparece apenas na página de configuração da fonte de dados;
* **Dara** aparece apenas na página de configuração de gráficos;
* **Nathan** aparece apenas no editor de JS.



---

Abaixo estão alguns cenários de aplicação típicos para os funcionários de IA, com o objetivo de fornecer inspiração. Mais potencial aguarda sua exploração em seus processos de negócio reais.


## Viz: Analista de Insights

### Introdução

> Gere gráficos e insights com um clique, deixe os dados falarem por si mesmos.

**Viz** é o **Analista de Insights de IA** integrado.
Ele sabe ler os dados da sua página atual (como Leads, Oportunidades, Contas) e gerar automaticamente gráficos de tendência, gráficos de comparação, cartões de KPI e conclusões concisas, tornando a análise de negócios fácil e intuitiva.

> Quer saber "Por que as vendas caíram recentemente"?
> Basta dizer uma frase ao Viz e ele poderá dizer onde ocorreu a queda, quais são os possíveis motivos e quais poderiam ser os próximos passos.

### Cenários de uso

Seja para revisões mensais de negócios, ROI de canais ou funis de vendas, você pode deixar o Viz analisar, gerar gráficos e interpretar os resultados.

| Cenário | O que você quer saber | Entrega do Viz |
| -------- | ------------ | ------------------- |
| **Revisão Mensal** | Como este mês está melhor que o anterior? | Cartão de KPI + Gráfico de tendência + Três sugestões de melhoria |
| **Decomposição de Crescimento** | O aumento da receita foi por volume ou por preço? | Gráfico de decomposição de fatores + Tabela comparativa |
| **Análise de Canais** | Qual canal mais vale a pena continuar investindo? | Gráfico de ROI + Curva de retenção + Sugestões |
| **Análise de Funil** | Onde o tráfego está ficando retido? | Gráfico de funil + Explicação de gargalos |
| **Retenção de Clientes** | Quais clientes são os mais valiosos? | Gráfico de segmentação RFM + Curva de retenção |
| **Avaliação de Promoção** | Qual foi a eficácia da grande promoção? | Gráfico comparativo + Análise de elasticidade de preço |

### Como usar

**Pontos de entrada na página**

* **Botão no canto superior direito (Recomendado)**
  
  Em páginas como Leads, Oportunidades e Contas, clique no **ícone do Viz** no canto superior direito para selecionar tarefas predefinidas, como:

  * Conversão de estágios e tendências
  * Comparação de canais de origem
  * Análise de revisão mensal

  ![clipboard-image-1771913319](https://static-docs.nocobase.com/clipboard-image-1771913319.png)

* **Painel global no canto inferior direito**
  
  Em qualquer página, você pode chamar o painel global de IA e falar diretamente com o Viz:

  ```
  Analise as mudanças nas vendas nos últimos 90 dias
  ```

  O Viz trará automaticamente o contexto dos dados da página em que você está.

**Forma de interação**

O Viz suporta perguntas em linguagem natural e entende acompanhamentos de várias rodadas.
Exemplo:

```
Oi Viz, gere as tendências de leads para este mês.
```

```
Mostre apenas o desempenho dos canais de terceiros.
```

```
E qual região está crescendo mais rápido?
```

Cada pergunta de acompanhamento continuará a se aprofundar com base nos resultados da análise anterior, sem a necessidade de inserir novamente as condições dos dados.

### Dicas para conversar com o Viz

| O que fazer | Efeito |
| ---------- | ------------------- |
| Especifique o intervalo de tempo | "Últimos 30 dias" ou "Mês passado vs. Este mês" é mais preciso |
| Especifique dimensões | "Ver por região/canal/produto" ajuda a alinhar a perspectiva |
| Foque em tendências, não em detalhes | O Viz é bom em identificar a direção da mudança e os motivos principais |
| Use linguagem natural | Não precisa de sintaxe de comando, basta perguntar como se estivesse conversando |


---



## Dex: Especialista em Organização de Dados

### Introdução

> Extraia e preencha formulários rapidamente, transformando informações desorganizadas em dados estruturados.

`Dex` é um especialista em organização de dados que extrai as informações necessárias de dados ou arquivos não estruturados e as organiza em informações estruturadas, podendo usar ferramentas para preencher essas informações em formulários.

### Como usar

Na página de um formulário, chame o `Dex` para abrir a janela de conversa.

![20251022155316](https://static-docs.nocobase.com/20251022155316.png)

Clique em `Add work context` (Adicionar contexto de trabalho) na caixa de entrada e selecione `Pick block` (Escolher bloco); a página entrará no modo de seleção de blocos.

![20251022155414](https://static-docs.nocobase.com/20251022155414.png)

Selecione o bloco de formulário na página.

![20251022155523](https://static-docs.nocobase.com/20251022155523.png)

Insira na caixa de diálogo os dados que você deseja que o `Dex` organize.

![20251022155555](https://static-docs.nocobase.com/20251022155555.png)

Após o envio, o `Dex` estruturará os dados e usará suas habilidades para atualizar os dados no formulário selecionado.

![20251022155733](https://static-docs.nocobase.com/20251022155733.png)


---



## Orin: Modelador de Dados

### Introdução

> Projete coleções de forma inteligente e otimize estruturas de banco de dados.

`Orin` é um especialista em modelagem de dados. Na página de configuração da fonte de dados principal, você pode pedir para o `Orin` ajudar a criar ou modificar coleções.

![20251022160628](https://static-docs.nocobase.com/20251022160628.png)

### Como usar

Acesse o plugin de Gerenciamento de Fonte de Dados e selecione a configuração da fonte de dados principal.

![20251022161146](https://static-docs.nocobase.com/20251022161146.png)

Clique no avatar do `Orin` no canto superior direito para abrir a caixa de diálogo do funcionário de IA.

![20251022161641](https://static-docs.nocobase.com/20251022161641.png)

Descreva suas necessidades de modelagem para o `Orin`, envie e aguarde a resposta. 

Quando o `Orin` confirmar suas necessidades, ele usará suas habilidades e responderá com uma prévia da modelagem de dados.

Após revisar a prévia, clique no botão `Finish review and apply` (Finalizar revisão e aplicar) para criar as coleções de acordo com a modelagem do `Orin`.

![20251022162142](https://static-docs.nocobase.com/20251022162142.png)


---



## Nathan: Engenheiro de Frontend

### Introdução

> Ajuda você a escrever e otimizar código frontend para implementar lógicas de interação complexas.

`Nathan` é o especialista em desenvolvimento frontend no NocoBase. Em cenários que exigem JavaScript, como `JSBlock`, `JSField`, `JSItem`, `JSColumn`, `JSAction`, `Event Flow` e `Linkage`, o avatar do `Nathan` aparecerá no canto superior direito do editor de código, permitindo que você peça ajuda para escrever ou modificar o código no editor.

![20251022163405](https://static-docs.nocobase.com/20251022163405.png)

### Como usar

No editor de código, clique no `Nathan` para abrir a caixa de diálogo do funcionário de IA; o código presente no editor será automaticamente anexado à caixa de entrada como contexto da aplicação enviado ao `Nathan`.

![20251022163935](https://static-docs.nocobase.com/20251022163935.png)

Insira suas necessidades de codificação, envie para o `Nathan` e aguarde a resposta dele.

![20251022164041](https://static-docs.nocobase.com/20251022164041.png)

Clique no botão `Apply to editor` (Aplicar ao editor) no bloco de código respondido pelo `Nathan` para sobrescrever o código no editor com o código dele.

![20251022164323](https://static-docs.nocobase.com/20251022164323.png)

Clique no botão `Run` (Executar) do editor de código para visualizar o efeito em tempo real.

![20251022164436](https://static-docs.nocobase.com/20251022164436.png)

### Histórico de código

Clique no ícone de "Linha de comando" no canto superior direito da caixa de diálogo do `Nathan` para visualizar os trechos de código que você enviou e os trechos de código que o `Nathan` respondeu na sessão atual.

![20251022164644](https://static-docs.nocobase.com/20251022164644.png)

![20251022164713](https://static-docs.nocobase.com/20251022164713.png)