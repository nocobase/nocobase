:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Översikt över blocktillägg

I NocoBase 2.0 har mekanismen för blocktillägg förenklats avsevärt. Utvecklare behöver bara ärva den motsvarande **FlowModel**-basklassen och implementera relevanta gränssnittsmetoder (främst `renderComponent()`-metoden) för att snabbt kunna anpassa block.

## Blockkategorier

NocoBase delar in block i tre kategorier, som visas i grupper i konfigurationsgränssnittet:

- **Datablocket (Data blocks)**: Block som ärver från `DataBlockModel` eller `CollectionBlockModel`
- **Filterblocket (Filter blocks)**: Block som ärver från `FilterBlockModel`
- **Övriga block (Other blocks)**: Block som direkt ärver från `BlockModel`

> Blockets grupptillhörighet bestäms av den motsvarande basklassen. Klassificeringslogiken baseras på arv och kräver ingen ytterligare konfiguration.

## Beskrivning av basklasser

Systemet tillhandahåller fyra basklasser för tillägg:

### BlockModel

**Grundläggande blockmodell**, den mest mångsidiga basklassen för block.

- Lämplig för block som endast visar information och inte är beroende av data
- Kategoriseras i gruppen **Övriga block**
- Tillämplig för anpassade scenarier

### DataBlockModel

**Datablokksmodell (ej bunden till datatabell)**, för block med anpassade datakällor.

- Binder inte direkt till en datatabell, kan anpassa logiken för datahämtning
- Kategoriseras i gruppen **Datablocket**
- Tillämplig för: anrop av externa API:er, anpassad databehandling, statistiska diagram m.m.

### CollectionBlockModel

**Samlingsblockmodell**, för block som behöver bindas till en datatabell.

- Basklass för modeller som behöver bindas till en datatabell
- Kategoriseras i gruppen **Datablocket**
- Tillämplig för: listor, formulär, kanbantavlor och andra block som tydligt är beroende av en specifik datatabell

### FilterBlockModel

**Filterblockmodell**, för block som används för att bygga filtervillkor.

- Basklass för modeller som används för att bygga filtervillkor
- Kategoriseras i gruppen **Filterblocket**
- Samverkar vanligtvis med datablock

## Hur man väljer en basklass

När ni väljer en basklass kan ni följa dessa principer:

- **Behöver bindas till en datatabell**: Prioritera `CollectionBlockModel`
- **Anpassad datakälla**: Välj `DataBlockModel`
- **För att ställa in filtervillkor och samverka med datablock**: Välj `FilterBlockModel`
- **Osäker på hur ni ska kategorisera**: Välj `BlockModel`

## Snabbstart

Att skapa ett anpassat block kräver bara tre steg:

1. Ärva den motsvarande basklassen (t.ex. `BlockModel`)
2. Implementera `renderComponent()`-metoden för att returnera en React-komponent
3. Registrera blockmodellen i pluginet

För detaljerade exempel, se [Skriv ett block-plugin](./write-a-block-plugin).