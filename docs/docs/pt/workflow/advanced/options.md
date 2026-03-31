:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Configurações Avançadas

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