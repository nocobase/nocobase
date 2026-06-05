---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::


# Autenticação de Dois Fatores (2FA)

## Introdução

A Autenticação de Dois Fatores (2FA) é uma medida de segurança adicional utilizada ao fazer login em um aplicativo. Quando o 2FA está ativado, além da sua senha, você precisará fornecer outra forma de autenticação, como um código OTP ou TOTP.

:::info{title=Observação}
Atualmente, o processo de 2FA se aplica apenas a logins que utilizam senha. Se o seu aplicativo tiver SSO ou outros métodos de autenticação ativados, por favor, utilize a autenticação multifator (MFA) fornecida pelo IdP (Provedor de Identidade) correspondente.
:::

## Ativar o Plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Configuração do Administrador

Após ativar o plugin, você encontrará uma subpágina de configuração de 2FA na página de gerenciamento de autenticadores.

Você, como administrador, deve marcar a opção "Ativar autenticação de dois fatores (2FA) para todos os usuários" e selecionar um tipo de autenticador disponível para vincular. Caso não haja autenticadores disponíveis, você precisará criar um novo na página de gerenciamento de verificação. Consulte [Verificação](../verification/index.md) para mais detalhes.

![](https://static-docs.nocobase.com/202502282109802.png)

## Login do Usuário

Com o 2FA ativado, ao fazer login com sua senha, você entrará no processo de verificação de dois fatores.

Se você ainda não tiver vinculado nenhum dos autenticadores especificados, será solicitado que você vincule um. Após o vínculo ser bem-sucedido, você poderá acessar o aplicativo.

![](https://static-docs.nocobase.com/202502282110829.png)

Se você já tiver vinculado um dos autenticadores especificados, será solicitado que você verifique sua identidade usando o autenticador vinculado. Após a verificação bem-sucedida, você poderá acessar o aplicativo.

![](https://static-docs.nocobase.com/202502282110148.png)

Após fazer login, você poderá vincular autenticadores adicionais na página de gerenciamento de verificação, localizada em seu centro pessoal.

![](https://static-docs.nocobase.com/202502282110024.png)