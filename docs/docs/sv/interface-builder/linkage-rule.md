:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Länkregler

## Introduktion

I NocoBase är länkregler en mekanism som används för att styra interaktiva beteenden hos gränssnittselement i frontend. De låter dig justera visnings- och beteendelogiken för block, fält och åtgärder i gränssnittet baserat på olika villkor, vilket ger en flexibel interaktiv upplevelse med lite kod. Denna funktion utvecklas och optimeras kontinuerligt.

Genom att konfigurera länkregler kan ni uppnå saker som:

- Dölja/visa vissa block baserat på den aktuella användarrollen. Olika roller kan se block med olika datainnehåll; till exempel kan administratörer se block med fullständig information, medan vanliga användare endast kan se block med grundläggande information.
- När ett alternativ väljs i ett formulär, fyll automatiskt i eller återställ andra fältvärden.
- När ett alternativ väljs i ett formulär, inaktivera vissa inmatningsfält.
- När ett alternativ väljs i ett formulär, gör vissa inmatningsfält obligatoriska.
- Styra om åtgärdsknappar är synliga eller klickbara under vissa förhållanden.

## Villkorskonfiguration

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Vänstervariabel

Vänstervariabeln i ett villkor används för att definiera "bedömningsobjektet" i länkregeln. Villkoret utvärderas baserat på värdet av denna variabel för att avgöra om länkåtgärden ska utlösas.

Valbara variabler inkluderar:

- Fält i kontexten, såsom `「Aktuellt formulär/xxx」`, `「Aktuell post/xxx」`, `「Aktuell popup-post/xxx」` etc.
- Systemglobala variabler, såsom `Aktuell användare`, `Aktuell roll` etc., lämpliga för dynamisk kontroll baserat på användaridentitet, behörigheter och annan information.
  > ✅ De tillgängliga alternativen för vänstervariabeln bestäms av blockets kontext. Använd vänstervariabeln förnuftigt utifrån affärsbehov:
  >
  > - `Aktuell användare` representerar informationen om den för närvarande inloggade användaren;
  > - `Aktuellt formulär` representerar de realtidsvärden som matas in i formuläret;
  > - `Aktuell post` representerar det sparade postvärdet, till exempel en radpost i en tabell.

### Operator

Operatorn används för att ställa in logiken för villkorsbedömningen, det vill säga hur man jämför vänstervariabeln med höger värde. Olika typer av vänstervariabler stöder olika operatorer. Vanliga typer av operatorer är följande:

- **Texttyp**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty` etc.
- **Numerisk typ**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte` etc.
- **Boolesk typ**: `$isTruly`, `$isFalsy`
- **Arraytyp**: `$match`, `$anyOf`, `$empty`, `$notEmpty` etc.

> ✅ Systemet rekommenderar automatiskt en lista över tillgängliga operatorer baserat på vänstervariabelns typ för att säkerställa att konfigurationslogiken är rimlig.

### Höger värde

Används för jämförelse med vänstervariabeln och är referensvärdet för att avgöra om villkoret är uppfyllt.

Innehåll som stöds inkluderar:

- Konstanta värden: Ange fasta numeriska värden, text, datum etc.;
- Kontextvariabler: såsom andra fält i det aktuella formuläret, den aktuella posten etc.;
- Systemvariabler: såsom aktuell användare, aktuell tid, aktuell roll etc.

> ✅ Systemet anpassar automatiskt inmatningsmetoden för höger värde baserat på vänstervariabelns typ, till exempel:
>
> - När vänster sida är ett "valfält", visas motsvarande alternativväljare;
> - När vänster sida är ett "datumfält", visas en datumväljare;
> - När vänster sida är ett "textfält", visas en textinmatningsruta.

> 💡 Genom att flexibelt använda höger värden (särskilt dynamiska variabler) kan ni bygga länklogik baserad på aktuell användare, aktuell datastatus och kontext, vilket ger en kraftfullare interaktiv upplevelse.

## Logik för regelutförande

### Villkorsutlösning

När villkoret i en regel är uppfyllt (valfritt) utförs den underliggande egenskapändringsåtgärden automatiskt. Om inget villkor är inställt, anses regeln som standard alltid vara uppfylld, och egenskapändringsåtgärden utförs automatiskt.

### Flera regler

Ni kan konfigurera flera länkregler för ett formulär. När villkoren för flera regler uppfylls samtidigt, kommer systemet att utföra resultaten i den ordning reglerna är satta, från första till sista, vilket innebär att det sista resultatet blir den slutgiltiga standarden.
Exempel: Regel 1 ställer in ett fält som "Inaktiverat", och Regel 2 ställer in fältet som "Redigerbart". Om villkoren för båda reglerna uppfylls, kommer fältet att bli "Redigerbart".

> Utförandeordningen för flera regler är avgörande. Se till att ni, när ni designar regler, klargör deras prioriteringar och inbördes förhållanden för att undvika regelkonflikter.

## Regelhantering

Följande åtgärder kan utföras på varje regel:

- Anpassad namngivning: Ge regeln ett lättförståeligt namn för hantering och identifiering.
- Sortering: Justera ordningen baserat på reglernas utförandeprioritet för att säkerställa att systemet behandlar dem i rätt sekvens.
- Radera: Ta bort regler som inte längre behövs.
- Aktivera/Inaktivera: Inaktivera tillfälligt en regel utan att radera den, lämpligt för scenarier där en regel behöver avaktiveras temporärt.
- Kopiera regel: Skapa en ny regel genom att kopiera en befintlig för att undvika upprepad konfiguration.

## Om variabler

Vid fältvärdestilldelning och villkorskonfiguration stöds både konstanter och variabler. Listan över variabler varierar beroende på blockets placering. Att välja och använda variabler på ett förnuftigt sätt kan mer flexibelt möta affärsbehov. För mer information om variabler, se [Variabler](/interface-builder/variables).

## Blocklänkregler

Blocklänkregler möjliggör dynamisk kontroll av ett blocks visning baserat på systemvariabler (som aktuell användare, roll) eller kontextvariabler (som aktuell popup-post). Till exempel kan en administratör se fullständig orderinformation, medan en kundtjänstroll endast kan se specifik orderdata. Genom blocklänkregler kan ni konfigurera motsvarande block baserat på roller och ställa in olika fält, åtgärdsknappar och datainnehåll inom dessa block. När den inloggade rollen är målrollen, kommer systemet att visa det motsvarande blocket. Det är viktigt att notera att block visas som standard, så ni behöver vanligtvis definiera logiken för att dölja blocket.

👉 För mer information, se: [Block/Blocklänkregler](/interface-builder/blocks/block-settings/block-linkage-rule)

## Fältlänkregler

Fältlänkregler används för att dynamiskt justera statusen för fält i ett formulär eller detaljblock baserat på användaråtgärder, och inkluderar huvudsakligen:

- Styra fältets **Visa/Dölj**-status
- Ställa in om ett fält är **Obligatoriskt**
- **Tilldela ett värde**
- Utföra JavaScript för att hantera anpassad affärslogik

👉 För mer information, se: [Block/Fältlänkregler](/interface-builder/blocks/block-settings/field-linkage-rule)

## Åtgärdslänkregler

Åtgärdslänkregler stöder för närvarande styrning av åtgärdsbeteenden, såsom dölja/inaktivera, baserat på kontextvariabler som aktuellt postvärde och aktuellt formulär, samt globala variabler.

👉 För mer information, se: [Åtgärd/Länkregler](/interface-builder/actions/action-settings/linkage-rule)