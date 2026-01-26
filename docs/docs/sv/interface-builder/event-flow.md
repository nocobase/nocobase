:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Händelseflöde

## Introduktion

Om ni vill utlösa anpassade åtgärder när ett formulär ändras, kan ni använda händelseflöden. Förutom formulär kan även sidor, block, knappar och fält använda händelseflöden för att konfigurera anpassade operationer.

## Hur ni använder det

Låt oss titta på ett enkelt exempel för att förstå hur ni konfigurerar händelseflöden. Vi ska skapa en koppling mellan två tabeller där ett klick på en rad i den vänstra tabellen automatiskt filtrerar data i den högra tabellen.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

Konfigurationsstegen är följande:

1. Klicka på "blixt"-ikonen i det övre högra hörnet av det vänstra tabellblocket för att öppna konfigurationspanelen för händelseflöden.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klicka på "Lägg till händelseflöde" (Add event flow), välj "Radklick" (Row click) som "Utlösande händelse" (Trigger event). Detta innebär att flödet utlöses när en tabellrad klickas.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. "Utlösande villkor" (Trigger condition) används för att konfigurera villkor. Händelseflödet utlöses endast när dessa villkor är uppfyllda. I det här fallet behöver vi inte konfigurera några villkor, så flödet kommer att utlösas vid varje radklick.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
4. Håll muspekaren över "Lägg till steg" (Add step) för att lägga till åtgärdssteg. Vi väljer "Ange datakomfattning" (Set data scope) för att konfigurera datakomfattningen för den högra tabellen.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
5. Kopiera UID:et för den högra tabellen och klistra in det i inmatningsfältet "Målblock UID" (Target block UID). En konfigurationspanel för villkor visas omedelbart nedan, där ni kan konfigurera datakomfattningen för den högra tabellen.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
6. Låt oss konfigurera ett villkor, som visas nedan:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
7. Efter att ha konfigurerat datakomfattningen behöver ni uppdatera blocket för att de filtrerade resultaten ska visas. Låt oss nu konfigurera uppdateringen av det högra tabellblocket. Lägg till ett steg "Uppdatera målblock" (Refresh target blocks) och ange sedan UID:et för den högra tabellen.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
8. Slutligen klickar ni på spara-knappen i det nedre högra hörnet för att slutföra konfigurationen.

## Händelsetyper

### Före rendering (Before render)

En universell händelse som kan användas i sidor, block, knappar eller fält. Använd denna händelse för initialiseringsuppgifter, till exempel för att konfigurera olika datakomfattningar baserat på olika villkor.

### Radklick (Row click)

En händelse som är specifik för tabellblock. Utlöses när en tabellrad klickas. När den utlöses läggs en "Klickad radpost" (Clicked row record) till i kontexten, som kan användas som en variabel i villkor och steg.

### Formulärvärden ändras (Form values change)

En händelse som är specifik för formulärblock. Utlöses när värdena i formulärfälten ändras. Ni kan komma åt formulärvärdena via variabeln "Aktuellt formulär" (Current form) i villkor och steg.

### Klick (Click)

En händelse som är specifik för knappar. Utlöses när knappen klickas.

## Stegtyper

### Anpassad variabel (Custom variable)

Skapa en anpassad variabel för att använda inom kontexten.

#### Omfattning

Anpassade variabler har en omfattning. Till exempel kan en variabel som definieras i ett blocks händelseflöde endast användas inom det blocket. För att göra en variabel tillgänglig i alla block på den aktuella sidan måste ni konfigurera den i sidans händelseflöde.

#### Formulärvariabel (Form variable)

Använd värden från ett formulärblock som en variabel. Konfiguration:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variabeltitel: Variabeltitel
- Variabelidentifierare: Variabelidentifierare
- Formulär UID: Formulär UID

#### Andra variabler

Fler variabeltyper kommer att stödjas i framtiden. Håll utkik!

### Ange datakomfattning (Set data scope)

Ange datakomfattningen för ett målblock. Konfiguration:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Målblock UID: Målblock UID
- Villkor: Filtervillkor

### Uppdatera målblock (Refresh target blocks)

Uppdatera målblock. Flera block kan konfigureras. Konfiguration:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Målblock UID: Målblock UID

### Navigera till URL (Navigate to URL)

Navigera till en URL. Konfiguration:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Mål-URL, stöder variabler
- Sökparametrar: Frågeparametrar i URL:en
- Öppna i nytt fönster: Om markerat öppnas URL:en i en ny webbläsarflik

### Visa meddelande (Show message)

Visa globala återkopplingsmeddelanden.

#### När ska det användas

- Kan ge återkoppling som framgång, varning och fel.
- Visas centrerat högst upp och försvinner automatiskt, vilket är ett lättviktigt sätt att ge information utan att avbryta användarens arbete.

#### Konfiguration

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Meddelandetyp: Meddelandetyp
- Meddelandeinnehåll: Meddelandeinnehåll
- Varaktighet: Hur länge meddelandet visas (i sekunder)

### Visa notifikation (Show notification)

Visa globala notifikationsmeddelanden.

#### När ska det användas

Visa notifikationsmeddelanden i systemets fyra hörn. Används ofta för:

- Mer komplext notifikationsinnehåll.
- Interaktiva notifikationer som ger användaren nästa steg.
- Systeminitierade notifikationer.

#### Konfiguration

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notifikationstyp: Notifikationstyp
- Notifikationstitel: Notifikationstitel
- Notifikationsbeskrivning: Notifikationsbeskrivning
- Placering: Position, alternativ: övre vänster, övre höger, nedre vänster, nedre höger

### Utför JavaScript (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Utför JavaScript-kod.