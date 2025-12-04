:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Projectstructuur

Of u nu de broncode kloont via Git of een project initialiseert met `create-nocobase-app`, het gegenereerde NocoBase-project is in essentie een monorepo gebaseerd op **Yarn Workspace**.

## Overzicht van de hoofdmappen

Het volgende voorbeeld gebruikt `my-nocobase-app/` als projectmap. Er kunnen kleine verschillen zijn in verschillende omgevingen:

```bash
my-nocobase-app/
├── packages/              # Broncode van het project
│   ├── plugins/           # Plugins in ontwikkeling (ongecompileerd)
├── storage/               # Runtimegegevens en dynamisch gegenereerde inhoud
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Gecompileerde plugins (inclusief die via de UI zijn geüpload)
│   └── tar/               # Plugin-pakketbestanden (.tar)
├── scripts/               # Hulpscripts en toolcommando's
├── .env*                  # Omgevingsvariabele configuraties voor verschillende omgevingen
├── lerna.json             # Lerna workspace configuratie
├── package.json           # Root-pakketconfiguratie, declareert workspace en scripts
├── tsconfig*.json         # TypeScript-configuraties (frontend, backend, padtoewijzing)
├── vitest.config.mts      # Vitest unit test configuratie
└── playwright.config.ts   # Playwright E2E test configuratie
```

## Beschrijving van de `packages/` submap

De `packages/` map bevat de kernmodules en uitbreidbare pakketten van NocoBase. De inhoud is afhankelijk van de projectbron:

- **Projecten gemaakt via `create-nocobase-app`**: Standaard bevat deze alleen `packages/plugins/`, bedoeld voor het opslaan van de broncode van aangepaste **plugins**. Elke submap is een onafhankelijk npm-pakket.
- **Gekloonde officiële bronrepository**: U zult meer submappen zien, zoals `core/`, `plugins/`, `pro-plugins/`, `presets/`, enz., die respectievelijk overeenkomen met de frameworkkern, ingebouwde **plugins** en officiële vooraf ingestelde oplossingen.

In beide gevallen is `packages/plugins` de belangrijkste locatie voor het ontwikkelen en debuggen van aangepaste **plugins**.

## `storage/` Runtime map

`storage/` slaat runtime-gegenereerde gegevens en build-outputs op. Hieronder vindt u een beschrijving van de meest voorkomende submappen:

- `apps/`: Configuratie en cache voor scenario's met meerdere applicaties.
- `logs/`: Runtime logs en debug-output.
- `uploads/`: Door gebruikers geüploade bestanden en mediaresources.
- `plugins/`: Verpakte **plugins** die via de UI zijn geüpload of via de CLI zijn geïmporteerd.
- `tar/`: Gecomprimeerde **plugin**-pakketten die zijn gegenereerd na het uitvoeren van `yarn build <plugin> --tar`.

> Het wordt meestal aanbevolen om de `storage` map toe te voegen aan `.gitignore` en deze apart te behandelen tijdens implementatie of back-up.

## Omgevingsconfiguratie en projectscripts

- `.env`, `.env.test`, `.env.e2e`: Worden respectievelijk gebruikt voor lokaal draaien, unit-/integratietesten en end-to-end testen.
- `scripts/`: Bevat veelgebruikte onderhoudsscripts (zoals database-initialisatie, hulpprogramma's voor releases, enz.).

## Laadpaden en prioriteit van **plugins**

**Plugins** kunnen op meerdere locaties aanwezig zijn. NocoBase laadt ze bij het opstarten in de volgende prioriteitsvolgorde:

1. De broncodeversie in `packages/plugins` (voor lokale ontwikkeling en debugging).
2. De verpakte versie in `storage/plugins` (geüpload via de UI of geïmporteerd via de CLI).
3. Afhankelijkheidspakketten in `node_modules` (geïnstalleerd via npm/yarn of ingebouwd in het framework).

Wanneer een **plugin** met dezelfde naam zowel in de bronmap als in de verpakte map bestaat, geeft het systeem prioriteit aan het laden van de bronversie, wat lokale overschrijvingen en debugging vergemakkelijkt.

## **Plugin** map sjabloon

Maak een **plugin** met behulp van de CLI:

```bash
yarn pm create @my-project/plugin-hello
```

De gegenereerde mapstructuur is als volgt:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Build-output (wordt indien nodig gegenereerd)
├── src/                     # Broncode map
│   ├── client/              # Frontend-code (blokken, pagina's, modellen, enz.)
│   │   ├── plugin.ts        # Hoofdklasse van de client-side plugin
│   │   └── index.ts         # Client-side ingangspunt
│   ├── locale/              # Meertalige resources (gedeeld tussen frontend en backend)
│   ├── swagger/             # OpenAPI/Swagger documentatie
│   └── server/              # Server-side code
│       ├── collections/     # Collectie definities
│       ├── commands/        # Aangepaste commando's
│       ├── migrations/      # Database migratiescripts
│       ├── plugin.ts        # Hoofdklasse van de server-side plugin
│       └── index.ts         # Server-side ingangspunt
├── index.ts                 # Frontend- en backend-brugexport
├── client.d.ts              # Frontend type declaraties
├── client.js                # Frontend build-artefact
├── server.d.ts              # Server-side type declaraties
├── server.js                # Server-side build-artefact
├── .npmignore               # Publicatie negeer configuratie
└── package.json
```

> Nadat de build is voltooid, worden de `dist/` map en de `client.js`, `server.js` bestanden geladen wanneer de **plugin** wordt ingeschakeld.
> Tijdens de ontwikkeling hoeft u alleen de `src/` map aan te passen. Voordat u publiceert, voert u `yarn build <plugin>` of `yarn build <plugin> --tar` uit.