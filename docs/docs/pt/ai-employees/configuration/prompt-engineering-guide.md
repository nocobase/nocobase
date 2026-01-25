:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Agente de IA · Guia de Engenharia de Prompts

> De "como escrever" a "escrever bem", este guia ensina como criar prompts de alta qualidade de forma simples, estável e reutilizável.

## 1. Por que os Prompts são Cruciais

Um prompt é a "descrição de cargo" para um agente de IA, determinando diretamente seu estilo, limites e qualidade de saída.

**Exemplo de Comparação:**

❌ Prompt Não Claro:

```
Você é um assistente de análise de dados que ajuda usuários a analisar dados.
```

✅ Prompt Claro e Controlável:

```
Você é Viz, um especialista em análise de dados.

Definição de Papel
- Estilo: Perspicaz, articulado e focado em visualização
- Missão: Transformar dados complexos em "histórias de gráficos" compreensíveis

Fluxo de Trabalho
1) Entender os requisitos
2) Gerar SQL seguro (usando apenas SELECT)
3) Extrair insights
4) Apresentar com gráficos

Regras Rígidas
- DEVE: Usar apenas SELECT, nunca modificar dados
- SEMPRE: Gerar visualizações de gráficos por padrão
- NUNCA: Fabricar ou adivinhar dados

Formato de Saída
Conclusão breve (2-3 frases) + JSON de gráfico ECharts
```

**Conclusão**: Um bom prompt define claramente "quem ele é, o que fazer, como fazer e qual padrão seguir", tornando o desempenho da IA estável e controlável.

## 2. A Fórmula de Ouro dos "Nove Elementos" para Prompts

Uma estrutura comprovadamente eficaz na prática:

```
Nomeação + Instruções Duplas + Confirmação Simulada + Repetição + Regras Rígidas
+ Informações de Contexto + Reforço Positivo + Exemplos de Referência + Exemplos Negativos (Opcional)
```

### 2.1 Descrição dos Elementos

| Elemento   | O que resolve            | Por que é eficaz        |
| ---- | ----------------- | ------------ |
| Nomeação   | Clarifica identidade e estilo           | Ajuda a IA a estabelecer um "senso de papel" |
| Instruções Duplas | Distingue "quem eu sou" de "o que preciso fazer"     | Reduz a confusão de papel       |
| Confirmação Simulada | Reafirma o entendimento antes da execução            | Evita desvios          |
| Repetição | Pontos chave aparecem repetidamente           | Aumenta a prioridade        |
| Regras Rígidas | DEVE/SEMPRE/NUNCA | Estabelece um limite         |
| Informações de Contexto | Conhecimento e restrições necessárias           | Reduz mal-entendidos         |
| Reforço Positivo | Orienta expectativas e estilo           | Tom e desempenho mais estáveis    |
| Exemplos de Referência | Fornece um modelo direto para imitar           | A saída fica mais próxima do esperado      |
| Exemplos Negativos | Evita armadilhas comuns             | Corrige erros, tornando-se mais preciso com o uso    |

### 2.2 Modelo de Início Rápido

```yaml
# 1) Nomeação
Você é [Nome], um(a) excelente [Papel/Especialidade].

# 2) Instruções Duplas
## Papel
Estilo: [Adjetivo x2-3]
Missão: [Resumo de uma frase da responsabilidade principal]

## Fluxo de Trabalho da Tarefa
1) Entender: [Ponto chave]
2) Executar: [Ponto chave]
3) Verificar: [Ponto chave]
4) Apresentar: [Ponto chave]

# 3) Confirmação Simulada
Antes da execução, reafirme seu entendimento: "Eu entendo que você precisa... Eu farei isso por meio de..."

# 4) Repetição
Requisito Essencial: [1-2 pontos mais críticos] (aparecem pelo menos duas vezes no início/fluxo de trabalho/fim)

# 5) Regras Rígidas
DEVE: [Regra inquebrável]
SEMPRE: [Princípio a seguir sempre]
NUNCA: [Ação explicitamente proibida]

# 6) Informações de Contexto
[Conhecimento de domínio necessário/contexto/armadilhas comuns]

# 7) Reforço Positivo
Você se destaca em [Habilidade] e é especialista em [Especialidade]. Por favor, mantenha este estilo para completar a tarefa.

# 8) Exemplos de Referência
[Forneça um exemplo conciso da "saída ideal"]

# 9) Exemplos Negativos (Opcional)
- [Forma incorreta] → [Forma correta]
```

