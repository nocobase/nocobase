:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Formulärblock

## Introduktion

Formulärblocket är ett viktigt block för att bygga gränssnitt för datainmatning och redigering. Det är mycket anpassningsbart och använder relevanta komponenter för att visa de fält som behövs, baserat på datamodellen. Genom händelseflöden som länkregler kan formulärblocket visa fält dynamiskt. Dessutom kan det kombineras med arbetsflöden för att trigga automatiserade processer och hantera data, vilket ytterligare förbättrar arbetseffektiviteten eller möjliggör logisk orkestrering.

## Lägga till ett formulärblock

- **Redigera formulär**: Används för att ändra befintlig data.
- **Lägg till formulär**: Används för att skapa nya dataposter.

![20251023191139](https://static-docs.nocobase.com/20251023191139.png)

## Blockinställningar

![20251023191448](https://static-docs.nocobase.com/20251023191448.png)

### Länkregler för block

Styr blockets beteende (som om det ska visas eller köra JavaScript) med hjälp av länkregler.

![20251023191703](https://static-docs.nocobase.com/20251023191703.png)

För mer information, se [Länkregler för block](/interface-builder/blocks/block-settings/block-linkage-rule)

### Länkregler för fält

Styr formulärfältens beteende med hjälp av länkregler.

![20251023191849](https://static-docs.nocobase.com/20251023191849.png)

För mer information, se [Länkregler för fält](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

Formulärblocket stöder två layoutlägen, som kan ställas in via attributet `layout`:

- **horizontal** (horisontell layout): Denna layout visar etikett och innehåll på en enda rad, vilket sparar vertikalt utrymme. Den passar för enkla formulär eller när det finns mindre information.
- **vertical** (vertikal layout) (standard): Etiketten placeras ovanför fältet. Denna layout gör formuläret lättare att läsa och fylla i, särskilt för formulär med flera fält eller komplexa inmatningsobjekt.

![20251023193638](https://static-docs.nocobase.com/20251023193638.png)

## Konfigurera fält

### Fält i denna samling

> **Obs**: Fält från ärvda samlingar (d.v.s. fält från överordnade samlingar) slås automatiskt samman och visas i den aktuella fältlistan.

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### Andra fält

![20251023192559](https://static-docs.nocobase.com/20251023192559.png)

- Genom att skriva JavaScript kan du anpassa visningsinnehållet och visa komplex information.

![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

## Konfigurera åtgärder

![20251023193231](https://static-docs.nocobase.com/20251023193231.png)

- [Skicka](/interface-builder/actions/types/submit)
- [Trigga arbetsflöde](/interface-builder/actions/types/trigger-workflow)
- [JS-åtgärd](/interface-builder/actions/types/js-action)
- [AI-medarbetare](/interface-builder/actions/types/ai-employee)