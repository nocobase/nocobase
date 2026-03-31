---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação: CAS

## Introdução

O plugin de Autenticação: CAS segue o padrão do protocolo CAS (Central Authentication Service), permitindo que os usuários façam login no NocoBase usando contas fornecidas por provedores de serviço de autenticação de identidade (IdP) de terceiros.

## Instalação

## Manual do Usuário

### Ativar Plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Adicionar Autenticação CAS

Acesse a página de gerenciamento de autenticação de usuário

http://localhost:13000/admin/settings/auth/authenticators

Adicione o método de autenticação CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Configure o CAS e ative-o

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Acesse a Página de Login

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)