## 3. Exemplo Prático: Viz (Análise de Dados)

Vamos combinar os nove elementos para criar um exemplo completo e "pronto para usar".

```text
# Nomeação
Você é Viz, um especialista em análise de dados.

# Instruções Duplas
【Papel】
Estilo: Perspicaz, claro e orientado visualmente
Missão: Transformar dados complexos em "histórias de gráficos"

【Fluxo de Trabalho da Tarefa】
1) Entender: Analisar os requisitos de dados do usuário e o escopo das métricas
2) Consultar: Gerar SQL seguro (consultar apenas dados reais, somente SELECT)
3) Analisar: Extrair insights chave (tendências/comparações/proporções)
4) Apresentar: Escolher um gráfico apropriado para expressão clara

# Confirmação Simulada
Antes da execução, reafirme: "Eu entendo que você deseja analisar [objeto/escopo], e apresentarei os resultados por meio de [método de consulta e visualização]."

# Repetição
Reiterar: A autenticidade dos dados é a prioridade, qualidade acima da quantidade; se não houver dados disponíveis, declare isso com sinceridade.

# Regras Rígidas
DEVE: Usar apenas consultas SELECT, não modificar nenhum dado
SEMPRE: Gerar um gráfico visual por padrão
NUNCA: Fabricar ou adivinhar dados

# Informações de Contexto
- ECharts requer configuração "JSON puro", sem comentários/funções
- Cada gráfico deve focar em um tema, evite empilhar múltiplas métricas

# Reforço Positivo
Você é especialista em extrair conclusões acionáveis de dados reais e expressá-las com os gráficos mais simples.

# Exemplos de Referência
Descrição (2-3 frases) + JSON do Gráfico

Exemplo de Descrição:
Neste mês, 127 novos leads foram adicionados, um aumento de 23% em relação ao mês anterior, principalmente de canais de terceiros.

Exemplo de Gráfico:
{
  "title": {"text": "Tendência de Leads deste Mês"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Week1","Week2","Week3","Week4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Exemplos Negativos (Opcional)
- Misturar idiomas → Manter a consistência do idioma
- Gráficos sobrecarregados → Cada gráfico deve expressar apenas um tema
- Dados incompletos → Declarar sinceramente "Nenhum dado disponível"
```

**Pontos de Design**

*   A "autenticidade" aparece várias vezes nas seções de fluxo de trabalho, repetição e regras (lembrete forte)
*   Escolha uma saída de duas partes "descrição + JSON" para fácil integração com o frontend
*   Especifique "SQL somente leitura" para reduzir riscos

## 4. Como Aprimorar Prompts ao Longo do Tempo

### 4.1 Iteração em Cinco Etapas

```
Comece com uma versão funcional → Teste em pequena escala → Registre problemas → Adicione regras/exemplos para resolver → Teste novamente
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Processo de Otimização" width="50%">

Recomenda-se testar 5 a 10 tarefas típicas de uma vez, completando uma rodada em até 30 minutos.

### 4.2 Princípios e Proporções

*   **Priorize a Orientação Positiva**: Primeiro, diga à IA o que ela deve fazer
*   **Melhoria Orientada por Problemas**: Adicione restrições apenas quando surgirem problemas
*   **Restrições Moderadas**: Não acumule "proibições" desde o início

Proporção Empírica: **80% Positivo : 20% Negativo**.

### 4.3 Uma Otimização Típica

**Problema**: Gráficos sobrecarregados, baixa legibilidade
**Otimização**:

1.  Em "Informações de Contexto", adicione: um tema por gráfico
2.  Em "Exemplos de Referência", forneça um "gráfico de métrica única"
3.  Se o problema persistir, adicione uma restrição rígida em "Regras Rígidas/Repetição"

## 5. Técnicas Avançadas

### 5.1 Use XML/Tags para uma Estrutura Mais Clara (Recomendado para Prompts Longos)

Quando o conteúdo excede 1000 caracteres ou pode ser confuso, usar tags para particionar é mais estável:

```xml
<Papel>Você é Dex, um especialista em organização de dados.</Papel>
<Estilo>Meticuloso, preciso e organizado.</Estilo>

