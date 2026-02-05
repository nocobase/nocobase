:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Condição

## Introdução

Semelhante à instrução `if` em linguagens de programação, este nó determina a direção do fluxo de trabalho com base no resultado de uma condição configurada.

## Criar Nó

O nó de Condição possui dois modos: "Continuar se verdadeiro" e "Ramificar em verdadeiro/falso". Você precisa escolher um desses modos ao criar o nó, e essa escolha não poderá ser alterada posteriormente na configuração do nó.

![Seleção de Modo da Condição](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

No modo "Continuar se verdadeiro", quando o resultado da condição for "verdadeiro", o fluxo de trabalho continuará a executar os nós subsequentes. Caso contrário, o fluxo de trabalho será encerrado e sairá prematuramente com um status de falha.

![Modo "Continuar se verdadeiro"](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Este modo é ideal para cenários em que o fluxo de trabalho não deve prosseguir se a condição não for atendida. Por exemplo, imagine um botão de envio de formulário para submeter um pedido, que está vinculado a um "Evento antes da ação". Se o estoque do produto no pedido for insuficiente, o processo de criação do pedido não deve continuar, mas sim falhar e sair.

No modo "Ramificar em verdadeiro/falso", o nó de condição criará duas ramificações subsequentes, correspondendo aos resultados "verdadeiro" e "falso" da condição. Cada ramificação pode ser configurada com seus próprios nós subsequentes. Após a conclusão da execução de qualquer uma das ramificações, ela se unirá automaticamente de volta à ramificação pai do nó de condição para continuar executando os nós seguintes.

![Modo "Ramificar em verdadeiro/falso"](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Este modo é adequado para cenários em que diferentes ações precisam ser executadas dependendo se a condição é atendida ou não. Por exemplo, verificar se um dado existe: se não existir, crie-o; se existir, atualize-o.

## Configuração do Nó

### Mecanismo de Cálculo

Atualmente, três mecanismos são suportados:

-   **Básico**: Obtém um resultado lógico através de cálculos binários simples e agrupamento "E"/"OU".
-   **Math.js**: Calcula expressões suportadas pelo mecanismo [Math.js](https://mathjs.org/) para obter um resultado lógico.
-   **Formula.js**: Calcula expressões suportadas pelo mecanismo [Formula.js](https://formulajs.info/) para obter um resultado lógico.

Em todos os três tipos de cálculo, variáveis do contexto do fluxo de trabalho podem ser usadas como parâmetros.