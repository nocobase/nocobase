:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/workflow/nodes/approval).
:::

pkg: '@nocobase/plugin-workflow-approval'

# Godkännande

## Introduktion

I ett godkännandearbetsflöde behöver ni använda en dedikerad "Godkännande"-nod för att konfigurera den logik som godkännare ska använda för att hantera (godkänna, avvisa eller returnera) det initierade godkännandet. "Godkännande"-noden kan endast användas i godkännandeprocesser.

:::info{title=Tips}
Skillnaden från den vanliga "Manuell hantering"-noden: Den vanliga "Manuell hantering"-noden är avsedd för mer generella scenarier, som manuell datainmatning eller manuella beslut om arbetsflödet ska fortsätta i olika typer av arbetsflöden. "Godkännande"-noden är en specialiserad hanteringsnod exklusivt för godkännandeprocesser. Den hanterar endast data för det initierade godkännandet och kan inte användas i andra arbetsflöden.
:::

## Skapa nod

Klicka på plusknappen ("+") i arbetsflödet för att lägga till en "Godkännande"-nod. Välj sedan ett av godkännandelägena för att skapa godkännandenoden:

![Skapa godkännandenod](https://static-docs.nocobase.com/20251107000938.png)

## Nodkonfiguration

### Godkännandeläge

Det finns två godkännandelägen:

1.  Direktläge: Används vanligtvis för enklare processer. Om godkännandenoden godkänns eller inte avgör endast om processen avslutas. Om den inte godkänns avslutas processen direkt.

    ![Godkännandeläge_Direktläge](https://static-docs.nocobase.com/20251107001043.png)

2.  Grenläge: Används vanligtvis för mer komplex datalogik. Efter att godkännandenoden har producerat ett resultat kan andra noder fortsätta att exekveras inom dess resultatgren.

    ![Godkännandeläge_Grenläge](https://static-docs.nocobase.com/20251107001234.png)

    När denna nod har "godkänts" kommer, förutom att godkännandegrenen exekveras, även det efterföljande arbetsflödet att fortsätta. Efter en "Avvisa"-åtgärd kan det efterföljande arbetsflödet också fortsätta som standard, eller så kan ni konfigurera noden att avsluta processen efter att grenen har exekverats.

:::info{title=Tips}
Godkännandeläget kan inte ändras efter att noden har skapats.
:::

### Godkännare

Godkännaren är den uppsättning användare som ansvarar för godkännandeåtgärden för denna nod. Det kan vara en eller flera användare. Källan kan vara ett statiskt värde valt från användarlistan, eller ett dynamiskt värde specificerat av en variabel:

![Godkännare](https://static-docs.nocobase.com/20251107001433.png)

När ni väljer en variabel kan ni endast välja primärnyckeln eller främmande nyckeln för användardata från kontexten och nodresultaten. Om den valda variabeln är en array under exekvering (en till-många-relation), kommer varje användare i arrayen att slås samman till den totala godkännargruppen.

Förutom att direkt välja användare eller variabler kan ni också dynamiskt filtrera fram kvalificerade användare som godkännare baserat på sökfrågor från användarsamlingen:

![Dynamisk filtrering av godkännare](https://static-docs.nocobase.com/20251107001703.png)

### Överenskommelseläge

Om det bara finns en godkännare vid den slutliga exekveringen (inklusive efter att flera variabler har avduplicerats), kommer endast den användaren att utföra godkännandeåtgärden, oavsett vilket överenskommelseläge som väljs, och resultatet bestäms enbart av den användaren.

När det finns flera användare i godkännargruppen representerar valet av olika överenskommelselägen olika hanteringssätt:

1. Valfri: Det räcker att en person godkänner för att noden ska godkännas. Noden avvisas endast om alla avvisar.
2. Samtycke: Alla måste godkänna för att noden ska godkännas. Om bara en person avvisar, avvisas noden.
3. Omröstning: Antalet personer som godkänner måste överstiga en inställd andel för att noden ska godkännas; annars avvisas noden.

För åtgärden "Returnera" gäller att om någon användare i godkännargruppen hanterar den som en retur, kommer noden att avsluta processen direkt, oavsett läge.

### Bearbetningsordning

På samma sätt, när det finns flera användare i godkännargruppen, representerar valet av olika bearbetningsordningar olika hanteringssätt:

1. Parallellt: Alla godkännare kan hantera i valfri ordning; ordningen spelar ingen roll.
2. Sekventiellt: Godkännare hanterar i den ordning de står i godkännargruppen. Nästa godkännare kan endast hantera efter att den föregående har skickat in sitt beslut.

Oavsett om det är inställt på "Sekventiell" hantering, följer resultatet som produceras enligt den faktiska bearbetningsordningen även reglerna i det ovan nämnda "Överenskommelseläget". Noden slutför sin exekvering när motsvarande villkor är uppfyllda.

### Avsluta arbetsflödet efter att avvisningsgrenen har slutförts

När "Godkännandeläge" är inställt på "Grenläge" kan ni välja att avsluta arbetsflödet efter att avvisningsgrenen har slutförts. Efter att ni har markerat detta alternativ visas ett "✗" i slutet av avvisningsgrenen, vilket indikerar att efterföljande noder inte kommer att fortsätta efter att denna gren har avslutats:

![Avsluta efter avvisning](https://static-docs.nocobase.com/20251107001839.png)

### Konfiguration av godkännargränssnitt

Konfigurationen av godkännargränssnittet används för att tillhandahålla ett användargränssnitt för godkännaren när godkännandearbetsflödet exekveras till denna nod. Klicka på konfigurationsknappen för att öppna popup-fönstret:

![Konfiguration av gränssnitt_Popup](https://static-docs.nocobase.com/20251107001958.png)

I konfigurationspopupen kan ni lägga till block som ursprungligt inskickat innehåll, godkännandeinformation, hanteringsformulär och anpassad ledtext:

![Konfiguration av gränssnitt_Lägg till block](https://static-docs.nocobase.com/20251107002604.png)

#### Ursprungligt inskickat innehåll

Blocket för detaljer om godkännandeinnehållet är det datablock som initiativtagaren har skickat in. I likhet med ett vanligt datablock kan ni fritt lägga till fältkomponenter från samlingen och arrangera dem som ni vill, för att organisera det innehåll som godkännaren behöver granska:

![Konfiguration av gränssnitt_Detaljblock](https://static-docs.nocobase.com/20251107002925.png)

#### Hanteringsformulär

I blocket för hanteringsformuläret kan ni lägga till åtgärdsknappar som stöds av denna nod, inklusive "Godkänn", "Avvisa", "Returnera", "Omfördela" och "Lägg till signatär":

![Konfiguration av gränssnitt_Hanteringsformulärblock](https://static-docs.nocobase.com/20251107003015.png)

Dessutom kan fält som kan ändras av godkännaren läggas till i hanteringsformuläret. Dessa fält visas i formuläret när godkännaren hanterar godkännandet. Godkännaren kan ändra värdena för dessa fält, och vid inskickning uppdateras både data för godkännandet och en ögonblicksbild av motsvarande data i godkännandeprocessen samtidigt.

![Konfiguration av gränssnitt_Ändra fält för godkännandeinnehåll](https://static-docs.nocobase.com/20251107003206.png)

#### "Godkänn" och "Avvisa"

Bland godkännandeåtgärdsknapparna är "Godkänn" och "Avvisa" avgörande åtgärder. Efter inskickning är godkännarens hantering för denna nod slutförd. Ytterligare fält som behöver fyllas i vid inskickning kan läggas till i popup-fönstret "Hanteringskonfiguration" för åtgärdsknappen, till exempel "Kommentar".

![Konfiguration av gränssnitt_Hanteringskonfiguration](https://static-docs.nocobase.com/20251107003314.png)

#### "Returnera"

"Returnera" är också en avgörande åtgärd. Förutom att konfigurera kommentarer kan ni även konfigurera vilka noder som det går att returnera till:

![Konfiguration av returnering](https://static-docs.nocobase.com/20251107003555.png)

#### "Omfördela" och "Lägg till signatär"

"Omfördela" och "Lägg till signatär" är icke-avgörande åtgärder som används för att dynamiskt justera godkännarna i godkännandeprocessen. "Omfördela" innebär att den aktuella användarens godkännandeuppgift överlämnas till en annan användare för hantering. "Lägg till signatär" innebär att en godkännare läggs till före eller efter den aktuella godkännaren, och den nya godkännaren fortsätter godkännandeprocessen tillsammans.

Efter att ni har aktiverat åtgärdsknapparna "Omfördela" eller "Lägg till signatär" behöver ni välja