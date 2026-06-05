---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Ramificação Paralela

O nó de ramificação paralela pode dividir um fluxo de trabalho em várias ramificações. Cada ramificação pode ser configurada com nós diferentes, e o método de execução varia dependendo do modo da ramificação. Use o nó de ramificação paralela em cenários onde várias ações precisam ser executadas simultaneamente.

## Instalação

É um plugin (plugin) integrado, então você não precisa instalá-lo.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição (“+”) no fluxo para adicionar um nó de “Ramificação Paralela”:

![Adicionar Ramificação Paralela](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Após adicionar um nó de ramificação paralela ao fluxo de trabalho, duas sub-ramificações são adicionadas por padrão. Você também pode adicionar mais ramificações clicando no botão de adicionar ramificação. Qualquer número de nós pode ser adicionado a cada ramificação. Ramificações desnecessárias podem ser removidas clicando no botão de exclusão no início da ramificação.

![Gerenciar Ramificações Paralelas](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Configuração do Nó

### Modo da Ramificação

O nó de ramificação paralela possui os três modos a seguir:

- **Todas bem-sucedidas**: O fluxo de trabalho só continuará a executar os nós após a conclusão das ramificações se *todas* as ramificações forem executadas com sucesso. Caso contrário, se *qualquer* ramificação for encerrada prematuramente, seja por falha, erro ou qualquer outro estado não bem-sucedido, todo o nó de ramificação paralela será encerrado prematuramente com esse status. Este modo também é conhecido como “Modo All”.
- **Qualquer uma bem-sucedida**: O fluxo de trabalho continuará a executar os nós após a conclusão das ramificações assim que *qualquer* ramificação for executada com sucesso. O nó de ramificação paralela só será encerrado prematuramente se *todas* as ramificações forem encerradas prematuramente, seja por falha, erro ou qualquer outro estado não bem-sucedido. Este modo também é conhecido como “Modo Any”.
- **Qualquer sucesso ou falha**: O fluxo de trabalho continuará a executar os nós após a conclusão das ramificações assim que *qualquer* ramificação for executada com sucesso. No entanto, se *qualquer* nó falhar, toda a ramificação paralela será encerrada prematuramente com esse status. Este modo também é conhecido como “Modo Race”.

Independentemente do modo, cada ramificação será executada em ordem da esquerda para a direita até que as condições do modo de ramificação predefinido sejam atendidas, momento em que o fluxo continuará para os nós subsequentes ou será encerrado prematuramente.

## Exemplo

Consulte o exemplo em [Nó de Atraso](./delay.md).