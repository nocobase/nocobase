:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Een create-nocobase-app installatie upgraden

:::warning Voorbereidingen voor de upgrade

- Zorg ervoor dat u eerst een back-up van de database maakt.
- Stop de actieve NocoBase-instantie.

:::

## 1. Stop de actieve NocoBase-instantie

Als het geen achtergrondproces is, stopt u het met `Ctrl + C`. In een productieomgeving voert u het `pm2-stop` commando uit om het te stoppen.

```bash
yarn nocobase pm2-stop
```

## 2. Voer het upgradecommando uit

Voer eenvoudigweg het `yarn nocobase upgrade` commando uit.

```bash
# Ga naar de betreffende map
cd my-nocobase-app
# Voer het upgradecommando uit
yarn nocobase upgrade
# Starten
yarn dev
```

### Upgraden naar een specifieke versie

Wijzig het `package.json` bestand in de hoofdmap van het project en pas de versienummers voor `@nocobase/cli` en `@nocobase/devtools` aan (u kunt alleen upgraden, niet downgraden). Bijvoorbeeld:

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

Voer vervolgens het upgradecommando uit:

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```