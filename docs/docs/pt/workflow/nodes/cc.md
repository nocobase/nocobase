---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# CC <Badge>v1.8.2+</Badge>

## Introdução

O nó de CC é usado para enviar conteúdo contextual específico do processo de execução do fluxo de trabalho para usuários designados, para fins de conhecimento e consulta. Por exemplo, em um processo de aprovação ou outro fluxo, você pode enviar informações relevantes em CC para outros participantes, para que eles possam acompanhar o andamento.

Você pode configurar vários nós de CC em um fluxo de trabalho. Assim, quando o fluxo de trabalho chegar a esse nó, as informações relevantes serão enviadas aos destinatários especificados.

O conteúdo enviado em CC será exibido no menu "CC para mim" da Central de Tarefas. Lá, os usuários podem visualizar todo o conteúdo enviado em CC para eles. A Central de Tarefas também indicará os itens não lidos, alertando o usuário sobre o conteúdo de CC que ainda não foi visualizado. Após a visualização, os usuários podem marcá-los manualmente como lidos.

## Criar Nó

Na interface de configuração do fluxo de trabalho, clique no botão de adição ("+") no fluxo para adicionar um nó de "CC":

![Adicionar CC](https://static-docs.nocobase.com/20250710222842.png)

## Configuração do Nó

![Configuração do Nó](https://static-docs.nocobase.com/20250710224041.png)

Na interface de configuração do nó, você pode definir os seguintes parâmetros:

### Destinatários

Os destinatários são a coleção de usuários-alvo para o CC, podendo ser um ou mais usuários. A origem da seleção pode ser um valor estático, escolhido a partir de uma lista de usuários, um valor dinâmico especificado por uma variável, ou o resultado de uma consulta na coleção de usuários.

![Configuração de Destinatários](https://static-docs.nocobase.com/20250710224421.png)

### Interface do Usuário

Os destinatários precisam visualizar o conteúdo enviado em CC no menu "CC para mim" da Central de Tarefas. Você pode configurar os resultados do gatilho e de qualquer nó no contexto do fluxo de trabalho como blocos de conteúdo.

![Interface do Usuário](https://static-docs.nocobase.com/20250710225400.png)

### Título da Tarefa

O título da tarefa é o título exibido na Central de Tarefas. Você pode usar variáveis do contexto do fluxo de trabalho para gerar o título dinamicamente.

![Título da Tarefa](https://static-docs.nocobase.com/20250710225603.png)

## Central de Tarefas

Os usuários podem visualizar e gerenciar todo o conteúdo enviado em CC para eles na Central de Tarefas, e filtrar e visualizar com base no status de leitura.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Após a visualização, você pode marcá-lo como lido, e a contagem de itens não lidos diminuirá.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)