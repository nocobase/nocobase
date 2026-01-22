:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Projektstruktur

Oavsett om ni klonar källkoden från Git eller initierar ett projekt med `create-nocobase-app`, är det NocoBase-projekt som skapas i grunden ett monorepo baserat på **Yarn Workspace**.

## Översikt över toppnivåkataloger

Följande exempel använder `my-nocobase-app/` som projektkatalog. Det kan finnas små skillnader beroende på miljö:

```bash
my-nocobase-app/
├── packages/              # Projektets källkod
│   ├── plugins/           # Plugin-källkod under utveckling (okompilerad)
├── storage/               # Körningsdata och dynamiskt genererat innehåll
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Kompilerade plugin (inklusive de som laddats upp via gränssnittet)
│   └── tar/               # Plugin-paketfiler (.tar)
├── scripts/               # Verktygsskript och kommandon
├── .env*                  # Miljövariabelkonfigurationer för olika miljöer
├── lerna.json             # Lerna workspace-konfiguration
├── package.json           # Rotpaketkonfiguration, deklarerar workspace och skript
├── tsconfig*.json         # TypeScript-konfigurationer (frontend, backend, sökvägskartläggning)
├── vitest.config.mts      # Vitest enhetstestkonfiguration
└── playwright.config.ts   # Playwright E2E-testkonfiguration
```

## Beskrivning av underkatalogen packages/

Katalogen `packages/` innehåller NocoBases kärnmoduler och utbyggbara paket. Innehållet beror på projektets ursprung:

- **Projekt skapade med `create-nocobase-app`**: Innehåller som standard endast `packages/plugins/`, som används för att lagra källkoden för anpassade plugin. Varje underkatalog är ett oberoende npm-paket.
- **Klonade officiella källkodsrepositoryn**: Här ser ni fler underkataloger, som `core/`, `plugins/`, `pro-plugins/`, `presets/` med flera. Dessa motsvarar ramverkets kärna, inbyggda plugin och officiella förinställda lösningar.

Oavsett vilket är `packages/plugins` den primära platsen för att utveckla och felsöka anpassade plugin.

## storage/ Körningskatalog

`storage/` lagrar data som genereras under körning samt byggresultat. Vanliga underkataloger beskrivs nedan:

- `apps/`: Konfiguration och cache för scenarier med flera applikationer.
- `logs/`: Körningsloggar och felsökningsutdata.
- `uploads/`: Användaruppladdade filer och mediaresurser.
- `plugins/`: Paketerade plugin som laddats upp via gränssnittet eller importerats via CLI.
- `tar/`: Komprimerade plugin-paket som genereras efter att ha kört `yarn build <plugin> --tar`.

> Det rekommenderas vanligtvis att lägga till katalogen `storage` i `.gitignore` och hantera den separat vid driftsättning eller säkerhetskopiering.

## Miljökonfiguration och projektskript

- `.env`, `.env.test`, `.env.e2e`: Används för lokal körning, enhets-/integrationstester respektive end-to-end-tester.
- `scripts/`: Innehåller vanliga underhållsskript (som databasinitiering, verktyg för release med mera).

## Plugin-laddningsvägar och prioritet

Plugin kan finnas på flera platser. När NocoBase startar laddas de i följande prioritetsordning:

1. Källkodsversionen i `packages/plugins` (för lokal utveckling och felsökning).
2. Den paketerade versionen i `storage/plugins` (uppladdad via gränssnittet eller importerad via CLI).
3. Beroendepaket i `node_modules` (installerade via npm/yarn eller inbyggda i ramverket).

När ett plugin med samma namn finns både i källkatalogen och i den paketerade katalogen, kommer systemet att prioritera att ladda källkodsversionen, vilket underlättar lokala överskuggningar och felsökning.

## Plugin-katalogmall

Skapa ett plugin med CLI:

```bash
yarn pm create @my-project/plugin-hello
```

Den genererade katalogstrukturen är följande:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Byggresultat (genereras vid behov)
├── src/                     # Källkodskatalog
│   ├── client/              # Frontendkod (block, sidor, modeller, etc.)
│   │   ├── plugin.ts        # Klient-sidans huvudklass för plugin
│   │   └── index.ts         # Klient-sidans ingångspunkt
│   ├── locale/              # Flerspråkiga resurser (delas mellan frontend och backend)
│   ├── swagger/             # OpenAPI/Swagger-dokumentation
│   └── server/              # Server-sidans kod
│       ├── collections/     # Samlingsdefinitioner
│       ├── commands/        # Anpassade kommandon
│       ├── migrations/      # Databasmigreringsskript
│       ├── plugin.ts        # Server-sidans huvudklass för plugin
│       └── index.ts         # Server-sidans ingångspunkt
├── index.ts                 # Export för frontend- och backend-brygga
├── client.d.ts              # Frontend-typdeklarationer
├── client.js                # Frontend-byggartefakt
├── server.d.ts              # Server-sidans typdeklarationer
├── server.js                # Server-sidans byggartefakt
├── .npmignore               # Konfiguration för att ignorera vid publicering
└── package.json
```

> När byggprocessen är klar laddas katalogen `dist/` samt filerna `client.js` och `server.js` när pluginet aktiveras.  
> Under utvecklingsfasen behöver ni endast ändra i katalogen `src/`. Innan publicering kör ni `yarn build <plugin>` eller `yarn build <plugin> --tar`.