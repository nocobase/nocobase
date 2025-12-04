:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Uppgradera en `create-nocobase-app`-installation

:::warning Förberedelser inför uppgraderingen

- Se till att säkerhetskopiera databasen först
- Stoppa den NocoBase-instans som körs

:::

## 1. Stoppa den NocoBase-instans som körs

Om det inte är en bakgrundsprocess stoppar ni den med `Ctrl + C`. I en produktionsmiljö kör ni kommandot `pm2-stop` för att stoppa den.

```bash
yarn nocobase pm2-stop
```

## 2. Kör uppgraderingskommandot

Kör helt enkelt uppgraderingskommandot `yarn nocobase upgrade`.

```bash
# Växla till rätt katalog
cd my-nocobase-app
# Kör uppgraderingskommandot
yarn nocobase upgrade
# Starta
yarn dev
```

### Uppgradera till en specifik version

Ändra filen `package.json` i projektets rotkatalog och uppdatera versionsnumren för `@nocobase/cli` och `@nocobase/devtools` (ni kan bara uppgradera, inte nedgradera). Till exempel:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Kör sedan uppgraderingskommandot

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```