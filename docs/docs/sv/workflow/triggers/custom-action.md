---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Anpassad åtgärdshändelse

## Introduktion

NocoBase har inbyggda vanliga dataåtgärder (lägg till, ta bort, uppdatera, visa, etc.). När dessa åtgärder inte räcker till för komplexa affärsbehov kan ni använda anpassade åtgärdshändelser i ett arbetsflöde. Genom att koppla denna händelse till en "Utlös arbetsflöde"-knapp i ett sidblock, kommer ett arbetsflöde för anpassade åtgärder att utlösas när en användare klickar på den.

## Skapa ett arbetsflöde

När ni skapar ett arbetsflöde, välj "Anpassad åtgärdshändelse":

![Skapa arbetsflöde för "Anpassad åtgärdshändelse"](https://static-docs.nocobase.com/20240509091820.png)

## Utlösarkonfiguration

### Kontexttyp

> v.1.6.0+

Kontexttypen avgör vilka blockknappar arbetsflödet kan kopplas till:

*   Ingen kontext: En global händelse som kan kopplas till åtgärdsknappar i åtgärdsfältet och datablock.
*   Enkel post: Kan kopplas till åtgärdsknappar i datablock som tabellrader, formulär och detaljvyer.
*   Flera poster: Kan kopplas till massåtgärdsknappar i en tabell.

![Utlösarkonfiguration_Kontexttyp](https://static-docs.nocobase.com/20250215135808.png)

### Samling

När kontexttypen är Enkel post eller Flera poster, behöver ni välja den samling som datamodellen ska kopplas till:

![Utlösarkonfiguration_Välj samling](https://static-docs.nocobase.com/20250215135919.png)

### Relationsdata att använda

Om ni behöver använda relationsdata från den utlösande dataraden i arbetsflödet, kan ni välja djupa relationsfält här:

![Utlösarkonfiguration_Välj relationsdata att använda](https://static-docs.nocobase.com/20250215135955.png)

Dessa fält kommer automatiskt att förladdas till arbetsflödets kontext efter att händelsen utlöses, så att de kan användas i arbetsflödet.

## Åtgärdskonfiguration

Konfigurationen av åtgärdsknappar i olika block varierar beroende på vilken kontexttyp som är inställd i arbetsflödet.

### Ingen kontext

> v.1.6.0+

I åtgärdsfältet och andra datablock kan ni lägga till en "Utlös arbetsflöde"-knapp:

![Lägg till åtgärdsknapp i block_Åtgärdsfält](https://static-docs.nocobase.com/20250215221738.png)

![Lägg till åtgärdsknapp i block_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Lägg till åtgärdsknapp i block_Gantt-schema](https://static-docs.nocobase.com/20250215221810.png)

Efter att ni har lagt till knappen, koppla det tidigare skapade arbetsflödet utan kontext. Här är ett exempel med en knapp i åtgärdsfältet:

![Koppla arbetsflöde till knapp_Åtgärdsfält](https://static-docs.nocobase.com/20250215222120.png)

![Välj arbetsflöde att koppla_Ingen kontext](https://static-docs.nocobase.com/20250215222234.png)

### Enkel post

I vilket datablock som helst kan en "Utlös arbetsflöde"-knapp läggas till i åtgärdsfältet för en enskild post, till exempel i formulär, tabellrader, detaljvyer, etc.:

![Lägg till åtgärdsknapp i block_Formulär](https://static-docs.nocobase.com/20240509165428.png)

![Lägg till åtgärdsknapp i block_Tabellrad](https://static-docs.nocobase.com/20240509165340.png)

![Lägg till åtgärdsknapp i block_Detaljer](https://static-docs.nocobase.com/20240509165545.png)

Efter att ni har lagt till knappen, koppla det tidigare skapade arbetsflödet:

![Koppla arbetsflöde till knapp](https://static-docs.nocobase.com/20240509165631.png)

![Välj arbetsflöde att koppla](https://static-docs.nocobase.com/20240509165658.png)

Därefter kommer ett klick på denna knapp att utlösa den anpassade åtgärdshändelsen:

![Resultat av att klicka på knappen](https://static-docs.nocobase.com/20240509170453.png)

### Flera poster

> v.1.6.0+

I åtgärdsfältet för ett tabellblock, när ni lägger till en "Utlös arbetsflöde"-knapp, finns det ett extra alternativ för att välja kontexttyp: "Ingen kontext" eller "Flera poster":

![Lägg till åtgärdsknapp i block_Tabell](https://static-docs.nocobase.com/20250215222507.png)

När "Ingen kontext" väljs, är det en global händelse och kan endast kopplas till arbetsflöden av typen ingen kontext.

När "Flera poster" väljs, kan ni koppla ett arbetsflöde för flera poster, vilket kan användas för massåtgärder efter att ha valt flera poster (stöds för närvarande endast av tabeller). De tillgängliga arbetsflödena är då begränsade till de som är konfigurerade för att matcha samlingen i det aktuella datablocket:

![Välj arbetsflöde för flera poster](https://static-docs.nocobase.com/20250215224436.png)

När ni klickar på knappen för att utlösa, måste några datarader i tabellen vara markerade; annars kommer arbetsflödet inte att utlösas:

![Inga rader markerade för utlösning](https://static-docs.nocobase.com/20250215224736.png)

## Exempel

Anta till exempel att vi har en "Prover"-samling. För prover med statusen "Insamlade" behöver vi tillhandahålla en "Skicka för inspektion"-åtgärd. Denna åtgärd kommer först att kontrollera provets grundläggande information, sedan generera en "Inspektionspost" och slutligen ändra provets status till "Insänd". Denna serie av processer kan inte slutföras med enkla "lägg till, ta bort, uppdatera, visa"-knapptryckningar, så en anpassad åtgärdshändelse kan användas för att implementera det.

Skapa först en "Prover"-samling och en "Inspektionsposter"-samling, och mata in grundläggande testdata i Prover-samlingen:

![Exempel_Prover-samling](https://static-docs.nocobase.com/20240509172234.png)

Skapa sedan ett arbetsflöde för "Anpassad åtgärdshändelse". Om ni behöver snabb återkoppling från åtgärdsprocessen kan ni välja synkront läge (i synkront läge kan ni inte använda asynkrona noder som manuell hantering):

![Exempel_Skapa arbetsflöde](https://static-docs.nocobase.com/20240509173106.png)

I utlösarkonfigurationen, välj "Prover" för samlingen:

![Exempel_Utlösarkonfiguration](https://static-docs.nocobase.com/20240509173148.png)

Ordna logiken i processen enligt affärsbehoven. Till exempel, tillåt endast insändning för inspektion när indikatorparametern är större än `90`; annars, visa ett relevant meddelande:

![Exempel_Affärslogikarrangemang](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tips}
Noden "[Svarsmeddelande](../nodes/response-message.md)" kan användas i synkrona anpassade åtgärdshändelser för att returnera ett meddelande till klienten. Den kan inte användas i asynkront läge.
:::

Efter att ni har konfigurerat och aktiverat arbetsflödet, återgå till tabellgränssnittet och lägg till en "Utlös arbetsflöde"-knapp i tabellens åtgärdskolumn:

![Exempel_Lägg till åtgärdsknapp](https://static-docs.nocobase.com/20240509174525.png)

Välj sedan att koppla ett arbetsflöde i knappens konfigurationsmeny och öppna konfigurationsfönstret:

![Exempel_Öppna koppla arbetsflöde-fönster](https://static-docs.nocobase.com/20240509174633.png)

Lägg till det tidigare aktiverade arbetsflödet:

![Exempel_Välj arbetsflöde](https://static-docs.nocobase.com/20240509174723.png)

Efter att ni har skickat in, ändra knapptexten till åtgärdens namn, till exempel "Skicka för inspektion". Konfigurationsprocessen är nu klar.

För att använda det, välj valfri provdata i tabellen och klicka på knappen "Skicka för inspektion" för att utlösa den anpassade åtgärdshändelsen. Enligt den tidigare arrangerade logiken, om provets indikatorparameter är mindre än 90, kommer följande meddelande att visas efter klicket:

![Exempel_Indikator uppfyller inte insändningskriterier](https://static-docs.nocobase.com/20240509175026.png)

Om indikatorparametern är större än 90, kommer processen att utföras normalt, generera en "Inspektionspost" och ändra provets status till "Insänd":

![Exempel_Insändning lyckades](https://static-docs.nocobase.com/20240509175247.png)

Härmed är en enkel anpassad åtgärdshändelse klar. På samma sätt kan anpassade åtgärdshändelser användas för att implementera komplexa affärsoperationer som orderhantering eller rapportinlämning.

## Externt anrop

Utlösningen av anpassade åtgärdshändelser är inte begränsad till åtgärder i användargränssnittet; de kan också utlösas via HTTP API-anrop. Specifikt tillhandahåller anpassade åtgärdshändelser en ny åtgärdstyp för alla samlingsåtgärder för att utlösa arbetsflöden: `trigger`, som kan anropas med NocoBase standard API för åtgärder.

Ett arbetsflöde som utlöses av en knapp, som i exemplet, kan anropas så här:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Eftersom denna åtgärd är för en enskild post, måste ni, när ni anropar den för befintlig data, ange ID för dataraden och ersätta `<:id>`-delen i URL:en.

Om det anropas för ett formulär (till exempel för att skapa eller uppdatera), kan ni utelämna ID:t för ett formulär som skapar ny data, men ni måste skicka med den inskickade datan som exekveringskontext:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

För ett uppdateringsformulär behöver ni skicka med både ID för dataraden och den uppdaterade datan:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Om både ett ID och data skickas med, kommer dataraden som motsvarar ID:t att laddas först, och sedan kommer egenskaperna från det medskickade dataobjektet att användas för att skriva över den ursprungliga dataraden för att få den slutliga utlösande datakontexten.

:::warning{title="Obs"}
Om relationsdata skickas med, kommer även dessa att skrivas över. Var särskilt försiktig när ni hanterar inkommande data om förladdning av relationsdataobjekt är konfigurerat, för att undvika oväntade överskrivningar av relationsdata.
:::

Dessutom är URL-parametern `triggerWorkflows` arbetsflödets nyckel; flera arbetsflödesnycklar separeras med kommatecken. Denna nyckel kan erhållas genom att hålla muspekaren över arbetsflödets namn högst upp på arbetsflödesduken:

![Arbetsflöde_Nyckel_Visningsmetod](https://static-docs.nocobase.com/20240426135108.png)

Efter ett lyckat anrop kommer den anpassade åtgärdshändelsen för den motsvarande `samples`-samlingen att utlösas.

:::info{title="Tips"}
Eftersom externa anrop också måste baseras på användaridentitet, behöver ni, när ni anropar via HTTP API, precis som med förfrågningar som skickas från det vanliga gränssnittet, tillhandahålla autentiseringsinformation. Detta inkluderar `Authorization`-förfrågningshuvudet eller `token`-parametern (token som erhållits vid inloggning), samt `X-Role`-förfrågningshuvudet (användarens nuvarande rollnamn).
:::

Om ni behöver utlösa en händelse för en en-till-en-relationsdata (en-till-många stöds för närvarande inte) i denna åtgärd, kan ni använda `!` i parametern för att specificera relationsfältets utlösande data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Efter ett lyckat anrop kommer den anpassade åtgärdshändelsen för den motsvarande `categories`-samlingen att utlösas.

:::info{title="Tips"}
När ni utlöser en åtgärdshändelse via ett HTTP API-anrop, behöver ni också vara uppmärksam på arbetsflödets aktiveringsstatus och om samlingskonfigurationen matchar; annars kan anropet misslyckas eller resultera i ett fel.
:::