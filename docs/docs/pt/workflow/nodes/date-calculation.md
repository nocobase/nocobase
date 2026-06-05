---
pkg: '@nocobase/plugin-workflow-date-calculation'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Cálculo de Data

## Introdução

O nó de Cálculo de Data oferece nove funções de cálculo, incluindo adicionar um período de tempo, subtrair um período de tempo, formatar a saída de uma string de tempo e converter unidades de duração. Cada função possui tipos de valores de entrada e saída específicos, e também pode receber resultados de outros nós como variáveis de parâmetro. Ele utiliza um pipeline de cálculo para encadear os resultados das funções configuradas e, finalmente, obter uma saída esperada.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar o nó de "Cálculo de Data":

![Nó de Cálculo de Data_Criar Nó](https://static-docs.nocobase.com/[图片].png)

## Configuração do Nó

![Nó de Cálculo de Data_Configuração do Nó](https://static-docs.nocobase.com/20240817184423.png)

### Valor de Entrada

O valor de entrada pode ser uma variável ou uma constante de data. A variável pode ser os dados que acionaram este fluxo de trabalho ou o resultado de um nó anterior neste fluxo de trabalho. Para a constante, você pode selecionar qualquer data.

### Tipo do Valor de Entrada

Refere-se ao tipo do valor de entrada. Existem dois valores possíveis.

*   Tipo Data: Significa que o valor de entrada pode ser convertido para um tipo de data e hora, como um timestamp numérico ou uma string que representa uma data e hora.
*   Tipo Numérico: Como o tipo do valor de entrada afeta a seleção das etapas de cálculo de tempo seguintes, é necessário selecionar corretamente o tipo do valor de entrada.

### Etapas de Cálculo

Cada etapa de cálculo é composta por uma função de cálculo e sua configuração de parâmetros. Ela adota um design de pipeline, onde o resultado do cálculo da função anterior serve como valor de entrada para o cálculo da próxima função. Dessa forma, uma série de cálculos e conversões de tempo pode ser concluída.

Após cada etapa de cálculo, o tipo de saída também é fixo e influenciará as funções disponíveis para a próxima etapa de cálculo. O cálculo só pode continuar se os tipos corresponderem. Caso contrário, o resultado de uma etapa será a saída final do nó.

## Funções de Cálculo

### Adicionar um período de tempo

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   A quantidade a adicionar, que pode ser um número ou uma variável interna do nó.
    -   Unidade de tempo.
-   Tipo de valor de saída: Data
-   Exemplo: Se o valor de entrada for `2024-7-15 00:00:00`, a quantidade for `1` e a unidade for "dia", o resultado do cálculo será `2024-7-16 00:00:00`.

### Subtrair um período de tempo

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   A quantidade a subtrair, que pode ser um número ou uma variável interna do nó.
    -   Unidade de tempo.
-   Tipo de valor de saída: Data
-   Exemplo: Se o valor de entrada for `2024-7-15 00:00:00`, a quantidade for `1` e a unidade for "dia", o resultado do cálculo será `2024-7-14 00:00:00`.

### Calcular a diferença com outra data

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   A data para calcular a diferença, que pode ser uma constante de data ou uma variável do contexto do fluxo de trabalho.
    -   Unidade de tempo.
    -   Se deve usar o valor absoluto.
    -   Operação de arredondamento: As opções incluem manter casas decimais, arredondar, arredondar para cima e arredondar para baixo.
-   Tipo de valor de saída: Numérico
-   Exemplo: Se o valor de entrada for `2024-7-15 00:00:00`, o objeto de comparação for `2024-7-16 06:00:00`, a unidade for "dia", o valor absoluto não for considerado e as casas decimais forem mantidas, o resultado do cálculo será `-1.25`.

:::info{title=Dica}
Quando o valor absoluto e o arredondamento são configurados simultaneamente, o valor absoluto é aplicado primeiro, e depois o arredondamento.
:::

### Obter o valor de uma data em uma unidade específica

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   Unidade de tempo.
-   Tipo de valor de saída: Numérico
-   Exemplo: Se o valor de entrada for `2024-7-15 00:00:00` e a unidade for "dia", o resultado do cálculo será `15`.

### Definir a data para o início de uma unidade específica

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   Unidade de tempo.
-   Tipo de valor de saída: Data
-   Exemplo: Se o valor de entrada for `2024-7-15 14:26:30` e a unidade for "dia", o resultado do cálculo será `2024-7-15 00:00:00`.

### Definir a data para o fim de uma unidade específica

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   Unidade de tempo.
-   Tipo de valor de saída: Data
-   Exemplo: Se o valor de entrada for `2024-7-15 14:26:30` e a unidade for "dia", o resultado do cálculo será `2024-7-15 23:59:59`.

### Verificar ano bissexto

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   Nenhum parâmetro
-   Tipo de valor de saída: Booleano
-   Exemplo: Se o valor de entrada for `2024-7-15 14:26:30`, o resultado do cálculo será `true`.

### Formatar como string

-   Recebe tipo de valor de entrada: Data
-   Parâmetros
    -   Formato, consulte [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Tipo de valor de saída: String
-   Exemplo: Se o valor de entrada for `2024-7-15 14:26:30` e o formato for `the time is YYYY/MM/DD HH:mm:ss`, o resultado do cálculo será `the time is 2024/07/15 14:26:30`.

### Converter unidade

-   Recebe tipo de valor de entrada: Numérico
-   Parâmetros
    -   Unidade de tempo antes da conversão.
    -   Unidade de tempo após a conversão.
    -   Operação de arredondamento, as opções incluem manter casas decimais, arredondar, arredondar para cima e arredondar para baixo.
-   Tipo de valor de saída: Numérico
-   Exemplo: Se o valor de entrada for `2`, a unidade antes da conversão for "semana", a unidade após a conversão for "dia" e as casas decimais não forem mantidas, o resultado do cálculo será `14`.

## Exemplo

![Nó de Cálculo de Data_Exemplo](https://static-docs.nocobase.com/20240817184137.png)

Suponha que haja um evento promocional, e queremos adicionar uma data de término de promoção ao campo de um produto sempre que um produto for criado. Essa data de término é às 23:59:59 do último dia da semana seguinte à data de criação do produto. Então, podemos criar duas funções de tempo e executá-las em um pipeline:

-   Calcular a data da próxima semana
-   Redefinir o resultado para 23:59:59 do último dia daquela semana

Dessa forma, obtemos o valor de tempo desejado e o passamos para o próximo nó, como um nó de modificação de coleção, para adicionar a data de término da promoção à coleção.