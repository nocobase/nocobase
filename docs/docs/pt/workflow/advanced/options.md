# Configurações Avançadas

## Configurações de Timeout

A partir da versão `2.1.0`, os fluxos de trabalho oferecem suporte a configurações de timeout para limitar a duração máxima de uma única execução, desde o início do processamento até o fim. As configurações de timeout são úteis para evitar que fluxos de trabalho ocupem recursos de execução indefinidamente por causa de operações demoradas, espera por processamento manual ou espera por callbacks externos.

Na caixa de diálogo de criação ou edição do fluxo de trabalho, expanda "Opções avançadas" para configurar as "Configurações de timeout":

![20260604212454](https://static-docs.nocobase.com/20260604212454.png)

As opções disponíveis são:

- Insira `0` para não limitar o timeout (valor padrão).
- Insira um valor maior que `0` para ativar o limite de timeout. A interface permite selecionar segundos, minutos, horas e dias como unidades.
- O timeout máximo é de 180 dias.

### Regras de Contagem

O timeout começa a contar quando o fluxo de trabalho entra pela primeira vez em um processador. Depois que um fluxo de trabalho é acionado, o tempo em que ele permanece na fila aguardando o agendamento, ou armazenado para início adiado, não consome o timeout.

Depois de entrar em um processador, o timeout continua sendo contado, incluindo o tempo real de execução dos nós e o tempo de nós que já entraram em estado de espera, como processamento manual, aprovação, atraso ou espera por callback externo. O timeout não é pausado enquanto o fluxo de trabalho aguarda uma ação do usuário.

O prazo de timeout é determinado quando essa execução começa. Alterar as configurações de timeout do fluxo de trabalho afeta apenas as execuções que começarem a ser processadas depois; execuções que já começaram não são recalculadas.

### Tratamento Após Timeout

Se a execução ainda não tiver terminado quando o timeout for atingido, o sistema encerrará essa execução:

- O status no histórico de execução muda para "Abortado", e o motivo de encerramento é exibido como "Timeout".
- As tarefas de nó que estão em execução ou aguardando são marcadas como "Abortado".
- Os nós seguintes não continuarão a ser executados.
- Se essa execução tiver subfluxos ainda em execução, esses subfluxos também serão abortados junto com a execução pai.

Por exemplo:

- Se um nó de loop executar um loop extremamente longo e o processamento dentro do loop for demorado, fazendo com que todo o nó de loop exceda o timeout configurado, o nó de loop em execução e seus nós internos serão encerrados forçosamente, e os nós seguintes não continuarão a ser executados.
- Se um nó de processamento manual ou aprovação aguardar por muito tempo e exceder o timeout configurado, o nó em espera será encerrado forçosamente, os nós seguintes não continuarão a ser executados e as tarefas relacionadas serão canceladas.

:::info{title=Dica}
As configurações de timeout são um limite global para toda a execução do fluxo de trabalho, não um timeout individual de um nó. Se você só precisa limitar o tempo de espera de um nó específico, como uma requisição HTTP ou um script JavaScript, use as configurações de timeout do próprio nó.
:::

:::info{title=Dica}
Se você precisa implementar um tratamento de negócio com limite de tempo, por exemplo, "marcar uma ordem de serviço como expirada se ninguém a processar em 10 minutos", normalmente use o [nó de atraso](../nodes/delay.md) junto com ramificações paralelas para organizar o processamento posterior. O timeout global encerra diretamente a execução atual, portanto é adequado como proteção de contingência, não para conduzir ramificações de negócio posteriores.
:::

## Modo de Execução

Os fluxos de trabalho são executados de forma assíncrona ou síncrona, com base no tipo de gatilho selecionado durante a criação. O modo assíncrono significa que, após um evento específico ser acionado, o fluxo de trabalho entra em uma fila e é executado um por um pelo agendamento em segundo plano. Já o modo síncrono, após ser acionado, não entra na fila de agendamento; ele começa a ser executado diretamente e fornece feedback imediato após a conclusão.

Eventos de coleção, eventos pós-ação, eventos de ação personalizada, eventos agendados e eventos de aprovação são executados de forma assíncrona por padrão. Eventos pré-ação são executados de forma síncrona por padrão. Tanto os eventos de coleção quanto os eventos de formulário suportam ambos os modos, que podem ser selecionados ao criar um fluxo de trabalho:

![Modo Síncrono_Criar Fluxo de Trabalho Síncrono](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Dica}
Devido à sua natureza, fluxos de trabalho síncronos não podem usar nós que produzem um estado de "espera", como "Processamento manual".
:::

## Exclusão Automática do Histórico de Execução

Quando um fluxo de trabalho é acionado com frequência, você pode configurar a exclusão automática do histórico de execução para reduzir o acúmulo e aliviar a pressão de armazenamento no banco de dados.

Você também pode configurar se o histórico de execução de um fluxo de trabalho deve ser excluído automaticamente nas suas caixas de diálogo de criação e edição:

![Configuração de Exclusão Automática do Histórico de Execução](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

A exclusão automática pode ser configurada com base no status do resultado da execução. Na maioria dos casos, é recomendado marcar apenas o status "Concluído" para preservar os registros de execuções com falha, facilitando a solução de problemas futuros.

É recomendado não ativar a exclusão automática do histórico de execução ao depurar um fluxo de trabalho, para que você possa usar o histórico para verificar se a lógica de execução do fluxo de trabalho está conforme o esperado.

:::info{title=Dica}
Excluir o histórico de um fluxo de trabalho não reduz sua contagem de execuções.
:::
