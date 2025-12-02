:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Gerenciamento de Versões

Depois que um **fluxo de trabalho** configurado for acionado pelo menos uma vez, se você quiser modificar a configuração do **fluxo de trabalho** ou seus nós, precisará criar uma nova versão antes de fazer as alterações. Isso garante que, ao revisar o histórico de execução de **fluxos de trabalho** acionados anteriormente, ele não será afetado por modificações futuras.

Na página de configuração do **fluxo de trabalho**, você pode visualizar as versões existentes do **fluxo de trabalho** no menu de versões, localizado no canto superior direito:

![Visualizar versões do fluxo de trabalho](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

No menu de mais ações ('...') à direita, você pode optar por copiar a versão atualmente visualizada para uma nova versão:

![Copiar fluxo de trabalho para uma nova versão](https://static-docs.nocobase.com/2805798e6caca2af004893390a744256.png)

Após copiar para uma nova versão, clique no alternador 'Habilitar'/'Desabilitar' para alternar a versão correspondente para o estado habilitado, e a nova versão do **fluxo de trabalho** entrará em vigor.

Se você precisar selecionar uma versão antiga novamente, mude para ela no menu de versões e então clique novamente no alternador 'Habilitar'/'Desabilitar' para alterná-la para o estado habilitado. A versão atualmente visualizada entrará em vigor, e os acionamentos subsequentes executarão o processo dessa versão.

Quando você precisar desabilitar o **fluxo de trabalho**, clique no alternador 'Habilitar'/'Desabilitar' para alterná-lo para o estado desabilitado, e o **fluxo de trabalho** não será mais acionado.

:::info{title=Dica}
Ao contrário de 'Copiar' um **fluxo de trabalho** da lista de gerenciamento de **fluxos de trabalho**, um **fluxo de trabalho** 'copiado para uma nova versão' ainda é agrupado no mesmo conjunto de **fluxos de trabalho**, apenas distinguido por versão. No entanto, copiar um **fluxo de trabalho** é tratado como um **fluxo de trabalho** completamente novo, não relacionado às versões do **fluxo de trabalho** anterior, e sua contagem de execuções será redefinida para zero.
:::