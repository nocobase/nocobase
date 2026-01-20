---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Authenticatie: CAS

## Introductie

De Authenticatie: CAS plugin volgt de CAS (Central Authentication Service) protocolstandaard. Dit stelt gebruikers in staat om in te loggen op NocoBase met accounts die worden aangeboden door externe identiteitsaanbieders (IdP's).

## Installatie

## Gebruikershandleiding

### Plugin activeren

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS-authenticatie toevoegen

Ga naar de pagina voor gebruikersauthenticatiebeheer

http://localhost:13000/admin/settings/auth/authenticators

Voeg een CAS-authenticatiemethode toe

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Configureer CAS en activeer deze

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Ga naar de inlogpagina

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)