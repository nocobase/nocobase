# Agente de IA · Viz: Guia de Configuração para Cenários de CRM

> Usando o exemplo de CRM, aprenda como fazer seu analista de insights de IA realmente entender seu negócio e liberar todo o seu potencial.

## 1. Introdução: Fazendo o Viz ir de "Ver Dados" para "Entender o Negócio"

No sistema NocoBase, o **Viz** é um analista de insights de IA integrado.
Ele pode reconhecer o contexto da página (como Leads, Oportunidades, Contas) e gerar gráficos de tendência, gráficos de funil e cartões KPI.
Mas, por padrão, ele possui apenas as capacidades de consulta mais básicas:

| Ferramenta                | Descrição da Função      | Segurança |
| ------------------------- | ------------------------ | --------- |
| Get Collection Names      | Obter Lista de Coleções  | ✅ Seguro |
| Get Collection Metadata   | Obter Estrutura de Campos | ✅ Seguro |

Essas ferramentas permitem que o Viz apenas "reconheça a estrutura", mas ainda não "entenda o conteúdo" de verdade.
Para capacitá-lo a gerar insights, detectar anomalias e analisar tendências, você precisa **estendê-lo com ferramentas de análise mais adequadas**.

No Demo oficial de CRM, usamos dois métodos:

*   **Overall Analytics (Mecanismo de análise de propósito geral)**: Uma solução padronizada, segura e reutilizável;
*   **SQL Execution (Mecanismo de análise especializado)**: Oferece mais flexibilidade, mas acarreta maiores riscos.

Essas duas opções não são as únicas; elas são mais como um **paradigma de design**:

> Você pode seguir seus princípios para criar uma implementação mais adequada ao seu próprio negócio.

---

## 2. Estrutura do Viz: Personalidade Estável + Tarefas Flexíveis

Para entender como estender o Viz, você precisa primeiro compreender seu design interno em camadas:

| Camada                     | Descrição                                                              | Exemplo             |
| -------------------------- | ---------------------------------------------------------------------- | ------------------- |
| **Definição de Papel**     | A persona e o método de análise do Viz: Entender → Consultar → Analisar → Visualizar | Fixo                |
| **Definição de Tarefa**    | Prompts personalizados e combinações de ferramentas para um cenário de negócio específico | Modificável         |
| **Configuração de Ferramentas** | A ponte para o Viz chamar fontes de dados externas ou fluxos de trabalho | Livremente substituível |

Esse design em camadas permite que o Viz mantenha uma personalidade estável (lógica de análise consistente),
ao mesmo tempo em que se adapta rapidamente a diferentes cenários de negócios (CRM, gestão hospitalar, análise de canais, operações de produção...).

---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


## 3. Padrão Um: Mecanismo de Análise por Modelo (Recomendado)

### 3.1 Visão Geral do Princípio

**Overall Analytics** é o mecanismo de análise central no Demo de CRM.
Ele gerencia todas as consultas SQL através de uma **coleção de modelos de análise de dados (data_analysis)**.
O Viz não escreve SQL diretamente, mas sim **chama modelos predefinidos** para gerar resultados.

O fluxo de execução é o seguinte:

```mermaid
flowchart TD
    A[Viz recebe tarefa] --> B[Chama fluxo de trabalho Overall Analytics]
    B --> C[Corresponde ao modelo com base na página/tarefa atual]
    C --> D[Executa SQL do modelo (somente leitura)]
    D --> E[Retorna resultado dos dados]
    E --> F[Viz gera gráfico + breve interpretação]
```

Dessa forma, o Viz pode gerar resultados de análise seguros e padronizados em segundos,
e os administradores podem gerenciar e revisar centralmente todos os modelos SQL.

---

### 3.2 Estrutura da Coleção de Modelos (data_analysis)

