:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# API-nyckel

## Introduktion

## Installation

## Användningsinstruktioner

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Lägg till API-nyckel

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Viktigt att tänka på**

- Den API-nyckel ni lägger till tillhör den aktuella användaren och ärver dennes roll.
- Se till att miljövariabeln `APP_KEY` är konfigurerad och hålls konfidentiell. Om `APP_KEY` ändras kommer alla tidigare tillagda API-nycklar att bli ogiltiga.

### Så här konfigurerar du APP_KEY

För Docker-versionen, ändra filen `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

För installation via källkod eller `create-nocobase-app`, kan ni direkt ändra `APP_KEY` i `.env`-filen:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```