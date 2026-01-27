:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt över pluginutveckling

NocoBase använder en **mikrokärnarkitektur**, där kärnan endast ansvarar för schemaläggning av pluginens livscykel, beroendehantering och inkapsling av grundläggande funktioner. Alla affärsfunktioner tillhandahålls som plugin. Därför är det första steget för att anpassa NocoBase att förstå pluginens organisationsstruktur, livscykel och hanteringssätt.

## Kärnkoncept

- **Plug and Play**: Plugin kan installeras, aktiveras eller inaktiveras vid behov, vilket möjliggör flexibel kombination av affärsfunktioner utan att behöva ändra kod.
- **Full-stack-integration**: Plugin inkluderar vanligtvis både server- och klientimplementationer, vilket säkerställer konsekvens mellan datalogik och gränssnittsinteraktioner.

## Grundläggande plugin-struktur

Varje plugin är ett oberoende npm-paket och innehåller vanligtvis följande katalogstruktur:

```bash
plugin-hello/
├─ package.json          # Pluginets namn, beroenden och NocoBase plugin-metadata
├─ client.js             # Frontend-kompilat, laddas vid körning
├─ server.js             # Server-kompilat, laddas vid körning
├─ src/
│  ├─ client/            # Klientkällkod, kan registrera block, åtgärder, fält, etc.
│  └─ server/            # Serverkällkod, kan registrera resurser, händelser, kommandon, etc.
```

## Katalogkonventioner och laddningsordning

NocoBase skannar som standard följande kataloger för att ladda plugin:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugin under utveckling (högst prioritet)
└── storage/
    └── plugins/          # Kompilerade plugin, t.ex. uppladdade eller publicerade plugin
```

- `packages/plugins`: Används för lokal pluginutveckling och stöder realtidskompilering och felsökning.
- `storage/plugins`: Här lagras kompilerade plugin, till exempel kommersiella versioner eller tredjeparts-plugin.

## Pluginens livscykel och tillstånd

Ett plugin går vanligtvis igenom följande steg:

1. **Skapa (create)**: Skapa en plugin-mall via CLI.
2. **Hämta (pull)**: Ladda ner plugin-paketet lokalt, men det har ännu inte skrivits till databasen.
3. **Aktivera (enable)**: Vid första aktiveringen utförs "registrering + initialisering"; efterföljande aktiveringar laddar endast logiken.
4. **Inaktivera (disable)**: Stoppa pluginet från att köras.
5. **Ta bort (remove)**: Ta bort pluginet helt från systemet.

:::tip

- `pull` laddar endast ner plugin-paketet; den faktiska installationsprocessen triggas av den första `enable`.
- Om ett plugin endast har `pull`ats men inte aktiverats, kommer det inte att laddas.

:::

### CLI-kommandoexempel

```bash
# 1. Skapa plugin-skelett
yarn pm create @my-project/plugin-hello

# 2. Hämta plugin-paket (ladda ner eller länka)
yarn pm pull @my-project/plugin-hello

# 3. Aktivera plugin (installeras automatiskt vid första aktiveringen)
yarn pm enable @my-project/plugin-hello

# 4. Inaktivera plugin
yarn pm disable @my-project/plugin-hello

# 5. Ta bort plugin
yarn pm remove @my-project/plugin-hello
```

## Gränssnitt för pluginhantering

Öppna pluginhanteraren i webbläsaren för att intuitivt visa och hantera plugin:

**Standard-URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Pluginhanteraren](https://static-docs.nocobase.com/20251030195350.png)