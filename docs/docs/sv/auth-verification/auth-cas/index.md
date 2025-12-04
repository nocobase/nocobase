---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Autentisering: CAS

## Introduktion

Pluginet Autentisering: CAS följer CAS-protokollstandarden (Central Authentication Service) och gör det möjligt för användare att logga in på NocoBase med konton från tredjepartsleverantörer av identitetsautentisering (IdP).

## Installation

## Användarmanual

### Aktivera plugin

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Lägg till CAS-autentisering

Besök sidan för hantering av användarautentisering

http://localhost:13000/admin/settings/auth/authenticators

Lägg till autentiseringsmetoden CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Konfigurera CAS och aktivera

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Besök inloggningssidan

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)