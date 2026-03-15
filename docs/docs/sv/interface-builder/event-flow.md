:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/interface-builder/event-flow).
:::

# Händelseflöde

## Introduktion

Om ni vill utlösa anpassade åtgärder när ett formulär ändras, kan ni använda händelseflöden för att uppnå detta. Förutom formulär kan även sidor, block, knappar och fält använda händelseflöden för att konfigurera anpassade operationer.

## Hur ni använder det

Nedan följer ett enkelt exempel för att förklara hur ni konfigurerar händelseflöden. Låt oss skapa en koppling mellan två tabeller där ett klick på en rad i den vänstra tabellen automatiskt filtrerar data i den högra tabellen.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Konfigurationsstegen är följande:

1. Klicka på "blixt"-ikonen i det övre högra hörnet av det vänstra tabellblocket för att öppna konfigurationsgränssnittet för händelseflöden.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klicka på "Lägg till händelseflöde (Add event flow)", välj "Radklick" som "Utlösande händelse", vilket innebär att flödet utlöses när en tabellrad klickas.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Konfigurera "Exekveringstidpunkt", som används för att kontrollera ordningsföljden för detta händelseflöde i förhållande till systemets inbyggda processer. Behåll vanligtvis standardinställningen; om ni vill visa meddelanden/navigera efter att den inbyggda logiken har körts, välj "Efter alla flöden". Se mer information nedan under [Exekveringstidpunkt](#exekveringstidpunkt).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Utlösande villkor (Trigger condition)" används för att konfigurera villkor. Händelseflödet utlöses endast när dessa villkor är uppfyllda. Här behöver vi inte konfigurera något, händelseflödet utlöses så fort man klickar på en rad.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Håll muspekaren över "Lägg till steg (Add step)" för att lägga till åtgärdssteg. Vi väljer "Ange datakomfattning (Set data scope)" för att ställa in datakomfattningen för den högra tabellen.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Kopiera UID för den högra tabellen och klistra in det i fältet "Målblock UID (Target block UID)". Ett gränssnitt för villkorskonfiguration visas omedelbart nedan, där ni kan konfigurera datakomfattningen för den högra tabellen.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Låt oss konfigurera ett villkor, som visas i bilden nedan:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Efter att ha konfigurerat datakomfattningen behöver ni också uppdatera blocket för att de filtrerade resultaten ska visas. Låt oss nu konfigurera uppdatering av det högra tabellblocket. Lägg till ett steg "Uppdatera målblock (Refresh target blocks)" och ange sedan UID för den högra tabellen.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Klicka slutligen på spara-knappen i det nedre högra hörnet för att slutföra konfigurationen.

## Händelseförklaring

### Före rendering

Universell händelse som kan användas i sidor, block, knappar eller fält. I denna händelse kan ni utföra initialiseringsarbete, till exempel att konfigurera olika datakomfattningar under olika villkor.

### Radklick (Row click)

Specifik händelse för tabellblock. Utlöses när en tabellrad klickas. Vid utlösning läggs en "Clicked row record" till i kontexten, vilken kan användas som variabel i villkor och steg.

### Formulärvärden ändras (Form values change)

Specifik händelse för formulärblock. Utlöses när värdet i ett formulärfält ändras. Ni kan hämta formulärets värden via variabeln "Current form" i villkor och steg.

### Klick (Click)

Specifik händelse för knappar. Utlöses när knappen klickas.

## Exekveringstidpunkt

I konfigurationen för händelseflöden finns två begrepp som lätt kan förväxlas:

- **Utlösande händelse:** När exekveringen startar (t.ex. Före rendering, Radklick, Klick, Formulärvärden ändras, etc.).
- **Exekveringstidpunkt:** Var i det **inbyggda flödet** ert **anpassade händelseflöde** ska infogas och köras efter att en utlösande händelse har inträffat.

### Vad är "inbyggda flöden / inbyggda steg"?

Många sidor, block eller åtgärder har en uppsättning inbyggda processer (t.ex. skicka in, öppna popup, begära data). När ni lägger till ett anpassat händelseflöde för samma händelse (t.ex. "Klick"), avgör "Exekveringstidpunkt":

- Om ert händelseflöde ska köras före eller efter den inbyggda logiken;
- Eller om ert händelseflöde ska infogas före eller efter ett specifikt steg i det inbyggda flödet.

### Hur ska man förstå alternativen för exekveringstidpunkt i gränssnittet?

- **Före alla flöden (standard):** Körs först. Lämpligt för "avbrytande/förberedelse" (t.ex. validering, bekräftelse, initialisering av variabler, etc.).
- **Efter alla flöden:** Körs efter att den inbyggda logiken är klar. Lämpligt för "avslutning/återkoppling" (t.ex. meddelanden, uppdatering av andra block, sidnavigering, etc.).
- **Före angivet flöde / Efter angivet flöde:** En mer exakt infogningspunkt. Kräver att ni väljer ett specifikt "Inbyggt flöde".
- **Före angivet flödessteg / Efter angivet flödessteg:** Den mest exakta infogningspunkt. Kräver att ni väljer både "Inbyggt flöde" och "Inbyggt flödessteg".

> Tips: Om ni är osäkra på vilket inbyggt flöde/steg ni ska välja, använd i första hand de två första alternativen ("Före / Efter").

## Stegförklaring

### Anpassad variabel (Custom variable)

Används för att definiera en anpassad variabel som sedan kan användas i kontexten.

#### Omfattning

Anpassade variabler har en omfattning. Till exempel kan en variabel som definieras i ett blocks händelseflöde endast användas inom det blocket. Om ni vill att variabeln ska kunna användas i alla block på den aktuella sidan, måste den konfigureras i sidans händelseflöde.

#### Formulärvariabel (Form variable)

Använd värdet från ett specifikt formulärblock som en variabel. Konfigurationen är som följer:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Variabeltitel
- Variable identifier: Variabelidentifierare
- Form UID: Formulär UID

#### Andra variabler

Stöd för andra variabler kommer att läggas till löpande, vänligen vänta.

### Ange datakomfattning (Set data scope)

Ställer in datakomfattningen för ett målblock. Konfigurationen är som följer:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: Målblock UID
- Condition: Filtreringsvillkor

### Uppdatera målblock (Refresh target blocks)

Uppdaterar målblock, tillåter konfiguration av flera block. Konfigurationen är som följer:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: Målblock UID

### Navigera till URL (Navigate to URL)

Navigera till en specifik URL. Konfigurationen är som följer:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Mål-URL, stöder användning av variabler
- Search parameters: Sökparametrar i URL:en
- Open in new window: Om markerat öppnas en ny webbläsarsida vid navigering

### Visa meddelande (Show message)

Visa global återkopplingsinformation för åtgärder.

#### När ska det användas

- Kan tillhandahålla återkoppling som framgång, varning och fel.
- Visas centrerat högst upp och försvinner automatiskt, vilket är ett lättviktigt sätt att ge information utan att avbryta användarens arbete.

#### Specifik konfiguration

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Typ av meddelande
- Message content: Innehåll i meddelandet
- Duration: Hur länge det ska visas, enhet sekunder

### Visa notifikation (Show notification)

Visa global notifikationsinformation.

#### När ska det användas

Visa notifikationsinformation i systemets fyra hörn. Används ofta i följande situationer:

- Mer komplext notifikationsinnehåll.
- Notifikationer med interaktion som ger användaren nästa steg.
- Systeminitierade utskick.

#### Specifik konfiguration

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Typ av notifikation
- Notification title: Titel på notifikation
- Notification description: Beskrivning av notifikation
- Placement: Position, valbara alternativ är: uppe till vänster, uppe till höger, nere till vänster, nere till höger

### Utför JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Utför JavaScript-kod.

## Exempel

### Formulär: Anropa externt API för att fylla i fält automatiskt

Scenario: Utlös ett händelseflöde i ett formulär, anropa ett externt API och fyll i formulärfält automatiskt med den mottagna datan.

Konfigurationssteg:

1. Öppna konfigurationen för händelseflöden i formulärblocket och lägg till ett nytt händelseflöde;
2. Välj "Före rendering" som utlösande händelse;
3. Välj "Efter alla flöden" som exekveringstidpunkt;
4. Lägg till steget "Utför JavaScript (Execute JavaScript)", klistra in och anpassa koden nedan:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```