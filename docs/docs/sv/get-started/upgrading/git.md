:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Uppgradera en Git-källkodsinstallation

:::warning Förberedelser inför uppgraderingen

- Se till att säkerhetskopiera din databas först.
- Stoppa den NocoBase-instans som körs (`Ctrl + C`).

:::

## 1. Växla till NocoBase-projektkatalogen

```bash
cd my-nocobase-app
```

## 2. Hämta den senaste koden

```bash
git pull
```

## 3. Radera cache och gamla beroenden (valfritt)

Om den vanliga uppgraderingsprocessen misslyckas kan du försöka rensa cachen och beroendena och sedan ladda ner dem igen.

```bash
# Rensa NocoBase-cachen
yarn nocobase clean
# Radera beroenden
yarn rimraf -rf node_modules # motsvarar rm -rf node_modules
```

## 4. Uppdatera beroenden

📢 På grund av faktorer som nätverksmiljö och systemkonfiguration kan detta steg ta mer än tio minuter.

```bash
yarn install
```

## 5. Kör uppgraderingskommandot

```bash
yarn nocobase upgrade
```

## 6. Starta NocoBase

```bash
yarn dev
```

:::tip Tips för produktionsmiljö

Det rekommenderas inte att driftsätta en NocoBase-installation från källkod direkt i en produktionsmiljö (för produktionsmiljöer, se [Driftsättning i produktion](../deployment/production.md)).

:::

## 7. Uppgradera tredjeparts-plugins

Se [Installera och uppgradera plugins](../install-upgrade-plugins.mdx)