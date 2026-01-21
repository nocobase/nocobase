:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Plano de Execução (Histórico)

Após um **fluxo de trabalho** ser acionado, um **plano de execução** correspondente é criado para rastrear o processo de execução dessa tarefa. Cada **plano de execução** possui um valor de status para indicar o estado atual da execução, que pode ser visualizado na lista e nos detalhes do histórico de execução:

![Status do Plano de Execução](https://static-docs.nocobase.com/d4440d92ccafac6fac85da4415bb2a26.png)

Quando todos os nós no ramo principal do **fluxo de trabalho** são executados até o fim com o status "Concluído", todo o **plano de execução** terminará com o status "Concluído". Quando um nó no ramo principal do **fluxo de trabalho** apresenta um status final como "Falha", "Erro", "Cancelado" ou "Rejeitado", todo o **plano de execução** será **encerrado prematuramente** com o status correspondente. Quando um nó no ramo principal do **fluxo de trabalho** apresenta o status "Aguardando", todo o **plano de execução** será pausado, mas ainda mostrará o status "Em execução", até que o nó aguardando seja retomado. Diferentes tipos de nós lidam com o estado de espera de maneiras distintas. Por exemplo, um nó manual precisa aguardar o processamento humano, enquanto um nó de atraso precisa aguardar o tempo especificado para continuar.

Os status de um **plano de execução** são os seguintes:

| Status      | Status correspondente do último nó executado no processo principal | Significado                                                              |
| ----------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Em fila     | -                                                                 | O **fluxo de trabalho** foi acionado e um **plano de execução** foi gerado, aguardando na fila para o agendador organizar a execução. |
| Em execução | Aguardando                                                        | O nó requer uma pausa, aguardando por mais entrada ou um retorno de chamada para continuar. |
| Concluído   | Concluído                                                         | Nenhum problema foi encontrado, e todos os nós foram executados um a um conforme o esperado. |
| Falha       | Falha                                                             | Falhou porque a configuração do nó não foi atendida.                     |
| Erro        | Erro                                                              | O nó encontrou um erro de programa não tratado e foi encerrado prematuramente. |
| Cancelado   | Cancelado                                                         | Um nó aguardando foi cancelado externamente pelo administrador do **fluxo de trabalho**, encerrando prematuramente. |
| Rejeitado   | Rejeitado                                                         | Em um nó de processamento manual, foi rejeitado manualmente, e o processo subsequente não continuará. |

No exemplo de [Início Rápido](../getting-started.md), já sabemos que, ao visualizar os detalhes do histórico de execução de um **fluxo de trabalho**, podemos verificar se todos os nós foram executados normalmente, bem como o status de execução e os dados de resultado de cada nó executado. Em alguns **fluxos de trabalho** e nós avançados, um nó pode ter múltiplos resultados, como o resultado de um nó de loop:

![Resultados do nó de múltiplas execuções](https://static-docs.nocobase.com/bbda259fa2ddf62b0fc0f982efbedae9.png)

:::info{title=Dica}
Os **fluxos de trabalho** podem ser acionados concorrentemente, mas são executados sequencialmente em uma fila. Mesmo que múltiplos **fluxos de trabalho** sejam acionados ao mesmo tempo, eles serão executados um por um, não em paralelo. Portanto, um status "Em fila" significa que outros **fluxos de trabalho** estão atualmente em execução e é preciso aguardar.

O status "Em execução" apenas indica que o **plano de execução** foi iniciado e geralmente está pausado devido ao estado de espera de um nó interno. Isso não significa que este **plano de execução** tenha preemptado os recursos de execução no início da fila. Portanto, quando há um **plano de execução** "Em execução", outros **planos de execução** "Em fila" ainda podem ser agendados para iniciar.
:::

## Status de Execução do Nó

O status de um **plano de execução** é determinado pela execução de cada um de seus nós. Em um **plano de execução** após um acionamento, cada nó produz um status de execução após ser executado, e esse status determina se o processo subsequente continuará. Normalmente, após um nó ser executado com sucesso, o próximo nó será executado, até que todos os nós sejam executados em sequência ou o processo seja interrompido. Ao encontrar nós relacionados ao controle de **fluxo de trabalho**, como ramificações, loops, ramificações paralelas, atrasos, etc., o **fluxo de trabalho** para o próximo nó é determinado com base nas condições configuradas no nó e nos dados de contexto de tempo de execução.

Os possíveis status de um nó após a execução são os seguintes:

| Status      | É um Estado Final | Termina Prematuramente | Significado                                                              |
| ----------- | :---------------: | :--------------------: | ------------------------------------------------------------------------ |
| Aguardando  |        Não        |          Não           | O nó requer uma pausa, aguardando por mais entrada ou um retorno de chamada para continuar. |
| Concluído   |        Sim        |          Não           | Nenhum problema foi encontrado, executado com sucesso e continua para o próximo nó até o fim. |
| Falha       |        Sim        |          Sim           | Falhou porque a configuração do nó não foi atendida.                     |
| Erro        |        Sim        |          Sim           | O nó encontrou um erro de programa não tratado e foi encerrado prematuramente. |
| Cancelado   |        Sim        |          Sim           | Um nó aguardando foi cancelado externamente pelo administrador do **fluxo de trabalho**, encerrando prematuramente. |
| Rejeitado   |        Sim        |          Sim           | Em um nó de processamento manual, foi rejeitado manualmente, e o processo subsequente não continuará. |

Exceto pelo status "Aguardando", todos os outros status são estados finais para a execução do nó. Somente quando o estado final é "Concluído" o processo continuará; caso contrário, toda a execução do **fluxo de trabalho** será encerrada prematuramente. Quando um nó está em um **fluxo de trabalho** de ramificação (ramificação paralela, condição, loop, etc.), o estado final produzido pela execução do nó será tratado pelo nó que iniciou a ramificação, e isso determinará o **fluxo de trabalho** de todo o processo.

Por exemplo, quando usamos um nó de condição no modo "'Sim' para continuar", se o resultado for "Não" durante a execução, todo o **fluxo de trabalho** será encerrado prematuramente com o status "Falha", e os nós subsequentes não serão executados, conforme mostrado na figura abaixo:

![Falha na execução do nó](https://static-docs.nocobase.com/993aecfa1465894bb574444f0a44313e.png)

:::info{title=Dica}
Todos os status de término, exceto "Concluído", podem ser considerados falhas, mas as razões para a falha são diferentes. Você pode visualizar os resultados da execução do nó para entender melhor a causa da falha.
:::