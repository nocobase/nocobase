---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Anropa arbetsflöde

## Introduktion

Används för att anropa andra arbetsflöden från ett befintligt arbetsflöde. Ni kan använda variabler från det aktuella arbetsflödet som indata till underarbetsflödet, och sedan använda underarbetsflödets utdata som variabler i det aktuella arbetsflödet för användning i efterföljande noder.

Processen för att anropa ett arbetsflöde visas i figuren nedan:

![20241230134634](https://static-docs.nocobase.com/20241230134634.png)

Genom att anropa arbetsflöden kan ni återanvända gemensam processlogik, som att skicka e-post eller SMS. Det gör det också möjligt att dela upp ett komplext arbetsflöde i flera underarbetsflöden för enklare hantering och underhåll.

I grunden gör ett arbetsflöde ingen skillnad på om en process är ett underarbetsflöde eller inte. Vilket arbetsflöde som helst kan anropas som ett underarbetsflöde av andra arbetsflöden, och det kan även anropa andra arbetsflöden. Alla arbetsflöden är likvärdiga; det finns bara ett förhållande av att anropa och bli anropad.

På samma sätt används anrop av arbetsflöden på två ställen:

1. I huvudarbetsflödet: Som anropare, anropar det andra arbetsflöden via noden "Anropa arbetsflöde".
2. I underarbetsflödet: Som den anropade parten, sparar det variabler som behöver matas ut från det aktuella arbetsflödet via noden "Arbetsflödesutdata". Dessa variabler kan sedan användas av efterföljande noder i det arbetsflöde som anropade det.

## Skapa nod

I konfigurationsgränssnittet för arbetsflöden klickar ni på plusknappen ("+") i arbetsflödet för att lägga till en nod för "Anropa arbetsflöde":

![Add Invoke Workflow Node](https://static-docs.nocobase.com/20241230001323.png)

## Konfigurera nod

### Välj arbetsflöde

Välj det arbetsflöde ni vill anropa. Ni kan använda sökfältet för en snabb sökning:

![Select Workflow](https://static-docs.nocobase.com/20241230001534.png)

:::info{title=Tips}
* Inaktiverade arbetsflöden kan också anropas som underarbetsflöden.
* När det aktuella arbetsflödet är i synkront läge kan det endast anropa underarbetsflöden som också är i synkront läge.
:::

### Konfigurera arbetsflödets triggervariabler

Efter att ni har valt ett arbetsflöde behöver ni även konfigurera triggervariablerna som indata för att trigga underarbetsflödet. Ni kan antingen välja statiska data direkt eller variabler från det aktuella arbetsflödet:

![Configure Trigger Variables](https://static-docs.nocobase.com/20241230162722.png)

Olika typer av triggrar kräver olika variabler, vilka kan konfigureras i formuläret efter behov.

## Noden Arbetsflödesutdata

Se innehållet i noden [Arbetsflödesutdata](./output.md) för att konfigurera underarbetsflödets utdatavariabler.

## Använda arbetsflödesutdata

Tillbaka i huvudarbetsflödet, i andra noder under noden "Anropa arbetsflöde", när ni vill använda underarbetsflödets utdatavärde, kan ni välja resultatet från noden "Anropa arbetsflöde". Om underarbetsflödet matar ut ett enkelt värde, som en sträng, ett nummer, ett logiskt värde eller ett datum (datum är en sträng i UTC-format), kan det användas direkt. Om det är ett komplext objekt (som ett objekt från en samling), måste det först mappas via en JSON-parsingsnod innan dess egenskaper kan användas; annars kan det endast användas som ett helt objekt.

Om underarbetsflödet inte har en nod för arbetsflödesutdata konfigurerad, eller om det inte har något utdatavärde, kommer ni endast att få ett null-värde (`null`) när ni använder resultatet från noden "Anropa arbetsflöde" i huvudarbetsflödet.