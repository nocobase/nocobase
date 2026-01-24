:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Tabellblock

## Introduktion

Tabellblocket är ett av **NocoBase** inbyggda kärndatablock, främst avsett för att visa och hantera strukturerad data i tabellform. Det erbjuder flexibla konfigurationsalternativ, vilket gör att ni kan anpassa tabellens kolumner, kolumnbredder, sorteringsregler och dataintervall efter era behov, för att säkerställa att datan presenteras på ett sätt som uppfyller specifika affärskrav.

#### Huvudfunktioner:
- **Flexibel kolumnkonfiguration**: Ni kan anpassa tabellens kolumner och kolumnbredder för att passa olika behov av datavisning.
- **Sorteringsregler**: Stöder sortering av tabelldata. Ni kan ordna data i stigande eller fallande ordning baserat på olika fält.
- **Inställning av dataintervall**: Genom att ställa in dataintervallet kan ni kontrollera vilket data som visas, och därmed undvika störningar från irrelevant data.
- **Åtgärdskonfiguration**: Tabellblocket har flera inbyggda åtgärdsalternativ. Ni kan enkelt konfigurera åtgärder som filtrering, skapa nytt, redigera och radera för snabb datahantering.
- **Snabbeditering**: Stöder direkt dataredigering i tabellen, vilket förenklar arbetsprocessen och ökar effektiviteten.

## Blockinställningar

![20251023150819](https://static-docs.nocobase.com/20251023150819.png)

### Regler för blockkoppling

Styr blockets beteende (t.ex. om det ska visas eller köra JavaScript) genom kopplingsregler.

![20251023194550](https://static-docs.nocobase.com/20251023194550.png)

För mer information, se [Kopplingsregler](/interface-builder/linkage-rule)

### Ställ in dataintervall

Exempel: Filtrera som standard order där "Status" är "Betald".

![20251023150936](https://static-docs.nocobase.com/20251023150936.png)

För mer information, se [Ställ in dataintervall](/interface-builder/blocks/block-settings/data-scope)

### Ställ in sorteringsregler

Exempel: Visa order i fallande ordning efter datum.

![20251023155114](https://static-docs.nocobase.com/20251023155114.png)

För mer information, se [Ställ in sorteringsregler](/interface-builder/blocks/block-settings/sorting-rule)

### Aktivera snabbeditering

Aktivera "Aktivera snabbeditering" i blockinställningarna och tabellkolumninställningarna för att anpassa vilka kolumner som kan snabbediteras.

![20251023190149](https://static-docs.nocobase.com/20251023190149.png)

![20251023190519](https://static-docs.nocobase.com/20251023190519.gif)

### Aktivera trädtabell

När datatabellen är en hierarkisk (träd)tabell kan tabellblocket aktivera funktionen "Aktivera trädtabell". Som standard är detta alternativ inaktiverat. När det är aktiverat kommer blocket att visa data i en trädstruktur och stödja motsvarande konfigurationsalternativ och åtgärder.

![20251125205918](https://static-docs.nocobase.com/20251125205918.png)

### Expandera alla rader som standard

När trädtabellen är aktiverad stöder blocket att alla underordnade rader expanderas som standard när det laddas.

## Konfigurera fält

### Fält i denna samling

> **Obs**: Fält från ärvda samlingar (d.v.s. överordnade samlingsfält) slås automatiskt samman och visas i den aktuella fältlistan.

![20251023185113](https://static-docs.nocobase.com/20251023185113.png)

### Fält i relaterade samlingar

> **Obs**: Stöder visning av fält från relaterade samlingar (stöder för närvarande endast en-till-en-relationer).

![20251023185239](https://static-docs.nocobase.com/20251023185239.png)

### Andra anpassade kolumner

![20251023185425](https://static-docs.nocobase.com/20251023185425.png)

- [JS Field](/interface-builder/fields/specific/js-field)
- [JS Column](/interface-builder/fields/specific/js-column)

## Konfigurera åtgärder

### Globala åtgärder

![20251023171655](https://static-docs.nocobase.com/20251023171655.png)

- [Filtrera](/interface-builder/actions/types/filter)
- [Lägg till ny](/interface-builder/actions/types/add-new)
- [Radera](/interface-builder/actions/types/delete)
- [Uppdatera](/interface-builder/actions/types/refresh)
- [Importera](/interface-builder/actions/types/import)
- [Exportera](/interface-builder/actions/types/export)
- [Mallutskrift](/template-print/index)
- [Massuppdatera](/interface-builder/actions/types/bulk-update)
- [Exportera bilagor](/interface-builder/actions/types/export-attachments)
- [Utlös arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)

### Radåtgärder

![20251023181019](https://static-docs.nocobase.com/20251023181019.png)

- [Visa](/interface-builder/actions/types/view)
- [Redigera](/interface-builder/actions/types/edit)
- [Radera](/interface-builder/actions/types/delete)
- [Popup](/interface-builder/actions/types/pop-up)
- [Länk](/interface-builder/actions/types/link)
- [Uppdatera post](/interface-builder/actions/types/update-record)
- [Mallutskrift](/template-print/index)
- [Utlös arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)