---
pkg: '@nocobase/plugin-api-keys'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# API-nycklar

## Introduktion

## Användningsinstruktioner

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Lägg till API-nyckel

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Viktigt att tänka på**

- När ni lägger till en API-nyckel kopplas den till er användare och ärver era roller.
- Se till att ni har konfigurerat miljövariabeln `APP_KEY` och att den hålls konfidentiell. Om `APP_KEY` ändras kommer alla tillagda API-nycklar att bli ogiltiga.

### Så här konfigurerar ni APP_KEY

För Docker-versionen, ändra filen `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Om ni har installerat via källkod eller `create-nocobase-app`, kan ni direkt ändra `APP_KEY` i `.env`-filen:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```