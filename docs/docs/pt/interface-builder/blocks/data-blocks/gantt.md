---
pkg: '@nocobase/plugin-gantt'
title: 'Bloco Gantt'
description: 'O bloco Gantt exibe as datas de início e término, bem como o progresso dos registros em uma linha do tempo. É adequado para planejamento de projetos, agendamento de tarefas e acompanhamento de marcos, com suporte a campo de título, campos de data, campo de progresso, campo de cor, escala de tempo, tabela à esquerda e popup de evento.'
keywords: 'Bloco Gantt,Gantt,planejamento de projetos,agendamento de tarefas,linha do tempo,gerenciamento de progresso,construção de interface,NocoBase'
---

# Bloco Gantt

## Introdução

O bloco Gantt exibe as datas de início e término, bem como o progresso dos registros em uma linha do tempo. Ele é adequado para planejamento de projetos, agendamento de tarefas, acompanhamento de marcos e outros cenários em que você precisa visualizar a duração das tarefas ao longo do tempo.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Instalação

Este bloco é um plugin integrado e não requer instalação adicional.

## Adicionar bloco

Depois de selecionar o bloco Gantt e escolher uma tabela de dados, configure no popup os campos exigidos pelo bloco Gantt:

1. Selecione o campo de título, usado para exibir o nome da tarefa
2. Selecione o campo de data de início, usado para determinar o início da tarefa
3. Selecione o campo de data de término, usado para determinar o término da tarefa
4. Opcionalmente, selecione o campo de progresso, usado para exibir e atualizar o progresso por arrasto
5. Opcionalmente, selecione o campo de cor, usado para diferenciar tarefas
6. Selecione a escala de tempo, usada para controlar a granularidade da linha do tempo

Após concluir a configuração, você pode criar o bloco Gantt.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Configurações do bloco

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Campos do Gantt

Os campos do Gantt determinam como os registros são mapeados para tarefas na linha do tempo.

Eles incluem:

- O campo de título determina o nome exibido na barra de tarefa
- O campo de data de início determina onde a barra de tarefa começa
- O campo de data de término determina onde a barra de tarefa termina
- O campo de progresso determina o progresso exibido dentro da barra de tarefa
- O campo de cor determina a cor da barra de tarefa
- A escala de tempo determina se a linha do tempo é exibida por hora, dia, semana, mês e assim por diante

### Campo de título

Usado para exibir o nome da tarefa. Normalmente, você pode selecionar um campo de texto, como nome da tarefa, nome do projeto ou título.

### Campo de data de início

Usado para especificar o horário de início da tarefa. O bloco Gantt usa esse campo para posicionar a tarefa na linha do tempo.

### Campo de data de término

Usado para especificar o horário de término da tarefa. Quando a data de início e a data de término são iguais, a tarefa é exibida como um intervalo mais curto.

### Campo de progresso

Usado para exibir o progresso de conclusão da tarefa, com suporte para atualização ao arrastar o controle de progresso na barra de tarefa.

O campo de progresso usa um campo float. Os dados são armazenados de `0` a `1` e exibidos como porcentagem no bloco Gantt. Por exemplo, `0.6` é exibido como `60%`.

### Campo de cor

Usado para definir a cor da barra de tarefa, facilitando a distinção entre tipos, status ou prioridades de tarefas.

O campo de cor aceita:

- Campo de seleção única
- Campo de cor

Se um campo de seleção única for usado, o bloco Gantt prioriza a cor configurada para a opção selecionada.

### Escala de tempo

Usada para controlar a granularidade de exibição da linha do tempo.

Atualmente oferece suporte a:

- Hora
- Um quarto do dia
- Meio dia
- Dia
- Semana
- Mês
- Ano
- Trimestre

Para tarefas de curta duração, use hora, meio dia ou dia. Para tarefas de longa duração, use semana, mês, trimestre ou ano.

### Mostrar tabela

Quando ativado, o bloco Gantt exibe uma área de tabela à esquerda. Você pode configurar colunas de tabela para mostrar atributos importantes das tarefas.

