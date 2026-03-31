:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Tarefa Agendada

## Introdução

Uma tarefa agendada é um evento acionado por uma condição de tempo, e ela funciona em dois modos:

- Tempo personalizado: Acionamento regular, similar ao cron, baseado no horário do sistema.
- Campo de tempo da **coleção**: Acionamento baseado no valor de um campo de tempo em uma **coleção** quando o horário é atingido.

Quando o sistema atinge o ponto no tempo (com precisão de segundos) que atende às condições de acionamento configuradas, o **fluxo de trabalho** correspondente será acionado.

## Uso Básico

### Criar uma tarefa agendada

Ao criar um **fluxo de trabalho** na lista de **fluxos de trabalho**, selecione o tipo "Tarefa Agendada":

![Criar uma tarefa agendada](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Modo de tempo personalizado

Para o modo regular, você precisa primeiro configurar o horário de início para qualquer ponto no tempo (com precisão de segundos). O horário de início pode ser definido para um horário futuro ou passado. Quando definido para um horário passado, o sistema verificará se o horário é devido com base na condição de repetição configurada. Se nenhuma condição de repetição for configurada e o horário de início estiver no passado, o **fluxo de trabalho** não será mais acionado.

Existem duas maneiras de configurar a regra de repetição:

- Por intervalo: Aciona em um intervalo fixo após o horário de início, como a cada hora, a cada 30 minutos, etc.
- Modo avançado: Ou seja, de acordo com as regras cron, pode ser configurado para um ciclo que atinge uma data e hora fixas baseadas em regras.

Após configurar a regra de repetição, você também pode configurar uma condição de término. Ela pode ser encerrada em um ponto fixo no tempo ou limitada pelo número de vezes que foi executada.

### Modo de campo de tempo da **coleção**

Usar o campo de tempo de uma **coleção** para determinar o horário de início é um modo de acionamento que combina tarefas agendadas regulares com campos de tempo de **coleção**. Usar este modo pode simplificar nós em alguns processos específicos e também é mais intuitivo em termos de configuração. Por exemplo, para alterar o status de pedidos vencidos e não pagos para cancelados, você pode simplesmente configurar uma tarefa agendada no modo de campo de tempo da **coleção**, selecionando o horário de início para 30 minutos após a criação do pedido.

## Dicas Relacionadas

### Tarefas agendadas em estado inativo ou desligado

Se a condição de tempo configurada for atendida, mas todo o serviço do aplicativo NocoBase estiver em estado inativo ou desligado, a tarefa agendada que deveria ter sido acionada naquele momento será perdida. Além disso, após o serviço ser reiniciado, as tarefas perdidas não serão acionadas novamente. Portanto, ao usar, você pode precisar considerar o tratamento para tais situações ou ter medidas de contingência.

### Contagem de repetições

Quando a condição de término "por contagem de repetições" é configurada, ela calcula o número total de execuções em todas as versões do mesmo **fluxo de trabalho**. Por exemplo, se uma tarefa agendada foi executada 10 vezes na versão 1, e a contagem de repetições também está definida para 10, o **fluxo de trabalho** não será mais acionado. Mesmo que copiado para uma nova versão, ele não será acionado, a menos que a contagem de repetições seja alterada para um número maior que 10. No entanto, se for copiado como um novo **fluxo de trabalho**, a contagem de execuções será redefinida para 0. Sem modificar a configuração relevante, o novo **fluxo de trabalho** poderá ser acionado mais 10 vezes.

### Diferença entre intervalo e modo avançado nas regras de repetição

O intervalo na regra de repetição é relativo ao horário do último acionamento (ou ao horário de início), enquanto o modo avançado aciona em pontos fixos no tempo. Por exemplo, se estiver configurado para acionar a cada 30 minutos, e o último acionamento foi em 01/09/2021 às 12:01:23, então o próximo horário de acionamento será em 01/09/2021 às 12:31:23. O modo avançado, ou seja, o modo cron, é configurado para acionar em pontos fixos no tempo; por exemplo, ele pode ser configurado para acionar aos 01 e 31 minutos de cada hora.

## Exemplo

Suponha que precisamos verificar a cada minuto os pedidos que não foram pagos por mais de 30 minutos após a criação e alterar automaticamente seu status para cancelado. Vamos implementar isso usando ambos os modos.

### Modo de tempo personalizado

Crie um **fluxo de trabalho** baseado em tarefa agendada. Na configuração do acionador, selecione o modo "Tempo personalizado", defina o horário de início para qualquer ponto não posterior ao horário atual, selecione "A cada minuto" para a regra de repetição e deixe a condição de término em branco:

![Tarefa Agendada_Configuração do Acionador_Modo de Tempo Personalizado](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Em seguida, configure outros nós de acordo com a lógica do processo, calcule o horário de 30 minutos atrás e altere o status dos pedidos não pagos criados antes desse horário para cancelado:

![Tarefa Agendada_Configuração do Acionador_Modo de Tempo Personalizado](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Após o **fluxo de trabalho** ser habilitado, ele será acionado uma vez a cada minuto a partir do horário de início, calculando o horário de 30 minutos atrás para atualizar o status dos pedidos criados antes desse ponto no tempo para cancelado.

### Modo de campo de tempo da **coleção**

Crie um **fluxo de trabalho** baseado em tarefa agendada. Na configuração do acionador, selecione o modo "Campo de tempo da **coleção**", selecione a **coleção** "Pedidos", defina o horário de início para 30 minutos após o horário de criação do pedido e selecione "Não repetir" para a regra de repetição:

![Tarefa Agendada_Configuração do Acionador_Modo de Campo de Tempo da Coleção_Acionador](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Em seguida, configure outros nós de acordo com a lógica do processo para atualizar o status do pedido com o ID dos dados acionados e um status de "não pago" para cancelado:

![Tarefa Agendada_Configuração do Acionador_Modo de Campo de Tempo da Coleção_Nó de Atualização](https://static-docs.nocobase.com/491dde9df7741fb24a4e7baa1de6eb29.png)

Ao contrário do modo de tempo personalizado, não há necessidade de calcular o horário de 30 minutos atrás aqui, porque o contexto dos dados acionados já contém a linha de dados que atende à condição de tempo, então você pode atualizar diretamente o status do pedido correspondente.