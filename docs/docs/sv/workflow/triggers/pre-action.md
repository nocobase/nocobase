---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Före åtgärd-händelse

## Introduktion

Pluginet för Före åtgärd-händelser erbjuder en mekanism för att avlyssna åtgärder. Det kan triggas efter att en begäran om att skapa, uppdatera eller radera en åtgärd har skickats in, men innan den har behandlats.

Om en "Avsluta arbetsflöde"-nod körs i det triggade arbetsflödet, eller om någon annan nod misslyckas med att köras (på grund av ett fel eller annan ofullständig körning), kommer formuläråtgärden att avlyssnas. Annars kommer den avsedda åtgärden att utföras som vanligt.

Genom att använda det tillsammans med noden "Svarsmeddelande" kan ni konfigurera ett svarsmeddelande som skickas tillbaka till klienten, för att ge lämplig information. Före åtgärd-händelser kan användas för affärsvalidering eller logikkontroller för att godkänna eller avlyssna klientens begäranden om att skapa, uppdatera och radera åtgärder.

## Konfiguration av triggare

### Skapa triggare

När ni skapar ett arbetsflöde, välj typen "Före åtgärd-händelse":

![Skapa Före åtgärd-händelse](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Välj samling

I triggaren för ett avlyssnande arbetsflöde är det första ni behöver konfigurera den samling som motsvarar åtgärden:

![Avlyssningshändelsekonfiguration_Samling](https://static-docs.nocobase.com/8f7122caca1f5425e2b472053f89baba.png)

Välj sedan avlyssningsläge. Ni kan välja att endast avlyssna åtgärdsknappen som är kopplad till detta arbetsflöde, eller att avlyssna alla valda åtgärder för denna samling (oavsett vilket formulär de kommer ifrån, och utan att behöva koppla till ett specifikt arbetsflöde):

### Avlyssningsläge

![Avlyssningshändelsekonfiguration_Avlyssningsläge](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

De åtgärdstyper som för närvarande stöds är "Skapa", "Uppdatera" och "Radera". Ni kan välja flera åtgärdstyper samtidigt.

## Åtgärdskonfiguration

Om ni har valt läget "Trigga avlyssning endast när ett formulär kopplat till detta arbetsflöde skickas in" i triggarkonfigurationen, behöver ni även gå tillbaka till formulärgränssnittet och koppla detta arbetsflöde till den relevanta åtgärdsknappen:

![Lägg till order_Koppla arbetsflöde](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

I konfigurationen för att koppla arbetsflödet, välj det relevanta arbetsflödet. Vanligtvis räcker det att standardkontexten för triggande data är "Hela formulärdata":

![Välj arbetsflöde att koppla](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Tips}
De knappar som kan kopplas till en Före åtgärd-händelse stöder för närvarande endast "Skicka" (eller "Spara"), "Uppdatera data" och "Radera" i formulär för att skapa eller uppdatera. Knappen "Trigga arbetsflöde" stöds inte (den kan endast kopplas till en "Efter åtgärd-händelse").
:::

## Villkor för avlyssning

I en "Före åtgärd-händelse" finns det två villkor som kan leda till att den motsvarande åtgärden avlyssnas:

1. Arbetsflödet når en "Avsluta arbetsflöde"-nod. Liksom i tidigare instruktioner, när data som triggade arbetsflödet inte uppfyller de förinställda villkoren i en "Villkors"-nod, kommer det att gå in i "Nej"-grenen och köra "Avsluta arbetsflöde"-noden. Vid denna punkt avslutas arbetsflödet, och den begärda åtgärden avlyssnas.
2. En nod i arbetsflödet misslyckas med att köras, inklusive exekveringsfel eller andra undantag. I detta fall avslutas arbetsflödet med en motsvarande status, och den begärda åtgärden kommer också att avlyssnas. Om arbetsflödet till exempel anropar extern data via en "HTTP-förfrågan" och förfrågan misslyckas, kommer arbetsflödet att avslutas med en misslyckad status och samtidigt avlyssna den motsvarande åtgärdsbegäran.

När avlyssningsvillkoren är uppfyllda kommer den motsvarande åtgärden inte längre att utföras. Om till exempel en orderinlämning avlyssnas, kommer ingen motsvarande orderdata att skapas.

## Relaterade parametrar för den motsvarande åtgärden

I ett arbetsflöde av typen "Före åtgärd-händelse" kan olika data från triggaren användas som variabler i arbetsflödet för olika åtgärder:

| Åtgärdstyp \ Variabel | "Operatör" | "Operatörsroll-ID" | Åtgärdsparameter: "ID" | Åtgärdsparameter: "Inskickat dataobjekt" |
| --------------------- | ---------- | ------------------ | ---------------------- | ---------------------------------------- |
| Skapa en post         | ✓          | ✓                  | -                      | ✓                                        |
| Uppdatera en post     | ✓          | ✓                  | ✓                      | ✓                                        |
| Radera en eller flera poster | ✓          | ✓                  | ✓                      | -                                        |

:::info{title=Tips}
Variabeln "Triggardata / Åtgärdsparametrar / Inskickat dataobjekt" i en Före åtgärd-händelse är inte den faktiska datan från databasen, utan snarare de parametrar som skickats med åtgärden. Om ni behöver den faktiska datan från databasen måste ni hämta den med hjälp av en "Fråga data"-nod inom arbetsflödet.

Vid en raderingsåtgärd är "ID" i åtgärdsparametrarna ett enkelt värde när det gäller en enskild post, men det är en array när det gäller flera poster.
:::

## Skicka svarsmeddelande

Efter att ni har konfigurerat triggaren kan ni anpassa den relevanta bedömningslogiken i arbetsflödet. Vanligtvis använder ni grenläget för "Villkors"-noden för att, baserat på resultatet av specifika affärsvillkor, bestämma om ni ska "Avsluta arbetsflöde" och returnera ett förinställt "Svarsmeddelande":

![Avlyssnande arbetsflödeskonfiguration](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Härmed är konfigurationen av det motsvarande arbetsflödet klar. Ni kan nu försöka skicka in data som inte uppfyller villkoren i arbetsflödets villkorsnod för att trigga avlyssningslogiken. Då kommer ni att se det returnerade svarsmeddelandet:

![Fel svarsmeddelande](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Svarsmeddelandets status

Om "Avsluta arbetsflöde"-noden är konfigurerad att avslutas med statusen "Lyckades", kommer åtgärdsbegäran fortfarande att avlyssnas när denna nod körs. Dock kommer det returnerade svarsmeddelandet att visas med statusen "Lyckades" (istället för "Fel"):

![Svarsmeddelande med status Lyckades](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Exempel

Med utgångspunkt i de grundläggande instruktionerna ovan, låt oss ta ett scenario med "Orderinlämning" som exempel. Anta att vi behöver kontrollera lagersaldot för alla produkter som användaren valt när de skickar in en order. Om lagersaldot för någon vald produkt är otillräckligt, avlyssnas orderinlämningen och ett motsvarande meddelande returneras. Arbetsflödet kommer att loopa igenom och kontrollera varje produkt tills lagersaldot för alla produkter är tillräckligt, varpå det fortsätter och skapar orderdata för användaren.

Övriga steg är desamma som i instruktionerna. Men eftersom en order involverar flera produkter, behöver ni, förutom att lägga till en många-till-många-relation "Order" <-- M:1 -- "Orderdetalj" -- 1:M --> "Produkt" i datamodellen, även lägga till en "Loop"-nod i arbetsflödet för "Före åtgärd-händelse" för att iterativt kontrollera om lagersaldot för varje produkt är tillräckligt:

![Exempel_Loop-kontroll arbetsflöde](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Objektet för loopen väljs som arrayen "Orderdetalj" från de inskickade orderdata:

![Exempel_Loop-objektkonfiguration](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Villkorsnoden inom loopen används för att avgöra om lagersaldot för det aktuella produktobjektet i loopen är tillräckligt:

![Exempel_Villkor i loop](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Övriga konfigurationer är desamma som i grundläggande användning. När ordern slutligen skickas in, om någon produkt har otillräckligt lagersaldo, kommer orderinlämningen att avlyssnas och ett motsvarande meddelande returneras. Vid testning, försök att skicka in en order med flera produkter, där en har otillräckligt lagersaldo och en annan har tillräckligt. Ni kan då se det returnerade svarsmeddelandet:

![Exempel_Svarsmeddelande efter inlämning](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Som ni kan se indikerar svarsmeddelandet inte att den första produkten, "iPhone 15 pro", är slut i lager, utan endast att den andra produkten, "iPhone 14 pro", är det. Detta beror på att i loopen hade den första produkten tillräckligt lagersaldo, så den avlyssnades inte, medan den andra produkten hade otillräckligt lagersaldo, vilket avlyssnade orderinlämningen.

## Extern anrop

Före åtgärd-händelsen injiceras under begäransbehandlingsfasen, så den stöder även att triggas via HTTP API-anrop.

För arbetsflöden som är lokalt kopplade till en åtgärdsknapp kan ni anropa dem på följande sätt (med skaparknappen för `posts`-samlingen som exempel):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

URL-parametern `triggerWorkflows` är arbetsflödets nyckel; flera arbetsflödesnycklar separeras med kommatecken. Denna nyckel kan erhållas genom att hålla muspekaren över arbetsflödets namn högst upp på arbetsflödesduken:

![Arbetsflöde_Nyckel_Visningsmetod](https://static-docs.nocobase.com/20240426135108.png)

Efter att ovanstående anrop har gjorts kommer Före åtgärd-händelsen för den motsvarande `posts`-samlingen att triggas. När det motsvarande arbetsflödet har behandlats synkront, skapas datan normalt och returneras.

Om det konfigurerade arbetsflödet når en "Slutnod" är logiken densamma som vid en gränssnittsåtgärd: begäran kommer att avlyssnas, och ingen data kommer att skapas. Om slutnodens status är konfigurerad som misslyckad, blir den returnerade svarsstatuskoden `400`; om den lyckas, blir den `200`.

Om en "Svarsmeddelande"-nod också är konfigurerad före slutnoden, kommer det genererade meddelandet också att returneras i svarsresultatet. Strukturen för ett fel är:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Meddelandestrukturen när "Slutnod" är konfigurerad för framgång är:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Tips}
Eftersom flera "Svarsmeddelande"-noder kan läggas till i ett arbetsflöde, är den returnerade meddelandedatastrukturen en array.
:::

Om Före åtgärd-händelsen är konfigurerad i globalt läge, behöver ni inte använda URL-parametern `triggerWorkflows` för att specificera det motsvarande arbetsflödet när ni anropar HTTP API:et. Det räcker med att anropa den motsvarande samlingsåtgärden för att trigga den.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Tips"}
När ni triggar en före åtgärd-händelse via ett HTTP API-anrop, behöver ni också vara uppmärksamma på arbetsflödets aktiveringsstatus och om samlingskonfigurationen matchar, annars kanske anropet inte lyckas eller så kan fel uppstå.
:::