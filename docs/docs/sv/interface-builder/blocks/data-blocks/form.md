:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/blocks/data-blocks/form).
:::

# Formulärblock

## Introduktion

Formulärblocket är ett viktigt block för att bygga gränssnitt för datainmatning och redigering. Det är mycket anpassningsbart och använder motsvarande komponenter för att visa de fält som behövs baserat på datamodellen. Genom händelseflöden som länkregler kan formulärblocket visa fält dynamiskt. Dessutom kan det kombineras med arbetsflöden för att realisera automatisering av processtriggning och databehandling, vilket ytterligare förbättrar arbetseffektiviteten eller möjliggör logisk orkestrering.

## Lägga till formulärblock

- **Redigera formulär**: Används för att ändra befintlig data.
- **Nytt formulär**: Används för att skapa nya dataposter.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blockkonfiguration

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Länkregler för block

Styr blockets beteende (som om det ska visas eller köra JavaScript) via länkregler.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

För mer information, se [Länkregler för block](/interface-builder/blocks/block-settings/block-linkage-rule)

### Länkregler för fält

Styr formulärfältens beteende via länkregler.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

För mer information, se [Länkregler för fält](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Formulärblocket stöder två layoutlägen som ställs in via attributet `layout`:

- **horizontal** (horisontell layout): Denna layout gör att etikett och innehåll visas på samma rad, vilket sparar vertikalt utrymme och passar för enkla formulär eller situationer med lite information.
- **vertical** (vertikal layout) (standard): Etiketten placeras ovanför fältet. Denna layout gör formuläret lättare att läsa och fylla i, särskilt för formulär med många fält eller komplexa inmatningsobjekt.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurera fält

### Fält i denna samling

> **Obs**: Fält i ärvda tabeller (det vill säga fält från överordnade samlingar) slås automatiskt samman och visas i den aktuella fältlistan.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Fält i relationssamling

> Fält i relationssamlingar är skrivskyddade i formuläret och används vanligtvis tillsammans med relationsfält för att visa flera fältvärden från relaterad data.

![20260212161035](https://static-docs.nocobase.com/20260212161035.png)

- För närvarande stöds endast till-en-relationer (som belongsTo / hasOne etc.).
- Det används vanligtvis tillsammans med relationsfält (för att välja relaterade poster): komponenten för relationsfält ansvarar för att välja/ändra den relaterade posten, medan fältet för relationssamlingen ansvarar för att visa mer information om den posten (skrivskyddat).

**Exempel**: När ni väljer "Ansvarig" visas dennes mobilnummer, e-postadress och annan information i formuläret.

> Om relationsfältet "Ansvarig" inte är konfigurerat i redigeringsformuläret kan motsvarande relationsinformation fortfarande visas. När relationsfältet "Ansvarig" har konfigurerats kommer informationen att uppdateras till motsvarande post när den ansvarige ändras.

![20260212160748](https://static-docs.nocobase.com/20260212160748.gif)

### Övriga fält

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Genom att skriva JavaScript kan ni implementera anpassat visningsinnehåll och visa komplext innehåll.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Fältmall

Fältmallar används för att återanvända konfigurationen av fältområden i formulärblock. För mer information, se [Fältmall](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

## Konfigurera åtgärder

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Skicka](/interface-builder/actions/types/submit)
- [Trigga arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)