---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Bloco de aplicações e seletor'
description: 'Bloco de aplicações e seletor em multiaplicação: exibir entradas de subaplicações no frontend, configurar ícones, visibilidade e o seletor no canto superior esquerdo.'
keywords: 'multiaplicação,bloco de aplicações,seletor de aplicações,entrada de subaplicação,NocoBase'
---

# Bloco de aplicações e seletor

Além de gerenciar subaplicações no painel administrativo, a multiaplicação também pode oferecer entradas de aplicações no frontend. As formas comuns incluem:

- Adicionar um bloco "Applications" em uma página para exibir as subaplicações acessíveis
- Ativar o seletor de aplicações no canto superior esquerdo para alternar entre a aplicação principal e as subaplicações

## Bloco de aplicações

![](https://static-docs.nocobase.com/202605271350840.png)

O bloco "Applications" exibe uma lista de subaplicações em uma página frontend. Ele é adequado para criar um portal simples de aplicações, permitindo que usuários entrem em diferentes aplicações de negócio a partir de uma única página.

Cada aplicação exibe:

- Ícone da aplicação
- Nome da aplicação
- Entrada de acesso

Ao clicar, a subaplicação correspondente é aberta.

### Configurar ícone

Ao criar ou editar uma aplicação no App Supervisor, você pode enviar um ícone em "Configuração de exibição".

Se nenhum ícone for enviado, o sistema gera um ícone padrão a partir da primeira letra do nome da aplicação.

![](https://static-docs.nocobase.com/202605271402603.png)

### Ocultar aplicações

Se uma aplicação não deve aparecer no bloco "Applications", marque "Ocultar no bloco de aplicações" na configuração da aplicação.

Depois de oculta:

- A aplicação ainda pode ser gerenciada no painel administrativo
- A aplicação ainda pode ser aberta por sua URL direta
- Ela apenas deixa de aparecer no bloco "Applications"

![](https://static-docs.nocobase.com/202605271403980.png)

## Seletor de aplicações

![](https://static-docs.nocobase.com/202605271403304.png)

O seletor de aplicações aparece no canto superior esquerdo e serve para alternar rapidamente para outras aplicações.

Para exibir uma aplicação no seletor, ative "Mostrar no seletor de aplicações" na configuração da aplicação.

Depois de ativado, os usuários veem o seletor na aplicação principal ou nas subaplicações e podem entrar em outras aplicações pela lista.

![](https://static-docs.nocobase.com/202605271404322.png)

### Forma de abertura

O seletor abre aplicações da seguinte forma:

- Da aplicação principal para uma subaplicação: abre em uma nova aba
- De uma subaplicação para outra: abre na aba atual

Isso evita interromper o trabalho na aplicação principal e torna a alternância entre subaplicações mais natural.