<Tarefa>
Deve ser concluída nas seguintes etapas:
1. Identificar campos chave
2. Extrair valores de campo
3. Padronizar formato (Data AAAA-MM-DD)
4. Gerar JSON
</Tarefa>

<Regras>
DEVE: Manter a precisão dos valores de campo
NUNCA: Adivinhar informações ausentes
SEMPRE: Sinalizar itens incertos
</Regras>

<Exemplo>
{"Nome":"João Silva","Data":"2024-01-15","Valor":5000,"Status":"Confirmado"}
</Exemplo>
```

### 5.2 Abordagem em Camadas "Contexto + Tarefa" (Uma Forma Mais Intuitiva)

*   **Contexto** (estabilidade de longo prazo): Quem é este agente, qual seu estilo e quais capacidades ele possui
*   **Tarefa** (sob demanda): O que fazer agora, em quais métricas focar e qual o escopo padrão

Isso se alinha naturalmente ao modelo "Agente + Tarefa" do NocoBase: **contexto fixo, tarefas flexíveis**.

### 5.3 Reutilização Modular

Divida as regras comuns em módulos para combinar e usar conforme necessário:

**Módulo de Segurança de Dados**

```
DEVE: Usar apenas SELECT
NUNCA: Executar INSERT/UPDATE/DELETE
```

**Módulo de Estrutura de Saída**

```
A saída deve incluir:
1) Descrição breve (2-3 frases)
2) Conteúdo principal (gráfico/dados/código)
3) Sugestões opcionais (se houver)
```

## 6. Regras de Ouro (Conclusões Práticas)

1.  Um agente de IA deve ter uma função específica; a especialização é mais estável
2.  Exemplos são mais eficazes que slogans; forneça modelos positivos primeiro
3.  Use DEVE/SEMPRE/NUNCA para definir limites
4.  Adote uma abordagem orientada a processos para reduzir a incerteza
5.  Comece pequeno, teste mais, modifique menos e itere continuamente
6.  Não restrinja demais; evite "engessar" o comportamento
7.  Registre problemas e alterações para criar versões
8.  80/20: Primeiro, explique "como fazer certo", depois restrinja "o que não fazer de errado"

## 7. Perguntas Frequentes

**P1: Qual é o comprimento ideal?**

*   Agente básico: 500–800 caracteres
*   Agente complexo: 800–1500 caracteres
*   Não recomendado >2000 caracteres (pode ser lento e redundante)
    Padrão: Cobrir todos os nove elementos, mas sem rodeios.

**P2: E se o agente de IA não seguir as instruções?**

1.  Use DEVE/SEMPRE/NUNCA para clarificar os limites
2.  Repita os requisitos chave 2–3 vezes
3.  Use tags/partições para aprimorar a estrutura
4.  Forneça mais exemplos positivos, menos princípios abstratos
5.  Avalie se um modelo mais poderoso é necessário

**P3: Como equilibrar a orientação positiva e negativa?**
Primeiro, escreva as partes positivas (papel, fluxo de trabalho, exemplos), depois adicione restrições com base em erros, e restrinja apenas os pontos que estão "repetidamente errados".

**P4: Deve ser atualizado com frequência?**

*   Contexto (identidade/estilo/capacidades centrais): Estabilidade de longo prazo
*   Tarefa (cenário/métricas/escopo): Ajustar de acordo com as necessidades do negócio
*   Crie uma nova versão para quaisquer alterações e registre "por que foi alterado".

## 8. Próximos Passos

**Prática Hands-on**

*   Escolha um papel simples (por exemplo, assistente de atendimento ao cliente), escreva uma "versão funcional" usando os nove elementos e teste-a com 5 tarefas típicas
*   Encontre um agente existente, colete 3 a 5 problemas reais e realize uma pequena iteração

**Leitura Adicional**

*   [Agente de IA · Guia de Configuração do Administrador](./admin-configuration.md): Aplique os prompts na configuração real
*   Manuais dedicados para cada agente de IA: Veja modelos completos de papel/tarefa

## Conclusão

**Faça funcionar, depois refine.**
Comece com uma versão "em funcionamento" e colete continuamente problemas, adicione exemplos e refine regras em tarefas reais.
Lembre-se: **Primeiro, diga a ele como fazer certo (orientação positiva), depois restrinja-o de fazer errado (restrição moderada).**