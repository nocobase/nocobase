---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Verificação: Autenticador TOTP

## Introdução

O autenticador TOTP permite que os usuários vinculem qualquer autenticador que esteja em conformidade com a especificação TOTP (Time-based One-Time Password) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>) e realizem a verificação de identidade usando uma senha de uso único baseada em tempo (TOTP).

## Configuração do Administrador

Acesse a página de Gerenciamento de Verificação.

![](https://static-docs.nocobase.com/202502271726791.png)

Adicionar - Autenticador TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Além de um identificador único e um título, o autenticador TOTP não requer nenhuma configuração adicional.

![](https://static-docs.nocobase.com/202502271746034.png)

## Vinculação de Usuário

Após adicionar o autenticador, os usuários podem vincular o autenticador TOTP na área de gerenciamento de verificação do seu perfil.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
O **plugin** não oferece, no momento, um mecanismo de código de recuperação. Após vincular o autenticador TOTP, aconselhamos que você o mantenha em segurança. Caso você perca o autenticador acidentalmente, pode usar um método de verificação alternativo para confirmar sua identidade, desvinculá-lo e, em seguida, vinculá-lo novamente.
:::

## Desvinculação de Usuário

Para desvincular o autenticador, é necessário realizar a verificação usando o método de verificação já vinculado.

![](https://static-docs.nocobase.com/202502282103205.png)