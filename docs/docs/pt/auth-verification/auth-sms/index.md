---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação por SMS

## Introdução

O plugin de autenticação por SMS permite que os usuários se registrem e façam login no NocoBase usando SMS.

> É necessário usar este plugin em conjunto com a funcionalidade de código de verificação por SMS fornecida pelo plugin [`@nocobase/plugin-verification`](/auth-verification/verification/).

## Adicionar Autenticação por SMS

Acesse a página de gerenciamento de plugins de autenticação de usuário.

![](https://static-docs.nocobase.com/202502282112517.png)

Adicionar - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Configuração da Nova Versão

:::info{title=Dica}
A nova configuração foi introduzida na versão `1.6.0-alpha.30` e está planejada para ter suporte estável a partir da versão `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificador:** Associe um verificador de SMS para enviar códigos de verificação por SMS. Se não houver um verificador disponível, você precisará ir primeiro à página de gerenciamento de Verificação para criar um verificador de SMS.
Veja também:

- [Verificação](../verification/index.md)
- [Verificação: SMS](../verification/sms/index.md)

**Registrar automaticamente quando o usuário não existir** (Sign up automatically when the user does not exist): Essa opção, quando marcada, registrará um novo usuário usando o número de telefone como apelido, caso o número de telefone usado pelo usuário não exista.

## Configuração da Versão Antiga

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

A funcionalidade de autenticação de login por SMS usará o Provedor de código de verificação por SMS configurado e definido como padrão para enviar mensagens de texto.

**Registrar automaticamente quando o usuário não existir** (Sign up automatically when the user does not exist): Essa opção, quando marcada, registrará um novo usuário usando o número de telefone como apelido, caso o número de telefone usado pelo usuário não exista.

## Login

Acesse a página de login para usar.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)