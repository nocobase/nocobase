---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação: DingTalk

## Introdução

O **plugin** Autenticação: DingTalk permite que você faça login no NocoBase usando sua conta DingTalk.

## Ativar o Plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Solicitar Permissões de API no Console de Desenvolvedores do DingTalk

Consulte <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Plataforma Aberta DingTalk - Implementar Login em Sites de Terceiros</a> para criar um aplicativo.

Acesse o console de gerenciamento do aplicativo e ative as permissões "Informações de Telefone Pessoal" e "Permissão de Leitura de Informações Pessoais da Agenda".

![](https://static-docs.nocobase.com/202406120006620.png)

## Obter Credenciais no Console de Desenvolvedores do DingTalk

Copie o Client ID e o Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Adicionar Autenticação DingTalk no NocoBase

Acesse a página de gerenciamento de **plugins** de autenticação de usuário.

![](https://static-docs.nocobase.com/202406112348051.png)

Adicionar - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Configuração

![](https://static-docs.nocobase.com/202406120016896.png)

- **Cadastrar automaticamente quando o usuário não existe** - Define se um novo usuário deve ser criado automaticamente caso o número de telefone não corresponda a nenhum usuário existente.
- **Client ID e Client Secret** - Preencha com as informações que você copiou na etapa anterior.
- **Redirect URL** - A URL de retorno (Callback URL). Copie-a e siga para a próxima etapa.

## Configurar a URL de Retorno no Console de Desenvolvedores do DingTalk

Cole a URL de retorno que você copiou no Console de Desenvolvedores do DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Login

Acesse a página de login e clique no botão abaixo do formulário para iniciar o login de terceiros.

![](https://static-docs.nocobase.com/202406120014539.png)