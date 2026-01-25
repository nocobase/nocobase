:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Upgraden van een Git-broninstallatie

:::warning Voorbereidingen vóór de upgrade

- Zorg ervoor dat u eerst een back-up van uw database maakt.
- Stop de actieve NocoBase-instantie (`Ctrl + C`).

:::

## 1. Navigeer naar de NocoBase-projectmap

```bash
cd my-nocobase-app
```

## 2. Haal de nieuwste code op

```bash
git pull
```

## 3. Verwijder cache en oude afhankelijkheden (optioneel)

Mocht het normale upgradeproces mislukken, dan kunt u proberen de cache en afhankelijkheden te wissen en deze vervolgens opnieuw te downloaden.

```bash
# Wis de NocoBase-cache
yarn nocobase clean
# Verwijder afhankelijkheden
yarn rimraf -rf node_modules # gelijk aan rm -rf node_modules
```

## 4. Werk afhankelijkheden bij

📢 Vanwege factoren zoals de netwerkomgeving en systeemconfiguratie kan deze stap meer dan tien minuten duren.

```bash
yarn install
```

## 5. Voer de upgradeopdracht uit

```bash
yarn nocobase upgrade
```

## 6. Start NocoBase

```bash
yarn dev
```

:::tip Tip voor de productieomgeving

Het wordt afgeraden om een NocoBase-installatie vanuit de broncode direct in een productieomgeving te implementeren (raadpleeg voor productieomgevingen [Implementatie in productie](../deployment/production.md)).

:::

## 7. Upgraden van externe plugins

Raadpleeg [Plugins installeren en upgraden](../install-upgrade-plugins.mdx)