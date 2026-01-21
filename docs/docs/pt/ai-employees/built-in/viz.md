:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Funcionário de IA · Viz: Analista de Insights

> Gere gráficos e insights com um clique, e deixe os dados falarem por si.

## 1. Quem é o Viz

**Viz** é o **Analista de Insights de IA** integrado.
Ele consegue ler os dados da sua página atual (como Leads, Oportunidades, Contas) e gerar automaticamente gráficos de tendência, gráficos de comparação, cartões de KPI e conclusões concisas, tornando a análise de negócios fácil e intuitiva.

Ele não é apenas uma ferramenta de relatórios fria, mas um analista que entende suas perguntas e sabe contar histórias.

> 💡 Quer saber "por que as vendas caíram recentemente"?
> Basta dizer uma frase para o Viz, e ele poderá dizer onde a queda ocorreu, quais são as possíveis razões e quais passos você pode tomar em seguida.

## 2. O que você pode fazer com o Viz

| Capacidade                       | Descrição                                         | Exemplo                                   |
| :------------------------------- | :------------------------------------------------ | :---------------------------------------- |
| 📊 **Gerar gráficos automaticamente** | Visualize dados com um clique, sem precisar escrever SQL | "Gerar tendência de vendas deste mês"     |
| 🔍 **Descobrir mudanças e anomalias** | Analise as razões para aumentos ou quedas         | "Como este mês está melhor que o mês passado?" |
| 🧭 **Auxiliar na tomada de decisões** | Forneça sugestões acionáveis baseadas em dados    | "Qual canal vale mais a pena aumentar o orçamento?" |
| 🧩 **Perspectivas de dados agregadas** | Compare em múltiplas dimensões como região, produto, fonte | "Mostrar comparação de receita por região" |

Seja para revisões mensais de negócios, ROI de canal ou funis de vendas, o Viz pode gerar gráficos e interpretações em segundos.

## 3. Como Usar

### 3.1 Pontos de Entrada da Página

*   **Botão superior direito (Recomendado)**
    No canto superior direito de páginas como Leads, Oportunidades e Contas, clique no **ícone do Viz** para selecionar tarefas predefinidas, como:

    *   Conversão e tendências de estágio
    *   Comparação de canais de origem
    *   Análise de revisão mensal

    ![Exemplo na página de Leads](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

*   **Painel global inferior direito**
    Não importa em qual página você esteja, você pode abrir o painel global de IA e falar diretamente com o Viz:

    ```
    Analisar mudanças nas vendas nos últimos 90 dias
    ```

    O Viz usará automaticamente o contexto de dados da sua página atual.

### 3.2 Método de Interação

O Viz suporta perguntas em linguagem natural e pode entender perguntas de acompanhamento em várias etapas.
Exemplo:

```
Olá Viz, gere a tendência de leads deste mês.
```

```
Mostrar apenas o desempenho dos canais de terceiros.
```

```
Então, qual região teve o crescimento mais rápido?
```

Cada pergunta de acompanhamento aprofundará a análise com base nos resultados anteriores, sem a necessidade de reinserir as condições dos dados.

## 4. Cenários de Análise Comuns

| Cenário                 | O que você quer saber                     | Saída do Viz                                   |
| :---------------------- | :---------------------------------------- | :--------------------------------------------- |
| **Revisão Mensal**      | Como este mês está melhor que o mês passado? | Cartão de KPI + Gráfico de tendência + Três sugestões de melhoria |
| **Análise de Crescimento** | O aumento da receita se deve a uma mudança de volume ou preço? | Gráfico de decomposição de fatores + Tabela de comparação |
| **Análise de Canal**    | Qual canal vale mais a pena continuar investindo? | Gráfico de ROI + Curva de retenção + Sugestões |
| **Análise de Funil**    | Onde o tráfego está travando?             | Gráfico de funil + Explicação do gargalo       |
| **Retenção de Clientes** | Quais clientes são os mais valiosos?      | Gráfico de segmentação RFM + Curva de retenção |
| **Avaliação de Promoção** | Qual foi a eficácia da grande promoção?   | Gráfico de comparação + Análise de elasticidade de preço |

> 📈 Todos os gráficos são gerados em formato ECharts válido, com um ponto chave por gráfico, e são acompanhados por uma breve conclusão.
> Se houver dados insuficientes, o Viz informará diretamente, sem fabricar resultados.

## 5. Dicas para Conversar com o Viz

| Prática                       | Efeito                                                      |
| :---------------------------- | :---------------------------------------------------------- |
| ✅ **Especifique um período** | "Últimos 30 dias", "mês passado vs. este mês" para maior precisão |
| ✅ **Especifique dimensões**  | "Por região/canal/produto" ajuda a alinhar as perspectivas  |
| ✅ **Concentre-se em tendências, não em detalhes** | O Viz se destaca em identificar a direção da mudança e as razões principais |
| ✅ **Use linguagem natural**  | Não precisa de sintaxe imperativa, apenas pergunte como se estivesse conversando |

## 6. Para quem o Viz é mais adequado

| Papel                     | Caso de Uso                                        |
| :------------------------ | :------------------------------------------------- |
| **Gerente de Vendas**     | Visualizar taxas de conversão de estágio, desempenho de canal, resultados da equipe |
| **Profissional de Marketing** | Analisar ROI de gastos com anúncios, eficácia de promoções, retenção de clientes |
| **Analista de Operações** | Puxar dados rapidamente, descobrir anomalias, validar hipóteses |
| **Gerência**              | Entender o status do negócio rapidamente, obter sinais para a tomada de decisões |

## 7. Sugestões de Uso

1.  **Comece com tarefas predefinidas**
    O demo oficial possui tarefas comuns integradas, para que você possa experimentar os resultados diretamente, sem precisar de prompts.
    Por exemplo: Página de Leads → Clique em **Viz → Conversão e tendências de estágio**

2.  **Observe o estilo de saída**
    Cada ponto de análise possui um gráfico separado e uma breve descrição.
    Gráficos claros e texto conciso são a saída padrão do Viz.

3.  **Faça perguntas de acompanhamento progressivamente**
    Após ler o relatório de análise, continue perguntando "por que" e "como melhorar", e o Viz fará o acompanhamento automaticamente.

## 8. Resumo

*   Viz = Seu assistente de insights de dados
*   Não precisa escrever SQL nem configurar gráficos
*   Obtenha um relatório de análise com uma única frase em linguagem natural
*   Todas as conclusões são baseadas em dados reais, claras e críveis

> Comece com **Leads → Viz → Conversão e tendências de estágio**,
> ver o primeiro gráfico é o melhor ponto de partida para entender este Funcionário de IA.