Quando desativado, o bloco exibe apenas a linha do tempo à direita. Isso é adequado quando o espaço da página é limitado ou quando você só precisa visualizar o cronograma.

### Largura da tabela

Usada para definir a largura da área de tabela à esquerda. Esta configuração aparece apenas quando Mostrar tabela está ativado.

Se houver muitos campos na tabela, aumente a largura. Se apenas poucos campos forem mantidos, reduza a largura e deixe mais espaço para a linha do tempo.

### Ativar arrastar para reagendar

Quando ativado, você pode arrastar barras de tarefa na linha do tempo para ajustar as datas de início e término.

Detalhes:

- Arraste a barra de tarefa inteira para ajustar a data de início e a data de término ao mesmo tempo
- Arraste os controles nas duas extremidades da barra para ajustar a data de início ou a data de término
- Arraste o controle de progresso para atualizar o campo de progresso

Se você não quiser que os usuários alterem o cronograma diretamente no bloco Gantt, desative esta opção.

### Rolar para hoje na primeira exibição

Quando ativado, o bloco Gantt rola automaticamente para hoje quando é exibido pela primeira vez.

Esta opção é adequada para projetos com tarefas de longa duração. Ao abrir a página, os usuários veem primeiro as tarefas próximas à data atual.

### Configurações do popup de evento

Usadas para configurar como uma barra de tarefa é aberta após ser clicada.

Você pode configurar:

- Modo de abertura, como gaveta, diálogo ou página
- Tamanho do popup
- Modelo do popup

Após clicar em uma barra de tarefa, o NocoBase abre o registro atual de acordo com esta configuração, facilitando a visualização ou edição dos detalhes da tarefa.

### Escopo de dados

Usado para limitar os dados exibidos no bloco Gantt.

Por exemplo: mostrar apenas tarefas do projeto atual ou apenas tarefas inacabadas.

Para mais detalhes, consulte [Escopo de dados](../block-settings/data-scope).

### Tamanho da página

Usado para controlar o número de registros carregados por página. Quando houver muitos registros, os usuários podem trocar de página para ver mais tarefas.

### Mostrar números de linha

Quando ativado, a tabela à esquerda exibe números de linha, facilitando a localização de registros quando há muitas tarefas.

### Tabela em árvore

Se a tabela de dados atual for uma tabela em árvore, o bloco Gantt pode ativar o modo de tabela em árvore. Após ativado, a tabela à esquerda exibe registros em hierarquia pai-filho, e a linha do tempo à direita exibe as tarefas na mesma hierarquia.

No modo de tabela em árvore, você também pode configurar Expandir todas as linhas por padrão.

## Configurar campos

A área de tabela à esquerda usa colunas de tabela para exibir campos de registros.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Adicionar campos

Depois que Mostrar tabela estiver ativado, você pode adicionar colunas de campo à tabela à esquerda. As configurações de campo podem consultar [Coluna da tabela](../../fields/generic/table-column).

### Coluna de ações

O bloco Gantt inclui uma coluna de ações por padrão. Você pode adicionar ações de registro como visualizar, editar e excluir.

Se as configurações do popup de evento já estiverem configuradas, você também pode clicar diretamente na barra de tarefa à direita para abrir os detalhes do registro.

## Configurar ações

O bloco Gantt permite configurar ações globais no topo. Os tipos de ação disponíveis dependem das capacidades habilitadas no ambiente atual.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Ações integradas

- Hoje: rolar rapidamente para hoje
- Expandir/Recolher: expandir ou recolher todas as linhas no modo de tabela em árvore

### Ações globais

- [Adicionar novo](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Link](../../actions/types/link)
- [Atualizar](../../actions/types/refresh)
- [Filtro](../../actions/types/filter)
- [Edição em massa](../../actions/types/bulk-edit)
- [Atualização em massa](../../actions/types/bulk-update)
- [Disparar workflow](../../actions/types/trigger-workflow)
- [Requisição personalizada](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [Funcionário de IA](../../actions/types/ai-employee)
