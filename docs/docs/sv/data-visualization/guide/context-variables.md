:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Använd kontextvariabler

Med kontextvariabler kan du återanvända information från den aktuella sidan, användaren, tiden och filtreringsvillkoren. Detta gör det möjligt att rendera diagram och möjliggöra kopplingar baserat på kontexten.

## Tillämpningsområde
- Filtreringsvillkor i Builder-läget för datafrågor: välj variabler att använda.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- Vid skrivning av satser i SQL-läget för datafrågor: välj variabler och infoga uttryck (till exempel `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- I Custom-läget för diagramalternativ: skriv JS-uttryck direkt.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- Interaktionshändelser (till exempel klicka för att öppna en drill-down-dialog och skicka data): skriv JS-uttryck direkt.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Obs!**
- Lägg inte till enkla eller dubbla citattecken runt `{{ ... }}`. Systemet hanterar bindningen säkert baserat på variabeltypen (sträng, nummer, tid, NULL).
- När en variabel är `NULL` eller odefinierad, hantera null-värden explicit i SQL med `COALESCE(...)` eller `IS NULL`.