:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Sidfilter och länkning

Sidfiltret (filterblocket) används för att på sidnivå erbjuda en enhetlig inmatning av filtervillkor och slå samman dessa med diagramfrågor, för att uppnå konsekvent filtrering och länkning mellan flera diagram.

## Funktionsöversikt
- Lägg till ett ”filterblock” på sidan för att tillhandahålla en enhetlig filteringång för alla diagram på den aktuella sidan.
- Använd knapparna ”Filtrera”, ”Återställ” och ”Fäll ihop” för att tillämpa, rensa och fälla ihop filtret.
- Om filtret väljer fält som är kopplade till ett diagram, slås deras värden automatiskt samman med diagramfrågan och utlöser en uppdatering av diagrammet.
- Filter kan också skapa anpassade fält och registrera dem i kontextvariabler så att de kan refereras i diagram, tabeller, formulär och andra datablock.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

För mer om hur du använder sidfilter och hur de länkar med diagram eller andra datablock, se [sidfilter](#) dokumentationen.

## Använd sidfiltervärden i diagramfrågor
- Builder-läge (rekommenderas)
  - Automatisk sammanslagning: När datakällan och samlingen matchar, behöver du inte skriva variabler i diagramfrågan; sidfiltren slås samman med `$and`.
  - Manuellt val: Du kan också aktivt välja värden från sidfiltrets ”anpassade fält” i diagrammets filtervillkor.

- SQL-läge (via variabelinjektion)
  - I SQL-satsen, använd ”Välj variabel” för att infoga värden från sidfiltrets ”anpassade fält”.