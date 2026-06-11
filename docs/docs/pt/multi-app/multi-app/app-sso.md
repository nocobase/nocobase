---
pkg: '@nocobase/plugin-app-supervisor'
title: 'SSO de aplicações'
description: 'SSO de aplicações em multiaplicação: login automático em subaplicações a partir da aplicação principal ou do seletor, com mapeamento por nome de usuário e cadastro automático.'
keywords: 'multiaplicação,SSO de aplicações,login automático,seletor de aplicações,subaplicação,NocoBase'
---

# SSO de aplicações

O SSO de aplicações simplifica o login quando usuários entram em subaplicações em um cenário multiaplicação.

Depois de ativado, quando um usuário entra em uma subaplicação pela entrada da aplicação principal ou alterna entre subaplicações, o sistema tenta fazer login automaticamente na subaplicação de destino como o usuário atual. O usuário não precisa informar conta e senha repetidamente em cada subaplicação.

## Casos de uso

O SSO de aplicações é adequado para:

- Usar a aplicação principal como entrada unificada para várias subaplicações de negócio
- Dividir um sistema em várias subaplicações mantendo uma experiência de login contínua
- Alternar frequentemente entre várias subaplicações
- Mapear contas entre subaplicações pelo mesmo nome de usuário

## Ativar SSO

Vá para "App Supervisor", crie ou edite uma subaplicação e ative "SSO de aplicações" em "Configuração de autenticação".

Depois disso, a subaplicação pode acionar login automático pela entrada da aplicação principal ou pelo seletor.

> Após alterar a configuração de autenticação, normalmente é necessário reiniciar a subaplicação.

![](https://static-docs.nocobase.com/202605271406542.png)

## Cadastro automático

Se o usuário correspondente não existir na subaplicação de destino, você pode ativar "Cadastrar automaticamente quando o usuário não existir".

Depois de ativado, no primeiro acesso via SSO, o sistema cria um usuário básico na subaplicação com base nas informações da aplicação principal.

O mapeamento é principalmente pelo nome de usuário:

- Se o nome for igual na aplicação principal e na subaplicação, o usuário correspondente será conectado
- Se o nome não existir na subaplicação, o usuário só será criado com cadastro automático ativado
- Caso contrário, o administrador deve criar o usuário previamente na subaplicação

Papéis e permissões após a criação são definidos pela própria configuração da subaplicação.

## Entradas que acionam login automático

O SSO é acionado principalmente por:

- Entrada em uma subaplicação pela aplicação principal
- Entrada pelo seletor no canto superior esquerdo
- Alternância de uma subaplicação para outra

Acesso direto à página de login ou ao endereço próprio da subaplicação não força o estado de login da aplicação principal. Assim, a subaplicação mantém seus próprios métodos de login.

## Perguntas frequentes

### Ativei, mas o login automático não ocorre?

Verifique:

- Se o SSO está ativado para a subaplicação
- Se a subaplicação foi reiniciada
- Se o usuário entrou pela aplicação principal ou pelo seletor
- Se existe um usuário com o mesmo nome na subaplicação
- Se o usuário não existe, se o cadastro automático está ativado

### Por que o acesso direto não faz login automaticamente?

Esse é o comportamento esperado. Ao acessar diretamente, a subaplicação pode precisar usar seu próprio método de login.
