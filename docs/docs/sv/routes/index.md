---
pkg: "@nocobase/plugin-client"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Routhanterare

## Introduktion

Routhanteraren är ett verktyg för att hantera rutter för systemets huvudsidor, med stöd för både `datorer` och `mobila enheter`. Rutter som skapas med routhanteraren visas automatiskt i menyn (men kan konfigureras att inte visas där). Omvänt kommer menyer som läggs till via sidmenyn också att visas i routhanterarens lista.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Användarmanual

### Ruttertyper

Systemet stöder fyra typer av rutter:

- Grupp (group): Används för att gruppera och hantera rutter, och kan innehålla underrutter.
- Sida (page): En intern systemsida.
- Flik (tab): En ruttertyp som används för att växla mellan flikar inom en sida.
- Länk (link): En intern eller extern länk som direkt kan hoppa till den konfigurerade länkadressen.

### Lägg till rutt

Klicka på knappen "Add new" (Lägg till ny) i det övre högra hörnet för att skapa en ny rutt:

1. Välj ruttertyp (Type)
2. Fyll i ruttens titel (Title)
3. Välj ruttikon (Icon)
4. Ställ in om den ska visas i menyn (Show in menu)
5. Ställ in om sidflikar ska aktiveras (Enable page tabs)
6. För sidtyper genererar systemet automatiskt en unik ruttväg (Path).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Ruttåtgärder

Varje ruttpost stöder följande åtgärder:

- Add child (Lägg till underordnad): Lägg till en underrutt.
- Edit (Redigera): Redigera ruttkonfigurationen.
- View (Visa): Visa ruttsidan.
- Delete (Ta bort): Ta bort rutten.

### Massåtgärder

Verktygsfältet högst upp erbjuder följande massåtgärder:

- Refresh (Uppdatera): Uppdatera ruttlistan.
- Delete (Ta bort): Ta bort de valda rutterna.
- Hide in menu (Dölj i meny): Dölj de valda rutterna i menyn.
- Show in menu (Visa i meny): Visa de valda rutterna i menyn.

### Ruttfiltrering

Använd funktionen "Filter" (Filtrera) högst upp för att filtrera ruttlistan efter behov.

:::info{title=Obs}
Ändringar i ruttkonfigurationerna påverkar direkt systemets navigeringsmenystruktur. Var försiktig när ni utför åtgärder och se till att ruttkonfigurationerna är korrekta.
:::