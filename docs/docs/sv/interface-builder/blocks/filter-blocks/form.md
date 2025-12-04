:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Filterformulär

## Introduktion

Filterformuläret låter användare filtrera data genom att fylla i formulärfält. Det kan användas för att filtrera tabellblock, diagramblock, listblock med mera.

## Hur man använder

Låt oss börja med ett enkelt exempel för att snabbt förstå hur filterformuläret används. Anta att ni har ett tabellblock som innehåller användarinformation, och ni vill kunna filtrera datan med hjälp av ett filterformulär, som visas nedan:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Konfigurationsstegen är följande:

1. Aktivera redigeringsläge och lägg till ett "Filterformulär"-block och ett "Tabell"-block på sidan.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Lägg till fältet "Smeknamn" i både tabellblocket och filterformulärblocket.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Nu kan ni börja använda det.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Avancerad användning

Filterformulärblocket stöder fler avancerade konfigurationer. Här är några vanliga användningsfall.

### Koppla flera block

Ett enskilt formulärfält kan filtrera data i flera block samtidigt. Så här gör ni:

1. Klicka på konfigurationsalternativet "Connect fields" för fältet.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Lägg till de målblock ni vill koppla. I det här exemplet väljer vi listblocket på sidan.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Välj ett eller flera fält från listblocket att koppla. Här väljer vi fältet "Smeknamn".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klicka på spara-knappen för att slutföra konfigurationen. Resultatet ser ut så här:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Koppla diagramblock

Referens: [Sidfilter och koppling](../../../data-visualization/guide/filters-and-linkage.md)

### Anpassade fält

Förutom att välja fält från samlingar kan ni också skapa formulärfält med hjälp av "Anpassade fält". Ni kan till exempel skapa ett rullgardinsfält för enkelval och anpassa alternativen. Så här gör ni:

1. Klicka på alternativet "Anpassade fält" för att öppna konfigurationspanelen.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Fyll i fältets titel, välj "Select" som fältmodell och konfigurera alternativen.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Nya anpassade fält måste kopplas manuellt till fält i målblock. Så här gör ni:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfigurationen är klar. Resultatet ser ut så här:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

För närvarande stöds följande fältmodeller:

- Input: Textfält för en rad
- Number: Numeriskt inmatningsfält
- Date: Datumväljare
- Select: Rullgardinsmeny (kan konfigureras för enkel- eller flerval)
- Radio group: Radioknappar
- Checkbox group: Kryssrutor

### Fäll ihop

Lägg till en fäll-ihop-knapp för att kunna fälla ihop och expandera filterformulärets innehåll, vilket sparar utrymme på sidan.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Följande konfigurationer stöds:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Antal rader vid ihopfällning**: Anger hur många rader med formulärfält som visas i ihopfällt läge.
- **Standard ihopfälld**: När detta är aktiverat visas filterformuläret som standard i ihopfällt läge.