:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Consulta de Dados

O painel de configuração do gráfico é dividido em três seções: Consulta de Dados, Opções do Gráfico e Eventos de Interação, além dos botões Cancelar, Visualizar e Salvar na parte inferior.

Vamos primeiro dar uma olhada no painel "Consulta de Dados" para entender os dois modos de consulta (Builder/SQL) e suas funcionalidades comuns.

## Estrutura do Painel
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Dica: Para configurar o conteúdo atual com mais facilidade, você pode recolher os outros painéis primeiro.

Na parte superior, você encontra a barra de ações:
- Modo: Builder (gráfico, simples e conveniente) / SQL (instruções escritas manualmente, mais flexível).
- Executar consulta: Clique para executar a solicitação de consulta de dados.
- Visualizar resultado: Abre o painel de resultados dos dados, onde você pode alternar entre as visualizações Tabela/JSON. Clique novamente para recolher o painel.

De cima para baixo, temos:
- Fonte de dados e coleção: Obrigatório. Selecione a fonte de dados e a coleção.
- Medidas (Measures): Obrigatório. Os campos numéricos a serem exibidos.
- Dimensões (Dimensions): Agrupe por campos (por exemplo, data, categoria, região).
- Filtro: Defina as condições de filtro (por exemplo, =, ≠, >, <, contém, intervalo). Múltiplas condições podem ser combinadas.
- Ordenação: Selecione o campo para ordenar e a ordem (crescente/decrescente).
- Paginação: Controle o intervalo de dados e a ordem de retorno.

## Modo Builder

### Selecionar fonte de dados e coleção
- No painel "Consulta de Dados", defina o modo como "Builder".
- Selecione uma fonte de dados e uma coleção. Se a coleção não for selecionável ou estiver vazia, verifique primeiro as permissões e se ela foi criada.

### Configurar Medidas (Measures)
- Selecione um ou mais campos numéricos e defina uma agregação: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Casos de uso comuns: `Count` para contar registros, `Sum` para calcular um total.

### Configurar Dimensões (Dimensions)
- Selecione um ou mais campos como dimensões de agrupamento.
- Campos de data e hora podem ser formatados (por exemplo, `YYYY-MM`, `YYYY-MM-DD`) para facilitar o agrupamento por mês ou dia.

### Filtrar, Ordenar e Paginar
- Filtro: Adicione condições (por exemplo, =, ≠, contém, intervalo). Múltiplas condições podem ser combinadas.
- Ordenação: Selecione um campo e a ordem de classificação (crescente/decrescente).
- Paginação: Defina `Limit` e `Offset` para controlar o número de linhas retornadas. É recomendável definir um `Limit` pequeno ao depurar.

### Executar Consulta e Visualizar Resultado
- Clique em "Executar consulta" para executar. Após o retorno, alterne entre `Tabela / JSON` em "Visualizar resultado" para verificar as colunas e os valores.
- Antes de mapear os campos do gráfico, confirme os nomes e tipos das colunas aqui para evitar que o gráfico fique vazio ou apresente erros posteriormente.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Mapeamento de Campos Posterior

Posteriormente, ao configurar as "Opções do Gráfico", você fará o mapeamento dos campos com base nos campos da fonte de dados e da coleção selecionadas.

## Modo SQL

### Escrever Consulta
- Mude para o modo "SQL", insira sua instrução de consulta e clique em "Executar consulta".
- Exemplo (valor total do pedido por data):
```sql
SELECT
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Executar Consulta e Visualizar Resultado

- Clique em "Executar consulta" para executar. Após o retorno, alterne entre `Tabela / JSON` em "Visualizar resultado" para verificar as colunas e os valores.
- Antes de mapear os campos do gráfico, confirme os nomes e tipos das colunas aqui para evitar que o gráfico fique vazio ou apresente erros posteriormente.

### Mapeamento de Campos Posterior

Posteriormente, ao configurar as "Opções do Gráfico", você fará o mapeamento dos campos com base nas colunas do resultado da consulta.

> [!TIP]
> Para mais informações sobre o modo SQL, consulte Uso Avançado — Consultar Dados no Modo SQL.