---
pkg: "@nocobase/plugin-calendar"
title: "Block de calendário"
description: "O Block de calendário exibe eventos e dados de data em uma visualização de calendário, ideal para agendamento de reuniões, planejamento de eventos etc. Suporta configuração de campo de título, datas de início/fim, exibição do calendário lunar e escopo de dados."
keywords: "Block de calendário, visualização de calendário, gerenciamento de eventos, agendamento de reuniões, Calendar, NocoBase"
---

# Block de calendário

## Introdução

O Block de calendário exibe eventos e dados associados a datas em uma visualização de calendário intuitiva, indicada para cenários como agendamento de reuniões e planejamento de eventos.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Instalação

Este Block faz parte de um Plugin embutido e não requer instalação adicional.

## Adicionar o Block

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Selecione o Block "Calendário" e indique a tabela de dados correspondente para concluir a criação.

## Configurações do Block

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Campo de título

Define o título exibido na barra do evento no calendário.

Os tipos de campo suportados atualmente incluem `input`, `select`, `phone`, `email`, `radioGroup`, `sequence` etc., e mais tipos podem ser adicionados via Plugin.

### Campo de data inicial

Define a data de início do evento.

### Campo de data final

Define a data de fim do evento.

### Criação rápida de evento

Clique em uma área de data vazia no calendário para abrir rapidamente um popup de criação de evento.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Ao clicar em um evento existente:
- O evento atual é destacado
- Uma janela de detalhes é aberta para visualizar ou editar

### Mostrar calendário lunar

Quando ativado, o calendário também exibe o calendário lunar correspondente.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Escopo de dados

Define o escopo dos dados exibidos no Block de calendário.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Para mais detalhes, consulte: [Definir escopo de dados](/interface-builder/blocks/block-settings/data-scope)

### Altura do Block

É possível personalizar a altura do Block de calendário para evitar scroll interno e melhorar a experiência geral de layout.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Para mais detalhes, consulte: [Altura do Block](/interface-builder/blocks/block-settings/block-height)

### Campo de cor

Configura a cor de fundo dos eventos no calendário, melhorando a distinção visual.

Passos de uso:

1. Adicione um campo do tipo **Single select** ou **Radio group** à tabela e configure cores nas opções;
2. Na configuração do Block de calendário, defina esse campo como "Campo de cor";
3. Ao criar ou editar um evento, escolha a cor; ela passará a ser aplicada no calendário.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Início da semana

É possível definir o dia de início da semana, escolhendo entre:
- Domingo
- Segunda-feira (padrão)

Ajuste conforme os hábitos da sua região para que a exibição do calendário fique mais alinhada às necessidades reais.


## Configurar Actions

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Hoje

O botão "Hoje" leva rapidamente à visualização atual da data atual.

### Trocar de período

Permite navegar pelas datas conforme o modo de visualização atual:
- Visualização mensal: mês anterior / próximo mês
- Visualização semanal: semana anterior / próxima semana
- Visualização diária: ontem / amanhã

### Selecionar visualização

Suporta a alternância entre as seguintes visualizações:
- Visualização mensal (padrão)
- Visualização semanal
- Visualização diária

### Título

Mostra a data correspondente à visualização atual.
