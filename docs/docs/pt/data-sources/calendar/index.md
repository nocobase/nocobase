---
pkg: "@nocobase/plugin-calendar"
title: "Bloco de calendário"
description: "O bloco de calendário exibe eventos e dados de datas em uma visualização de calendário, sendo adequado para agendamento de reuniões, planejamento de atividades e outros cenários. Permite configurar o campo de título, os horários de início/fim, o calendário lunar e o escopo de dados."
keywords: "bloco de calendário,visualização de calendário,eventos,agendamento de reuniões,Calendar,NocoBase"
---
# Bloco de calendário

## Introdução

O bloco de calendário exibe dados relacionados a eventos e datas em uma visualização de calendário, sendo adequado para cenários como agendamento de reuniões e planejamento de atividades.

## Instalação

Plugin integrado, não é necessário instalar.

## Adicionar bloco

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Campo de título: informações exibidas na barra do calendário; atualmente são compatíveis os campos dos tipos `input`, `select`, `phone`, `email`, `radioGroup`,`sequence` e similares. É possível usar plugins para ampliar os tipos de campos de título compatíveis com o bloco de calendário.
2. Hora de início: hora de início da tarefa;
3. Hora de término: hora de término da tarefa;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Clique na barra da tarefa para destacá-la e abrir uma janela pop-up.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Itens de configuração do bloco

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Exibir calendário lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Configurar escopo de dados

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Consulte também

### Configurar altura do bloco

Exemplo: ajustar a altura do bloco de calendário de pedidos; não haverá barra de rolagem dentro do bloco de calendário.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Consulte também

### Campo de cor de fundo

:::info{title=Observação}
É necessário usar o NocoBase na versão v1.4.0-beta ou superior.
:::

Essa opção pode ser usada para configurar a cor de fundo dos eventos do calendário. Veja como:

1. A tabela de dados do calendário precisa conter um campo do tipo **Lista suspensa de seleção única (Single select)** ou **Grupo de opções (Radio group)**, e esse campo precisa ter cores configuradas.
2. Em seguida, volte à interface de configuração do bloco de calendário e selecione, em **Campo de cor de fundo**, o campo que acabou de ser configurado com cores.
3. Por fim, selecione uma cor para um evento do calendário e clique em Enviar para verificar se a cor foi aplicada.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Dias de início da semana

> Compatível com a versão v1.7.7 ou superior

O bloco de calendário permite configurar o dia de início de cada semana. É possível escolher **domingo** ou **segunda-feira** como o primeiro dia da semana.
O dia de início padrão é **segunda-feira**, permitindo que os usuários ajustem a exibição do calendário de acordo com os hábitos de diferentes regiões, atendendo melhor às necessidades reais de uso.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Configurar operações

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hoje

O botão "Hoje" do bloco de calendário oferece uma função de navegação conveniente, permitindo que os usuários retornem rapidamente à página do calendário que contém a data atual após navegar para outras datas.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Alternar visualização

O padrão é mensal

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)
