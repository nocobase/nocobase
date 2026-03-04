---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/actions/types/duplicate).
:::

# Kopiera

## Introduktion

Kopieringsåtgärden gör det möjligt för er att snabbt skapa nya poster baserat på befintliga data. Den stöder två kopieringslägen: **Direktkopiering** och **Kopiera till formulär och fortsätt fylla i**.

## Installation

Detta är ett inbyggt plugin, ingen separat installation krävs.

## Kopieringsläge

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Direktkopiering

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Körs som standard med "Direktkopiering";
- **Mallfält**: Ange de fält som ska kopieras. Ni kan välja alla, detta är en obligatorisk konfiguration.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

När konfigurationen är klar klickar ni på knappen för att kopiera data.

### Kopiera till formulär och fortsätt fylla i

De konfigurerade mallfälten kommer att fyllas i formuläret som **standardvärden**. Ni kan ändra dessa värden innan ni skickar in för att slutföra kopieringen.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Konfigurera mallfält**: Endast de markerade fälten kommer att tas med som standardvärden.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Synkronisera formulärfält

- Analyserar automatiskt de fält som redan har konfigurerats i det aktuella formulärblocket som mallfält;
- Om fälten i formulärblocket ändras senare (t.ex. justering av komponenter för relationsfält), måste ni öppna mallkonfigurationen igen och klicka på **Synkronisera formulärfält** för att säkerställa samstämmighet.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Malldata fylls i som standardvärden i formuläret, och ni kan skicka in efter ändring för att slutföra kopieringen.


### Kompletterande information

#### Kopiera, Referera, Förhandsladda

Olika fälttyper (relationstyper) har olika bearbetningslogik: **Kopiera / Referera / Förhandsladda**. Även **fältkomponenten** för ett relationsfält påverkar denna logik:

- Select / Record picker: Används för **Referens**
- Sub-form / Sub-table: Används för **Kopiering**

**Kopiera**

- Vanliga fält kopieras;
- `hasOne` / `hasMany` kan endast kopieras (dessa relationer bör inte använda markeringskomponenter som rullgardinsmeny eller postväljare; använd istället komponenter som underformulär eller undertabell);
- Ändring av komponenten för `hasOne` / `hasMany` **ändrar inte** bearbetningslogiken (den förblir Kopiera);
- För kopierade relationsfält kan alla underfält väljas.

**Referera**

- `belongsTo` / `belongsToMany` behandlas som Referens;
- Om fältkomponenten ändras från "Rullgardinsmeny" till "Underformulär", ändras relationen från **Referens till Kopiera** (när den blir Kopiera kan alla underfält väljas).

**Förhandsladda**

- Relationsfält under ett referensfält behandlas som Förhandsladdning;
- Förhandsladdade fält kan bli Referens eller Kopiera efter en komponentändring.

#### Markera alla

- Markerar alla **kopieringsfält** och **referensfält**.

#### Följande fält filtreras bort från den post som valts som datamall:

- Primärnycklar för kopierade relationsdata filtreras bort; primärnycklar för Referens och Förhandsladda filtreras inte bort;
- Främmande nycklar;
- Fält som inte tillåter dubbletter (Unika);
- Sorteringsfält;
- Sekvensfält (Auto-inkrement);
- Lösenord;
- Skapad av, Skapad den;
- Senast uppdaterad av, Uppdaterad den.

#### Synkronisera formulärfält

- Analyserar automatiskt de fält som konfigurerats i det aktuella formulärblocket till mallfält;
- Efter att ha ändrat fält i formulärblocket (t.ex. justering av komponenter för relationsfält), måste ni synkronisera igen för att säkerställa samstämmighet.