| Nome do Campo                                        | Tipo      | Descrição                 | Exemplo                                            |
| ---------------------------------------------------- | --------- | ------------------------- | -------------------------------------------------- |
| **id**                                               | Inteiro   | Chave Primária            | 1                                                  |
| **name**                                             | Texto     | Nome do modelo de análise | Leads Data Analysis                                |
| **collection**                                       | Texto     | Coleção correspondente    | Lead                                               |
| **sql**                                              | Código    | Instrução SQL de análise (somente leitura) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                      | Markdown  | Descrição ou definição do modelo | "Contar leads por estágio"                                |
| **createdAt / createdBy / updatedAt / updatedBy**    | Campo do Sistema | Informações de auditoria  | Gerado automaticamente                             |

#### Exemplos de Modelos no Demo de CRM

| Name                             | Collection  | Description                      |
| -------------------------------- | ----------- | -------------------------------- |
| Account Data Analysis            | Account     | Análise de Dados da Conta        |
| Contact Data Analysis            | Contact     | Análise de Dados do Contato      |
| Leads Data Analysis              | Lead        | Análise de Tendência de Leads    |
| Opportunity Data Analysis        | Opportunity | Funil de Estágios de Oportunidade |
| Task Data Analysis               | Todo Tasks  | Estatísticas de Status de Tarefas Pendentes |
| Users (Sales Reps) Data Analysis | Users       | Comparação de Desempenho de Representantes de Vendas |

---

### 3.3 Vantagens Deste Padrão

| Dimensão              | Vantagem                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| **Segurança**         | Todo o SQL é armazenado e revisado, evitando a geração direta de consultas. |
| **Manutenibilidade**  | Os modelos são gerenciados centralmente e atualizados de forma uniforme.    |
| **Reutilização**      | O mesmo modelo pode ser reutilizado por várias tarefas.                 |
| **Portabilidade**     | Pode ser facilmente migrado para outros sistemas, exigindo apenas a mesma estrutura de coleção. |
| **Experiência do Usuário** | Usuários de negócios não precisam se preocupar com SQL; eles só precisam iniciar uma solicitação de análise. |

> 📘 Esta coleção `data_analysis` não precisa ter este nome.
> O ponto chave é: **armazenar a lógica de análise de forma padronizada**, para que seja chamada uniformemente por um fluxo de trabalho.

---

### 3.4 Como Fazer o Viz Usá-lo

Na definição da tarefa, você pode dizer explicitamente ao Viz:

```markdown
Olá Viz,

Por favor, analise os dados do módulo atual.

**Prioridade:** Usar a ferramenta Overall Analytics para obter resultados de análise da coleção de modelos.
**Se nenhum modelo correspondente for encontrado:** Informar que um modelo está faltando e sugerir que o administrador adicione um.

Requisitos de saída:
- Gerar um gráfico separado para cada resultado;
- Incluir uma breve descrição de 2 a 3 frases abaixo do gráfico;
- Não fabricar dados ou fazer suposições.
```

Dessa forma, o Viz chamará automaticamente o fluxo de trabalho, encontrará o SQL mais adequado na coleção de modelos e gerará o gráfico.

---

## 4. Padrão Dois: Executor SQL Especializado (Usar com cautela)

### 4.1 Cenários Aplicáveis

Quando você precisar de análise exploratória, consultas ad-hoc ou agregações JOIN de múltiplas coleções, você pode fazer com que o Viz chame uma ferramenta **SQL Execution**.

As características desta ferramenta são:

*   O Viz pode gerar consultas `SELECT` diretamente;
*   O sistema as executa e retorna o resultado;
*   O Viz é responsável pela análise e visualização.

Exemplo de tarefa:

> "Por favor, analise a tendência das taxas de conversão de leads por região nos últimos 90 dias."

Neste caso, o Viz pode gerar:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Riscos e Recomendações de Proteção

| Ponto de Risco                       | Estratégia de Proteção                               |
| ------------------------------------ | ---------------------------------------------------- |
| Gerar operações de escrita           | Restringir forçosamente a `SELECT`                   |
| Acessar coleções não relacionadas    | Validar se o nome da coleção existe                  |
| Risco de desempenho com coleções grandes | Limitar o período, usar LIMIT para o número de linhas |
| Rastreabilidade da operação          | Habilitar log de consultas e auditoria               |
| Controle de permissão do usuário     | Apenas administradores podem usar esta ferramenta    |

