---
pkg: "@nocobase/plugin-calendar"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Bloco de Calendário

## Introdução

O Bloco de Calendário permite que você visualize e gerencie eventos e dados relacionados a datas em um formato de calendário. É ideal para agendar reuniões, planejar atividades e organizar seu tempo de forma eficiente.

## Instalação

Este plugin é integrado, então você não precisa instalá-lo.

## Adicionando Blocos

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Campo de Título: Usado para exibir informações nas barras do calendário. Atualmente, ele suporta tipos de campo como `input` (Texto de Linha Única), `select` (Seleção Única), `phone` (Telefone), `email` (E-mail), `radioGroup` (Grupo de Rádio) e `sequence` (Sequência). Você pode estender os tipos de campo de título suportados pelo bloco de calendário através de **plugins**.
2.  Hora de Início: Indica quando a tarefa começa.
3.  Hora de Término: Marca quando a tarefa termina.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Ao clicar em uma barra de tarefa, a seleção é destacada e uma janela pop-up detalhada é aberta.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opções de Configuração do Bloco

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Exibir Calendário Lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Definir Intervalo de Dados

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Para mais informações, consulte .

### Definir Altura do Bloco

Exemplo: Ajuste a altura do bloco de calendário de pedidos. Nenhuma barra de rolagem aparecerá dentro do bloco de calendário.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Para mais informações, consulte

### Campo de Cor de Fundo

:::info{title=Dica}
A versão do NocoBase precisa ser v1.4.0-beta ou superior.
:::

Esta opção pode ser usada para configurar a cor de fundo dos eventos do calendário. Veja como usá-la:

1.  A **coleção** de dados do calendário precisa ter um campo do tipo **Seleção Única (Single select)** ou **Grupo de Rádio (Radio group)**, e este campo precisa estar configurado com cores.
2.  Em seguida, volte para a interface de configuração do bloco de calendário e selecione o campo que você acabou de configurar com cores no **Campo de Cor de Fundo**.
3.  Por fim, você pode tentar selecionar uma cor para um evento do calendário e clicar em enviar. Você verá que a cor foi aplicada.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Dia de Início da Semana

> Suportado na versão v1.7.7 e superior

O bloco de calendário permite que você defina o dia de início da semana, podendo escolher **Domingo** ou **Segunda-feira** como o primeiro dia da semana.
O dia de início padrão é **Segunda-feira**, facilitando para os usuários ajustarem a exibição do calendário de acordo com os hábitos regionais para uma melhor experiência de uso.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Configurar Ações

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hoje

O botão "Hoje" no Bloco de Calendário oferece uma navegação rápida, permitindo que você retorne instantaneamente à data atual após explorar outras datas.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Alternar Visualização

A visualização padrão é definida como Mês.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)