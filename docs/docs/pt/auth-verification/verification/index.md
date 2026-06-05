---
pkg: "@nocobase/plugin-verification"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



pkg: '@nocobase/plugin-verification'
---

# Verificação

:::info{title=Nota}
A partir da versão `1.6.0-alpha.30`, o recurso original de **código de verificação** foi atualizado para **Gerenciamento de Verificação**. Agora, você pode gerenciar e integrar diferentes métodos de verificação de identidade do usuário. Uma vez que os usuários vinculam o método de verificação correspondente, eles podem realizar a verificação de identidade sempre que for necessário. Este recurso está planejado para ter suporte estável a partir da versão `1.7.0`.
:::



## Introdução

**O Centro de Gerenciamento de Verificação permite gerenciar e integrar diversos métodos de verificação de identidade do usuário.** Por exemplo:

- Código de Verificação por SMS – Fornecido por padrão pelo **plugin** de verificação. Consulte: [Verificação: SMS](./sms)
- Autenticador TOTP – Consulte: [Verificação: Autenticador TOTP](../verification-totp/)

Desenvolvedores também podem estender outros tipos de verificação através de **plugins**. Consulte: [Estendendo Tipos de Verificação](./dev/type)

**Os usuários podem realizar a verificação de identidade quando necessário, após vincular o método de verificação correspondente.** Por exemplo:

- Login com Código de Verificação por SMS – Consulte: [Autenticação: SMS](./sms)
- Autenticação de Dois Fatores (2FA) – Consulte: [Autenticação de Dois Fatores (2FA)](../2fa)
- Verificação Secundária para Operações de Risco – Suporte futuro

Desenvolvedores também podem integrar a verificação de identidade em outros cenários necessários, estendendo os **plugins**. Consulte: [Estendendo Cenários de Verificação](./dev/scene)

**Diferenças e Relações entre o Módulo de Verificação e o Módulo de Autenticação de Usuário:** O Módulo de Autenticação de Usuário é o principal responsável pela autenticação de identidade em cenários de login, onde processos como login por SMS e autenticação de dois fatores dependem dos verificadores fornecidos pelo Módulo de Verificação. Por outro lado, o Módulo de Verificação lida com a verificação de identidade para diversas operações de alto risco, sendo o login do usuário um desses cenários.

![](https://static-docs.nocobase.com/202502262315404.png)

![](https://static-docs.nocobase.com/202502262315966.png)