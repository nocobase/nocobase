---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação: SAML 2.0

## Introdução

O plugin Autenticação: SAML 2.0 segue o padrão do protocolo SAML 2.0 (Security Assertion Markup Language 2.0), permitindo que os usuários façam login no NocoBase usando contas fornecidas por provedores de serviço de identidade (IdP) de terceiros.

## Ativar o Plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Adicionar Autenticação SAML

Acesse a página de gerenciamento de plugins de autenticação de usuário.

![](https://static-docs.nocobase.com/202411130004459.png)

Adicionar - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Configuração

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - Fornecido pelo IdP, utilizado para o login único (SSO).
- Certificado Público - Fornecido pelo IdP.
- ID da Entidade (IdP Issuer) - Opcional, fornecido pelo IdP.
- HTTP - Se sua aplicação NocoBase utiliza o protocolo HTTP, marque esta opção.
- Usar este campo para vincular o usuário - Este campo é usado para corresponder e vincular a usuários existentes. Você pode escolher e-mail ou nome de usuário; o padrão é e-mail. As informações do usuário fornecidas pelo IdP precisam conter o campo `email` ou `username`.
- Cadastrar automaticamente quando o usuário não existir - Define se um novo usuário deve ser criado automaticamente quando nenhum usuário existente correspondente for encontrado.
- Uso - `SP Issuer / EntityID` e `ACS URL` são usados para copiar e preencher a configuração correspondente no IdP.

## Mapeamento de Campos

O mapeamento de campos precisa ser configurado na plataforma de configuração do IdP. Você pode consultar o [exemplo](./examples/google.md).

Os campos disponíveis para mapeamento no NocoBase são:

- email (obrigatório)
- phone (válido apenas para IdPs que suportam `phone` em seu escopo, como Alibaba Cloud e Feishu)
- nickname
- username
- firstName
- lastName

`nameID` é transportado pelo protocolo SAML e não precisa ser mapeado; ele será salvo como um identificador de usuário único.
A prioridade da regra de uso do apelido para novos usuários é: `nickname` > `firstName lastName` > `username` > `nameID`
Atualmente, o mapeamento de organização e função do usuário não é suportado.

## Login

Acesse a página de login e clique no botão abaixo do formulário de login para iniciar o login de terceiros.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)