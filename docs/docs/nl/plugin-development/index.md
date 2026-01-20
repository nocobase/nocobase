:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht van **plugin**-ontwikkeling

NocoBase maakt gebruik van een **microkernel-architectuur**. De kern is alleen verantwoordelijk voor het plannen van de levenscyclus van **plugins**, het beheren van afhankelijkheden en het inkapselen van basisfunctionaliteiten. Alle bedrijfsfuncties worden geleverd als **plugins**. Het begrijpen van de organisatiestructuur, levenscyclus en het beheer van **plugins** is daarom de eerste stap in het aanpassen van NocoBase.

## Kernconcepten

- **Plug-and-play**: U kunt **plugins** naar behoefte installeren, inschakelen of uitschakelen, waardoor u bedrijfsfuncties flexibel kunt combineren zonder code te wijzigen.
- **Full-stack integratie**: **Plugins** bevatten doorgaans zowel server-side als client-side implementaties, wat zorgt voor consistentie tussen datalogica en UI-interacties.

## Basisstructuur van een **plugin**

Elke **plugin** is een onafhankelijk npm-pakket en heeft doorgaans de volgende mapstructuur:

```bash
plugin-hello/
├─ package.json          # Naam van de plugin, afhankelijkheden en NocoBase plugin-metadata
├─ client.js             # Frontend build-artefact voor runtime-laden
├─ server.js             # Server-side build-artefact voor runtime-laden
├─ src/
│  ├─ client/            # Client-side broncode, kan blokken, acties, velden, etc. registreren
│  └─ server/            # Server-side broncode, kan resources, events, commando's, etc. registreren
```

## Mapconventies en laadvolgorde

NocoBase scant standaard de volgende mappen om **plugins** te laden:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins in ontwikkeling (hoogste prioriteit)
└── storage/
    └── plugins/          # Gecompileerde plugins, bijv. geüploade of gepubliceerde plugins
```

- `packages/plugins`: Deze map wordt gebruikt voor lokale **plugin**-ontwikkeling en ondersteunt real-time compilatie en debugging.
- `storage/plugins`: Hierin worden gecompileerde **plugins** opgeslagen, zoals commerciële of externe **plugins**.

## Levenscyclus en statussen van een **plugin**

Een **plugin** doorloopt doorgaans de volgende fasen:

1. **Aanmaken (create)**: Maak een **plugin**-sjabloon via de CLI.
2. **Ophalen (pull)**: Download het **plugin**-pakket lokaal, maar het is nog niet naar de database geschreven.
3. **Inschakelen (enable)**: Bij de eerste keer inschakelen wordt "registreren + initialiseren" uitgevoerd; bij volgende keren wordt alleen de logica geladen.
4. **Uitschakelen (disable)**: Stop de uitvoering van de **plugin**.
5. **Verwijderen (remove)**: Verwijder de **plugin** volledig uit het systeem.

:::tip

- `pull` is alleen verantwoordelijk voor het downloaden van het **plugin**-pakket; het daadwerkelijke installatieproces wordt geactiveerd door de eerste `enable`.
- Als een **plugin** alleen is `pull`ed maar niet is ingeschakeld, wordt deze niet geladen.

:::

### CLI-commando voorbeelden

```bash
# 1. Maak een plugin-skelet aan
yarn pm create @my-project/plugin-hello

# 2. Haal het plugin-pakket op (downloaden of linken)
yarn pm pull @my-project/plugin-hello

# 3. Schakel de plugin in (installeert automatisch bij de eerste keer inschakelen)
yarn pm enable @my-project/plugin-hello

# 4. Schakel de plugin uit
yarn pm disable @my-project/plugin-hello

# 5. Verwijder de plugin
yarn pm remove @my-project/plugin-hello
```

## **Plugin**-beheerinterface

Bezoek de **plugin**-manager in uw browser om **plugins** intuïtief te bekijken en te beheren:

**Standaard URL:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Plugin-manager](https://static-docs.nocobase.com/20251030195350.png)