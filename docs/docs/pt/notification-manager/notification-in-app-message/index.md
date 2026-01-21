---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Notificação: Mensagem no Aplicativo

## Introdução

Permite que os usuários recebam notificações de mensagens em tempo real diretamente dentro do aplicativo NocoBase.

## Instalação

Este plugin é integrado, então não é necessária nenhuma instalação adicional.

## Adicionando um Canal de Mensagem no Aplicativo

Vá para Gerenciamento de Notificações, clique no botão Adicionar e selecione Mensagem no Aplicativo.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Insira o nome e a descrição do canal e, em seguida, clique em Enviar.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

O novo canal aparecerá agora na lista.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Exemplo de Caso de Uso

Para ajudar você a entender melhor como usar as mensagens no aplicativo, aqui está um exemplo de "Acompanhamento de Leads de Marketing".

Imagine que sua equipe esteja realizando uma grande campanha de marketing com o objetivo de acompanhar as respostas e necessidades de clientes em potencial. Usando as mensagens no aplicativo, você pode:

**Criar um Canal de Notificação**: Primeiro, em Gerenciamento de Notificações, configure um canal de mensagem no aplicativo chamado "Marketing Clue" para garantir que os membros da equipe possam identificar claramente sua finalidade.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Configurar um Fluxo de Trabalho**: Crie um fluxo de trabalho que acione automaticamente uma notificação quando um novo lead de marketing for gerado. Você pode adicionar um nó de notificação ao fluxo de trabalho, selecionar o canal "Marketing Clue" que você criou e configurar o conteúdo da mensagem conforme necessário. Por exemplo:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Receber Notificações em Tempo Real**: Assim que o fluxo de trabalho for acionado, todo o pessoal relevante receberá notificações em tempo real, garantindo que a equipe possa responder e agir rapidamente.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Gerenciamento e Rastreamento de Mensagens**: As mensagens no aplicativo são agrupadas pelo nome do canal. Você pode filtrar as mensagens pelo status de lidas e não lidas para visualizar rapidamente informações importantes. Clicar no botão "Ver" redirecionará você para a página do link configurado para ações adicionais.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)