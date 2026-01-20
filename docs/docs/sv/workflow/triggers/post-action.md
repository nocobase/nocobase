---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Händelse efter åtgärd

## Introduktion

Alla dataändringar som användare gör i systemet utförs vanligtvis genom en åtgärd, oftast genom att klicka på en knapp. Denna knapp kan vara en skicka-knapp i ett formulär eller en åtgärdsknapp i ett datablock. Händelser efter åtgärd används för att koppla relevanta arbetsflöden till dessa knappåtgärder, så att en specifik process utlöses när användarens åtgärd har slutförts.

När ni till exempel lägger till eller uppdaterar data kan ni konfigurera alternativet ”Koppla arbetsflöde” för en knapp. Efter att åtgärden har slutförts utlöses det kopplade arbetsflödet.

På implementeringsnivå, eftersom hanteringen av händelser efter åtgärd sker i middleware-lagret (Koa:s middleware), kan HTTP API-anrop till NocoBase också utlösa definierade händelser efter åtgärd.

## Installation

Detta är en inbyggd **plugin** och kräver ingen installation.

## Konfiguration av utlösare

### Skapa arbetsflöde

När ni skapar ett **arbetsflöde**, väljer ni typen ”Händelse efter åtgärd”:

![Skapa arbetsflöde_Utlösare för händelse efter åtgärd](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Utförandeläge

För händelser efter åtgärd kan ni även välja utförandeläge som ”Synkront” eller ”Asynkront” när ni skapar dem:

![Skapa arbetsflöde_Välj synkront eller asynkront](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Om processen behöver utföras och returneras omedelbart efter användarens åtgärd, kan ni använda synkront läge. Annars är standardläget asynkront. I asynkront läge slutförs åtgärden omedelbart efter att **arbetsflödet** har utlösts, och **arbetsflödet** kommer att utföras sekventiellt i applikationens bakgrundskö.

### Konfigurera samling

Gå in i **arbetsflödets** arbetsyta, klicka på utlösaren för att öppna konfigurationsfönstret och välj först den **samling** ni vill koppla:

![Arbetsflödeskonfiguration_Välj samling](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Välj utlösningsläge

Välj sedan utlösningsläge, det finns två typer: lokalt läge och globalt läge:

![Arbetsflödeskonfiguration_Välj utlösningsläge](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Där:

*   Lokalt läge utlöses endast på åtgärdsknappar som har detta **arbetsflöde** kopplat. Att klicka på knappar utan detta **arbetsflöde** kopplat kommer inte att utlösa det. Ni kan bestämma om ni vill koppla detta **arbetsflöde** baserat på om formulär med olika syften ska utlösa samma process.
*   Globalt läge utlöses på alla konfigurerade åtgärdsknappar för **samlingen**, oavsett vilket formulär de kommer ifrån, och det finns inget behov av att koppla det motsvarande **arbetsflödet**.

I lokalt läge stöds för närvarande följande åtgärdsknappar för koppling:

*   ”Skicka”- och ”Spara”-knapparna i lägg till-formuläret.
*   ”Skicka”- och ”Spara”-knapparna i uppdateringsformuläret.
*   ”Uppdatera data”-knappen i datarader (tabell, lista, kanban, etc.).

### Välj åtgärdstyp

Om ni väljer globalt läge måste ni också välja åtgärdstyp. För närvarande stöds ”Skapa dataåtgärd” och ”Uppdatera dataåtgärd”. Båda åtgärderna utlöser **arbetsflödet** efter att åtgärden har lyckats.

### Välj förladdad relationsdata

Om ni behöver använda den associerade datan från den utlösande datan i efterföljande processer, kan ni välja de relationsfält som ska förladdas:

![Arbetsflödeskonfiguration_Förladda relation](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Efter utlösning kan ni direkt använda denna associerade data i processen.

## Åtgärdskonfiguration

För åtgärder i lokalt utlösningsläge, när **arbetsflödet** är konfigurerat, måste ni återgå till användargränssnittet och koppla **arbetsflödet** till formulärets åtgärdsknapp i det motsvarande datablocket.

**Arbetsflöden** som konfigurerats för ”Skicka”-knappen (inklusive ”Spara data”-knappen) kommer att utlösas efter att användaren har skickat in det motsvarande formuläret och dataåtgärden har slutförts.

![Händelse efter åtgärd_Skicka-knapp](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Välj ”Koppla **arbetsflöde**” från knappens konfigurationsmeny för att öppna konfigurationsfönstret för koppling. I fönstret kan ni konfigurera valfritt antal **arbetsflöden** som ska utlösas. Om inget konfigureras innebär det att ingen utlösning behövs. För varje **arbetsflöde** måste ni först specificera om den utlösande datan är hela formulärets data eller data från ett specifikt relationsfält i formuläret. Därefter, baserat på den **samling** som motsvarar den valda datamodellen, väljer ni det **arbetsflöde** som har konfigurerats för att matcha den **samlingsmodellen**.

![Händelse efter åtgärd_Konfiguration av kopplat arbetsflöde_Val av kontext](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Händelse efter åtgärd_Konfiguration av kopplat arbetsflöde_Val av arbetsflöde](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Tips"}
**Arbetsflödet** måste vara aktiverat för att kunna väljas i gränssnittet ovan.
:::

## Exempel

Här demonstrerar vi genom att använda en skapandeåtgärd.

Anta ett scenario med en ”Ansökan om utlägg”. Vi behöver utföra en automatisk granskning av beloppet och en manuell granskning för belopp som överstiger en viss gräns efter att en anställd har skickat in en utläggsbegäran. Endast ansökningar som godkänns i granskningen går vidare och hanteras sedan av ekonomiavdelningen.

Först kan vi skapa en **samling** för ”Utlägg” med följande fält:

*   Projektnamn: Enkelradstext
*   Sökande: Många-till-en (Användare)
*   Belopp: Nummer
*   Status: Enkelval (”Godkänd”, ”Behandlad”)

Därefter skapar vi ett **arbetsflöde** av typen ”Händelse efter åtgärd” och konfigurerar **samlingsmodellen** i utlösaren till att vara **samlingen** ”Utlägg”:

![Exempel_Utlösarkonfiguration_Välj samling](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

När **arbetsflödet** har aktiverats återkommer vi senare för att konfigurera processens specifika behandlingsnoder.

Sedan skapar vi ett tabellblock för **samlingen** ”Utlägg” i gränssnittet, lägger till en ”Lägg till”-knapp i verktygsfältet och konfigurerar de motsvarande formulärfälten. I konfigurationsalternativen för formulärets ”Skicka”-åtgärdsknapp öppnar vi dialogrutan ”Koppla **arbetsflöde**”, väljer hela formulärdatan som kontext, och väljer det **arbetsflöde** vi skapade tidigare:

![Exempel_Formulärknappskonfiguration_Koppla arbetsflöde](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

När formulärkonfigurationen är klar återgår vi till **arbetsflödets** logiska arrangemang. Till exempel, om beloppet är större än 500 kr, kräver vi en manuell granskning av en administratör; annars godkänns det direkt. Först efter godkännande skapas en utläggsregistrering och hanteras vidare av ekonomiavdelningen (utelämnas).

![Exempel_Behandlingsflöde](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Om vi bortser från den efterföljande hanteringen av ekonomiavdelningen, är konfigurationen av utläggsansökningsprocessen nu klar. När en anställd fyller i och skickar in en utläggsansökan, kommer det motsvarande **arbetsflödet** att utlösas. Om utläggsbeloppet är mindre än 500 kr, kommer en registrering automatiskt att skapas och vänta på ytterligare hantering av ekonomiavdelningen. Annars kommer det att granskas av en chef, och efter godkännande skapas också en registrering som lämnas över till ekonomiavdelningen.

Processen i detta exempel kan också konfigureras på en vanlig ”Skicka”-knapp. Ni kan besluta om en registrering ska skapas först innan efterföljande processer utförs, baserat på det specifika affärsscenariot.

## Externt anrop

Utlösningen av händelser efter åtgärd är inte begränsad till användargränssnittsåtgärder; de kan också utlösas via HTTP API-anrop.

:::info{title="Tips"}
När ni utlöser en händelse efter åtgärd via ett HTTP API-anrop, måste ni också vara uppmärksamma på **arbetsflödets** aktiverade status och om **samlingskonfigurationen** matchar, annars kan anropet misslyckas eller ett fel uppstå.
:::

För **arbetsflöden** som är lokalt kopplade till en åtgärdsknapp kan ni anropa dem så här (med `posts`-**samlingens** skaparknapp som exempel):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Där URL-parametern `triggerWorkflows` är nyckeln för **arbetsflödet**, med flera **arbetsflöden** separerade med kommatecken. Denna nyckel kan erhållas genom att hålla muspekaren över **arbetsflödets** namn högst upp i **arbetsflödets** arbetsyta:

![Arbetsflöde_Nyckel_Visningsmetod](https://static-docs.nocobase.com/20240426135108.png)

Efter att ovanstående anrop lyckats, kommer händelsen efter åtgärd för den motsvarande `posts`-**samlingen** att utlösas.

:::info{title="Tips"}
Eftersom externa anrop också måste baseras på användaridentitet, måste autentiseringsinformation tillhandahållas vid anrop via HTTP API, precis som för förfrågningar som skickas från det vanliga gränssnittet. Detta inkluderar `Authorization`-förfrågningshuvudet eller `token`-parametern (token som erhålls vid inloggning), samt `X-Role`-förfrågningshuvudet (användarens nuvarande rollnamn).
:::

Om ni behöver utlösa en händelse för en en-till-en-relationsdata i denna åtgärd (många-till-många stöds inte för närvarande), kan ni använda `!` i parametern för att specificera relationsfältets utlösande data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Efter att ovanstående anrop lyckats, kommer händelsen efter åtgärd för den motsvarande `categories`-**samlingen** att utlösas.

:::info{title="Tips"}
Om händelsen är konfigurerad i globalt läge, behöver ni inte använda URL-parametern `triggerWorkflows` för att specificera det motsvarande **arbetsflödet**. Det räcker med att direkt anropa den motsvarande **samlingsåtgärden** för att utlösa den.
:::

## Vanliga frågor

### Skillnad från händelse före åtgärd

*   Händelse före åtgärd: Utlöses innan en åtgärd (som att lägga till, uppdatera, etc.) utförs. Innan åtgärden utförs kan den begärda datan valideras eller behandlas i **arbetsflödet**. Om **arbetsflödet** avbryts (begäran avlyssnas), kommer åtgärden (lägg till, uppdatera, etc.) inte att utföras.
*   Händelse efter åtgärd: Utlöses efter att en användares åtgärd har lyckats. Vid denna tidpunkt har datan framgångsrikt skickats in och sparats i databasen, och relaterade processer kan fortsätta att behandlas baserat på det lyckade resultatet.

Som visas i figuren nedan:

![Åtgärdsutförandeordning](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Skillnad från samlingshändelse

Händelser efter åtgärd och **samlingshändelser** har likheter, då båda är processer som utlöses efter dataändringar. Deras implementeringsnivåer skiljer sig dock åt; händelser efter åtgärd är på API-nivå, medan **samlingshändelser** är för dataändringar i **samlingen**.

**Samlingshändelser** ligger närmare systemets underliggande lager. I vissa fall kan en dataändring orsakad av en händelse utlösa en annan händelse, vilket skapar en kedjereaktion. Särskilt när data i vissa associerade **samlingar** också ändras under operationen av den aktuella **samlingen**, kan händelser relaterade till den associerade **samlingen** också utlösas.

Utlösningen av **samlingshändelser** inkluderar inte användarrelaterad information. Händelser efter åtgärd är däremot närmare användarsidan och är resultatet av användaråtgärder. **Arbetsflödets** kontext kommer också att innehålla användarrelaterad information, vilket gör dem lämpliga för att hantera processer relaterade till användaråtgärder. I NocoBase:s framtida design kan fler händelser efter åtgärd som kan användas för utlösning komma att utökas, så **det rekommenderas starkare att använda händelser efter åtgärd** för att hantera processer där dataändringar orsakas av användaråtgärder.

En annan skillnad är att händelser efter åtgärd kan kopplas lokalt till specifika formulärknappar. Om det finns flera formulär kan vissa formulärutskick utlösa händelsen medan andra inte gör det. **Samlingshändelser** gäller däremot för dataändringar i hela **samlingen** och kan inte kopplas lokalt.