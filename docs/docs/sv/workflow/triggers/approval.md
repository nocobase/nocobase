---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/workflow/triggers/approval).
:::

# Godkännande

## Introduktion

Godkännande är en processtyp specifikt utformad för att initieras och hanteras av människor för att fastställa status för relevant data. Det används vanligtvis för kontorsautomation eller andra ärenden som kräver mänskliga beslut, till exempel för att skapa och hantera manuella processer för scenarier som "semesteransökan", "utläggsredovisning" och "godkännande av råvaruinköp".

Pluginet för godkännande erbjuder en dedikerad arbetsflödestyp (utlösare) "Godkännande (händelse)" och en dedikerad "Godkännande"-nod för denna process. I kombination med NocoBase unika anpassade samlingar och anpassade block kan ni snabbt och flexibelt skapa och hantera olika godkännandescenarier.

## Skapa ett arbetsflöde

När ni skapar ett arbetsflöde, välj typen "Godkännande" för att skapa ett godkännandearbetsflöde:

![Godkännandeutlösare_Skapa godkännandearbetsflöde](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Därefter, i arbetsflödeskonfigurationsgränssnittet, klickar ni på utlösaren för att öppna en dialogruta för ytterligare konfiguration.

## Utlösarkonfiguration

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Koppla en samling

NocoBase plugin för godkännande är utformat för flexibilitet och kan användas med vilken anpassad samling som helst. Detta innebär att godkännandekonfigurationen inte behöver definiera om datamodellen, utan direkt återanvänder redan skapade samlingar. Efter att ni har gått in i utlösarkonfigurationen måste ni därför först välja en samling för att bestämma vilken samlings data processen ska gälla för:

![Godkännandeutlösare_Utlösarkonfiguration_Välj samling](https://static-docs.nocobase.com/20251226103223.png)

### Utlösarmetod

När ett godkännande initieras för affärsdata kan ni välja mellan följande två utlösarmetoder:

*   **Innan data sparas**

    Initiera godkännandet innan den inskickade datan sparas. Detta är lämpligt för scenarier där data endast ska sparas efter att godkännande har beviljats. I detta läge är datan vid initieringen endast temporär och sparas formellt i motsvarande samling först efter att godkännandet har gått igenom.

*   **Efter att data har sparats**

    Initiera godkännandet efter att den inskickade datan har sparats. Detta är lämpligt för scenarier där data kan sparas först och sedan godkännas. I detta läge är datan redan sparad i motsvarande samling när godkännandet startar, och ändringar som görs under godkännandeprocessen kommer också att sparas.

### Plats för att initiera godkännande

Ni kan välja var i systemet godkännandet kan initieras:

*   **Endast i datablock**

    Ni kan koppla åtgärder från valfritt formulärblock för denna samling till arbetsflödet för att initiera godkännanden. Processen hanteras och spåras i godkännandeblocket för en enskild post, vilket vanligtvis är lämpligt för affärsdata.

*   **I både datablock och Att göra-centret**

    Förutom i datablock kan godkännanden även initieras och hanteras i det globala Att göra-centret, vilket vanligtvis är lämpligt för administrativa data.

### Vem som kan initiera godkännande

Ni kan konfigurera behörigheter baserat på användaromfång för att bestämma vilka användare som kan initiera godkännandet:

*   **Alla användare**

    Alla användare i systemet kan initiera detta godkännande.

*   **Endast valda användare**

    Endast användare inom det angivna omfånget tillåts initiera godkännandet. Flera val är möjliga.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Konfiguration av initiativtagarens formulärgränssnitt

Slutligen måste ni konfigurera initiativtagarens formulärgränssnitt. Detta gränssnitt används för inskick när ett godkännande initieras från godkännandecentret och när det återinitieras efter att initiativtagaren har återkallat det. Klicka på konfigurationsknappen för att öppna dialogrutan:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär](https://static-docs.nocobase.com/20251226130239.png)

Ni kan lägga till ett formulär för initiativtagarens gränssnitt baserat på den kopplade samlingen, eller lägga till beskrivande text (Markdown) för instruktioner och vägledning. Ett formulärblock måste läggas till, annars kommer initiativtagaren inte att kunna utföra några åtgärder i gränssnittet.

Efter att ni har lagt till ett formulärblock kan ni, precis som i ett vanligt formulärkonfigurationsgränssnitt, lägga till fältkomponenter från motsvarande samling och arrangera dem fritt för att organisera innehållet som ska fyllas i:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär_Fältkonfiguration](https://static-docs.nocobase.com/20251226130339.png)

Till skillnad från en direkt skicka-knapp kan ni även lägga till en åtgärdsknapp för "Spara utkast" för att stödja processer med temporär lagring:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär_Åtgärdskonfiguration_Spara](https://static-docs.nocobase.com/20251226130512.png)

Om ett godkännandearbetsflöde tillåter initiativtagaren att återkalla, måste ni aktivera knappen "Återkalla" i initiativtagarens gränssnittskonfiguration:

![Godkännandeutlösare_Utlösarkonfiguration_Tillåt återkallande](https://static-docs.nocobase.com/20251226130637.png)

När detta är aktiverat kan ett godkännande som initierats av detta arbetsflöde återkallas av initiativtagaren innan någon godkännare har behandlat det. Men efter att en godkännare i någon efterföljande godkännandenod har behandlat det, kan det inte längre återkallas.

:::info{title=Tips}
Efter att ni har aktiverat eller tagit bort återkalla-knappen måste ni klicka på spara och skicka i utlösarkonfigurationens dialogruta för att ändringarna ska träda i kraft.
:::

### Kortet "Min ansökan" <Badge>2.0+</Badge>

Används för att konfigurera uppgiftskorten i listan "Mina ansökningar" i Att göra-centret.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Ni kan fritt konfigurera vilka affärsfält (förutom relationsfält) eller godkännanderelaterad information som ska visas på kortet.

Efter att en godkännandeansökan har skapats kommer det anpassade uppgiftskortet att synas i listan i Att göra-centret:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Visningsläge för poster i flödet

*   **Ögonblicksbild**

    Den status för posten som initiativtagaren och godkännarna ser när de går in i processen. Efter inskick ser de endast de ändringar de själva har gjort – de ser inte uppdateringar som gjorts av andra senare.

*   **Senaste**

    Initiativtagaren och godkännarna ser alltid den senaste versionen av posten under hela processen, oavsett vilken status posten hade innan deras åtgärd. När processen är avslutad ser de den slutgiltiga versionen av posten.

## Godkännandenod

I ett godkännandearbetsflöde måste ni använda den dedikerade "Godkännande"-noden för att konfigurera den operativa logiken för godkännare att behandla (godkänna, avvisa eller returnera) det initierade godkännandet. "Godkännande"-noden kan endast användas i godkännandearbetsflöden. Se [Godkännandenod](../nodes/approval.md) för detaljer.

:::info{title=Tips}
Om ett godkännandearbetsflöde inte innehåller några "Godkännande"-noder kommer arbetsflödet att godkännas automatiskt.
:::

## Konfiguration för att initiera godkännande

Efter att ni har konfigurerat och aktiverat ett godkännandearbetsflöde kan ni koppla det till skicka-knappen i motsvarande samlings formulär, så att användare kan initiera ett godkännande vid inskick:

![Initiera godkännande_Koppla arbetsflöde](https://static-docs.nocobase.com/20251226110710.png)

Därefter kommer en användares inskick av formuläret att utlösa det motsvarande godkännandearbetsflödet. Den inskickade datan sparas inte bara i motsvarande samling, utan tas även som en ögonblicksbild i godkännandeflödet för efterföljande godkännare att granska.

:::info{title=Tips}
Knappen för att initiera ett godkännande stöder för närvarande endast "Skicka"- (eller "Spara"-) knappen i ett formulär för att skapa eller uppdatera. Den stöder inte knappen "Utlös arbetsflöde" (denna knapp kan endast kopplas till "Anpassade åtgärdshändelser").
:::

## Att göra-center

Att göra-centret erbjuder en enhetlig ingång där användare enkelt kan se och hantera sina uppgifter. Godkännanden initierade av den aktuella användaren och väntande uppgifter kan nås via Att göra-centret i det övre verktygsfältet, och olika typer av uppgifter kan visas via navigeringen till vänster.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Mina inskickade

#### Visa initierade godkännanden

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Initiera ett nytt godkännande direkt

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Mina att göra-uppgifter

#### Att göra-lista

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Att göra-detaljer

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Initiativtagare

#### Initiera från samling

För att initiera från ett datablock kan ni göra ett anrop som detta (med skapa-knappen för samlingen `posts` som exempel):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

URL-parametern `triggerWorkflows` är arbetsflödets nyckel; flera arbetsflöden separeras med kommatecken. Denna nyckel kan erhållas genom att hålla muspekaren över arbetsflödets namn högst upp på arbetsflödesduken:

![Arbetsflöde_nyckel_visningssätt](https://static-docs.nocobase.com/20240426135108.png)

Vid ett lyckat anrop kommer godkännandearbetsflödet för motsvarande `posts`-samling att utlösas.

:::info{title="Tips"}
Eftersom externa anrop också måste baseras på användaridentitet, måste autentiseringsinformation tillhandahållas vid anrop via HTTP API, precis som för förfrågningar från det vanliga gränssnittet. Detta inkluderar `Authorization`-huvudet eller `token`-parametern (token erhållen vid inloggning), samt `X-Role`-huvudet (användarens aktuella rollnamn).
:::

Om ni behöver utlösa en händelse för en-till-en-relaterad data i denna åtgärd (en-till-många stöds ännu inte), kan ni använda `!` i parametern för att specificera utlösardata för relationsfältet:

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

Vid ett lyckat anrop kommer godkännandehändelsen för motsvarande `categories`-samling att utlösas.

:::info{title="Tips"}
När ni utlöser en händelse efter en åtgärd via HTTP API måste ni också kontrollera arbetsflödets aktiveringsstatus och om samlingskonfigurationen matchar, annars kan anropet misslyckas eller resultera i ett fel.
:::

#### Initiera från godkännandecenter

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametrar**

* `collectionName`: Namnet på målsamlingen för att initiera godkännandet. Obligatoriskt.
* `workflowId`: ID för det arbetsflöde som används för att initiera godkännandet. Obligatoriskt.
* `data`: Fälten för samlingsposten som skapas vid initiering. Obligatoriskt.
* `status`: Status för posten som skapas vid initiering. Obligatoriskt. Möjliga värden inkluderar:
  * `0`: Utkast, innebär att posten sparas men inte skickas för godkännande.
  * `2`: Skicka för godkännande, innebär att initiativtagaren skickar in ansökan och går in i godkännandeprocessen.

#### Spara och skicka in

När ett initierat (eller återkallat) godkännande är i utkaststatus kan ni spara eller skicka in det igen via följande gränssnitt:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Hämta lista över initierade godkännanden

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Återkalla

Initiativtagaren kan återkalla en post som för närvarande är under godkännande via följande gränssnitt:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametrar**

* `<approval id>`: ID för den godkännandepost som ska återkallas. Obligatoriskt.

### Godkännare

När arbetsflödet når en godkännandenod skapas en att göra-uppgift för den aktuella godkännaren. Godkännaren kan slutföra uppgiften via gränssnittet eller via HTTP API.

#### Hämta godkännandeposter

Att göra-uppgifter är godkännandeposter. Ni kan hämta alla den aktuella användarens godkännandeposter via följande gränssnitt:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Eftersom `approvalRecords` är en samlingsresurs kan ni använda vanliga frågeparametrar som `filter`, `sort`, `pageSize` och `page`.

#### Hämta en enskild godkännandepost

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Godkänna och avvisa

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametrar**

* `<record id>`: ID för posten som ska behandlas. Obligatoriskt.
* `status`: Status för godkännandebehandlingen, `2` för "Godkänn", `-1` för "Avvisa". Obligatoriskt.
* `comment`: Kommentar för behandlingen. Valfritt.
* `data`: Ändringar som ska göras i samlingsposten vid den aktuella noden efter godkännande. Valfritt (endast vid godkännande).

#### Returnera <Badge>v1.9.0+</Badge>

Före version v1.9.0 användes samma gränssnitt för returnering som för "Godkänn" och "Avvisa", med `"status": 1`.

Från och med version v1.9.0 har returnering ett eget gränssnitt:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametrar**

* `<record id>`: ID för posten som ska behandlas. Obligatoriskt.
* `returnToNodeKey`: Nyckel för målnoden att returnera till. Valfritt. Om noden har konfigurerats med ett intervall av noder som kan returneras till, kan denna parameter användas för att ange vilken nod. Om ingen konfiguration finns behövs inget värde, och den returneras som standard till startpunkten för ny inskickning av initiativtagaren.

#### Transignera (Delegera)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametrar**

* `<record id>`: ID för posten som ska behandlas. Obligatoriskt.
* `assignee`: Användar-ID för den person som uppgiften delegeras till. Obligatoriskt.

#### Gemensamt godkännande (Lägg till signatär)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametrar**

* `<record id>`: ID för posten som ska behandlas. Obligatoriskt.
* `assignees`: Lista med användar-ID:n för de som läggs till. Obligatoriskt.
* `order`: Ordningen för tillägget, `-1` för före "mig", `1` för efter "mig".