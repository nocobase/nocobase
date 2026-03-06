:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/blocks/filter-blocks/form).
:::

# Filtreringsformulär

## Introduktion

Filtreringsformulär tillåter användare att filtrera data genom att fylla i formulärfält. Det kan användas för att filtrera tabellblock, diagramblock, listblock etc.

## Hur man använder

Låt oss först snabbt förstå hur man använder filtreringsformulär genom ett enkelt exempel. Anta att ni har ett tabellblock som innehåller användarinformation, och ni vill kunna filtrera data via ett filtreringsformulär. Som nedan:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Konfigurationsstegen är följande:

1. Aktivera konfigurationsläget, lägg till ett "Filtreringsformulär"-block och ett "Tabellblock" på sidan.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Lägg till fältet "Smeknamn" i tabellblocket och filtreringsformulärblocket.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Nu är det klart att användas.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Avancerad användning

Filtreringsformulärblocket stöder fler avancerade konfigurationer, nedan följer några vanliga användningsområden.

### Koppla flera block

Ett enskilt formulärfält kan filtrera data i flera block samtidigt. Detaljerade steg är som följer:

1. Klicka på konfigurationsalternativet ”Connect fields” för fältet.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Lägg till målblocken som ska associeras, här väljer vi listblocket på sidan.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Välj ett eller flera fält i listblocket för associering. Här väljer vi fältet "Smeknamn".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klicka på spara-knappen för att slutföra konfigurationen, effekten är som följer:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Koppla diagramblock

Referens: [Sidfilter och länkning](../../../data-visualization/guide/filters-and-linkage.md)

### Anpassade fält

Förutom att välja fält från en samling kan ni också skapa formulärfält via "Anpassade fält". Till exempel kan ni skapa ett rullgardinsfält för enkelval och anpassa alternativen. Detaljerade steg är som följer:

1. Klicka på alternativet "Anpassade fält", konfigurationsgränssnittet visas.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Fyll i fälttiteln, välj "Val" i "Fälttyp" och konfigurera alternativen.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nyligen tillagda anpassade fält måste associeras manuellt med fält i målblocket, metoden är som följer:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurationen är klar, effekten är som följer:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

För närvarande stöds följande fälttyper:

- Textruta
- Nummer
- Datum
- Val
- Radioknapp
- Kryssruta
- Associering

#### Associering (Anpassat relationsfält)

"Associering" är lämpligt för scenarier som "filtrera efter associerade poster". Till exempel i en orderlista, filtrera ordrar efter "Kund", eller i en uppgiftslista filtrera uppgifter efter "Ansvarig".

Konfigurationsbeskrivning:

- **Målsamling**: Anger från vilken samling valbara poster ska laddas.
- **Titelfält**: Används för visningstext i rullgardinsalternativ och valda taggar (t.ex. namn, titel).
- **Värdefält**: Används för det värde som skickas vid faktisk filtrering, vanligtvis väljs primärnyckelfältet (t.ex. `id`).
- **Tillåt flerval**: När detta är aktiverat kan flera poster väljas samtidigt.
- **Operator**: Definierar hur filtreringsvillkor matchas (se beskrivning av "Operator" nedan).

Rekommenderad konfiguration:

1. Välj ett fält med hög läsbarhet för `Titelfält` (t.ex. "Namn") för att undvika att användbarheten påverkas av rena ID:n.
2. Prioritera primärnyckelfältet för `Värdefält` för att säkerställa stabil och unik filtrering.
3. Vid enkelval stängs vanligtvis `Tillåt flerval` av, vid flerval aktiveras `Tillåt flerval` tillsammans med en lämplig `Operator`.

#### Operator

`Operator` används för att definiera matchningsförhållandet mellan "filtreringsformulärets fältvärde" och "målblockets fältvärde".

### Fäll ihop

Lägg till en fäll-ihop-knapp för att kunna fälla ihop och expandera filtreringsformulärets innehåll, vilket sparar utrymme på sidan.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Stöder följande konfigurationer:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Antal rader som visas vid ihopfällning**: Ställer in antalet formulärfältrader som visas i ihopfällt läge.
- **Standard ihopfälld**: När detta är aktiverat visas filtreringsformuläret som standard i ihopfällt läge.