> Recomendações gerais:
>
> *   Usuários comuns devem ter apenas a análise por modelo (Overall Analytics) habilitada;
> *   Apenas administradores ou analistas seniores devem ter permissão para usar o SQL Execution.

---

## 5. Se Você Quiser Construir Seu Próprio "Overall Analytics"

Aqui está uma abordagem simples e geral que você pode replicar em qualquer sistema (não dependente do NocoBase):

### Passo 1: Projetar a Coleção de Modelos

O nome da coleção pode ser qualquer um (por exemplo, `analysis_templates`).
Basta incluir os campos: `name`, `sql`, `collection` e `description`.

### Passo 2: Escrever um Serviço ou Fluxo de Trabalho de "Buscar Modelo → Executar"

Lógica:

1.  Receber a tarefa ou o contexto da página (por exemplo, a coleção atual);
2.  Corresponder a um modelo;
3.  Executar o SQL do modelo (somente leitura);
4.  Retornar uma estrutura de dados padronizada (linhas + campos).

### Passo 3: Fazer a IA Chamar Esta Interface

O prompt da tarefa pode ser escrito assim:

```
Primeiro, tente chamar a ferramenta de análise de modelo. Se nenhuma análise correspondente for encontrada nos modelos, então use o executor SQL.
Por favor, certifique-se de que todas as consultas sejam somente leitura e gere gráficos para exibir os resultados.
```

> Dessa forma, seu sistema de agente de IA terá capacidades de análise semelhantes às do Demo de CRM, mas será completamente independente e personalizável.

---

## 6. Melhores Práticas e Recomendações de Design

| Recomendação                       | Descrição                                                              |
| ---------------------------------- | ---------------------------------------------------------------------- |
| **Priorizar análise por modelo**   | Seguro, estável e reutilizável                                         |
| **Usar SQL Execution apenas como um complemento** | Limitado a depuração interna ou consultas ad-hoc                       |
| **Um gráfico, um ponto chave**     | Manter a saída clara e evitar excesso de informações                   |
| **Nomenclatura clara para modelos** | Nomear de acordo com a página/domínio de negócio, por exemplo, `Leads-Stage-Conversion` |
| **Explicações concisas e claras**  | Acompanhar cada gráfico com um resumo de 2 a 3 frases                  |
| **Indicar quando um modelo está faltando** | Informar ao usuário "Nenhum modelo correspondente encontrado" em vez de fornecer uma saída em branco |

---

## 7. Do Demo de CRM para o Seu Cenário

Seja você trabalhando com CRM hospitalar, manufatura, logística de armazém ou admissões educacionais,
desde que você possa responder às três perguntas a seguir, o Viz pode agregar valor ao seu sistema:

| Pergunta                     | Exemplo                               |
| ---------------------------- | ------------------------------------- |
| **1. O que você quer analisar?** | Tendências de leads / Estágios de negociação / Taxa de operação de equipamentos |
| **2. Onde estão os dados?**    | Qual coleção, quais campos            |
| **3. Como você quer apresentá-lo?** | Gráfico de linha, funil, gráfico de pizza, tabela de comparação |

Depois de definir esses conteúdos, você só precisa:

*   Escrever a lógica de análise na coleção de modelos;
*   Anexar o prompt da tarefa à página;
*   O Viz poderá então "assumir" a análise dos seus relatórios.

---

## 8. Conclusão: Leve o Paradigma com Você

"Overall Analytics" e "SQL Execution" são apenas duas implementações de exemplo.
Mais importante é a ideia por trás delas:

> **Faça o agente de IA entender sua lógica de negócios, não apenas executar prompts.**

Seja você usando NocoBase, um sistema privado ou seu próprio fluxo de trabalho personalizado,
você pode replicar esta estrutura:

*   Modelos centralizados;
*   Chamadas de fluxo de trabalho;
*   Execução somente leitura;
*   Apresentação por IA.

Dessa forma, o Viz não é mais apenas uma "IA que pode gerar gráficos",
mas um verdadeiro analista que entende seus dados, suas definições e seu negócio.