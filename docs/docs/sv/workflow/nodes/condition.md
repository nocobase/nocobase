:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Villkor

## Introduktion

Liknar `if`-satser i programmeringsspråk och bestämmer det efterföljande arbetsflödets riktning baserat på resultatet av ett konfigurerat villkor.

## Skapa nod

Villkorsnoden har två lägen: ”Fortsätt om sant” och ”Förgrenas vid sant/falskt”. Ni måste välja ett av dessa lägen när ni skapar noden, och det kan inte ändras i nodens konfiguration efteråt.

![Villkor_Lägesval](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

I läget ”Fortsätt om sant”, när villkorets resultat är ”sant”, kommer arbetsflödet att fortsätta exekvera efterföljande noder. Annars kommer arbetsflödet att avslutas och avbrytas i förtid med statusen ”misslyckades”.

![Fortsätt om sant-läge](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Detta läge är lämpligt för scenarier där arbetsflödet inte ska fortsätta om villkoret inte uppfylls. Till exempel, en knapp för att skicka in ett formulär för en order är kopplad till en ”Före åtgärd”-händelse. Om lagersaldot för produkten i ordern är otillräckligt, ska ordergenereringen inte fortsätta, utan istället misslyckas och avslutas.

I läget ”Förgrenas vid sant/falskt” kommer villkorsnoden att skapa två efterföljande grenar, som motsvarar villkorets ”sanna” respektive ”falska” resultat. Varje gren kan konfigureras med sina egna efterföljande noder. Efter att någon av grenarna har slutfört sin exekvering, kommer den automatiskt att återförenas med villkorsnodens överordnade gren för att fortsätta exekvera de efterföljande noderna.

![Förgrenas vid sant/falskt-läge](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Detta läge är lämpligt för scenarier där olika åtgärder behöver utföras beroende på om villkoret uppfylls eller inte. Till exempel, att kontrollera om en viss data existerar: om den inte existerar, skapa den; om den existerar, uppdatera den.

## Nodkonfiguration

### Beräkningsmotor

För närvarande stöds tre motorer:

-   **Grundläggande**: Får ett logiskt resultat genom enkla binära beräkningar och ”OCH”/”ELLER”-gruppering.
-   **Math.js**: Beräknar uttryck som stöds av [Math.js](https://mathjs.org/)-motorn för att få ett logiskt resultat.
-   **Formula.js**: Beräknar uttryck som stöds av [Formula.js](https://formulajs.info/)-motorn för att få ett logiskt resultat.

I alla tre beräkningstyper kan variabler från arbetsflödets kontext användas som parametrar.