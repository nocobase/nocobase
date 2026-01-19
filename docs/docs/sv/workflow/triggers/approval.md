---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Godkännande

## Introduktion

Godkännande är en typ av process som är specifikt utformad för att initieras och hanteras manuellt för att bestämma statusen för relevant data. Det används ofta för kontorsautomation eller andra processer som involverar manuella beslut, till exempel för att skapa och hantera manuella arbetsflöden för scenarier som "semesteransökningar", "utläggsrapporter" och "godkännande av råvaruinköp".

Pluginet för godkännande erbjuder en dedikerad arbetsflödestyp (utlösare) "Godkännande (händelse)" och en dedikerad "Godkännande"-nod för denna process. I kombination med NocoBase unika anpassade samlingar och anpassade block kan ni snabbt och flexibelt skapa och hantera olika godkännandescenarier.

## Skapa ett arbetsflöde

När ni skapar ett arbetsflöde, välj typen "Godkännande" för att skapa ett godkännandearbetsflöde:

![Godkännandeutlösare_Skapa godkännandearbetsflöde](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Därefter, i arbetsflödeskonfigurationsgränssnittet, klickar ni på utlösaren för att öppna en dialogruta för ytterligare konfiguration.

## Utlösarkonfiguration

### Koppla en samling

NocoBase plugin för godkännande är utformat för flexibilitet och kan användas med vilken anpassad samling som helst. Detta innebär att ni inte behöver konfigurera om datamodellen för godkännandekonfigurationen, utan istället direkt återanvända en befintlig samling. Därför, efter att ni har gått in i utlösarkonfigurationen, måste ni först välja en samling för att bestämma vilken samlings data som ska utlösa detta arbetsflöde vid skapande eller uppdatering:

![Godkännandeutlösare_Utlösarkonfiguration_Välj samling](https://static-docs.nocobase.com/8232a441b1e28d2752b8f601132c82d.png)

Därefter, i formuläret för att skapa (eller redigera) data för den motsvarande samlingen, kopplar ni detta arbetsflöde till skicka-knappen:

![Initiera godkännande_Koppla arbetsflöde](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Efter detta kommer en användares inskick av formuläret att utlösa det motsvarande godkännandearbetsflödet. Den inskickade datan sparas inte bara i den relevanta samlingen, utan tas också som en ögonblicksbild i godkännandeflödet för att senare kunna granskas och användas av godkännare.

### Återkalla

Om ett godkännandearbetsflöde tillåter initiativtagaren att återkalla det, måste ni aktivera knappen "Återkalla" i initiativtagarens gränssnittskonfiguration:

![Godkännandeutlösare_Utlösarkonfiguration_Tillåt återkallande](https://static-docs.nocobase.com/20251029232544.png)

När detta är aktiverat kan ett godkännande som initierats av detta arbetsflöde återkallas av initiativtagaren innan någon godkännare har behandlat det. Men efter att en godkännare i en efterföljande godkännandenod har behandlat det, kan det inte längre återkallas.

:::info{title=Obs}
Efter att ni har aktiverat eller tagit bort återkalla-knappen, måste ni klicka på spara och skicka i utlösarkonfigurationens dialogruta för att ändringarna ska träda i kraft.
:::

### Konfiguration av initiativtagarens formulärgränssnitt

Slutligen måste ni konfigurera initiativtagarens formulärgränssnitt. Detta gränssnitt kommer att användas för inskick när ett godkännande initieras från godkännandecentret och när det återinitieras efter ett återkallande. Klicka på konfigurationsknappen för att öppna dialogrutan:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

Ni kan lägga till ett formulär för initiativtagarens gränssnitt baserat på den kopplade samlingen, eller lägga till beskrivande text (Markdown) för instruktioner och vägledning. Formuläret är obligatoriskt; annars kommer initiativtagaren inte att kunna utföra några åtgärder när de kommer in i gränssnittet.

Efter att ni har lagt till ett formulärblock kan ni, precis som i ett vanligt formulärkonfigurationsgränssnitt, lägga till fältkomponenter från den motsvarande samlingen och arrangera dem efter behov för att organisera innehållet som ska fyllas i formuläret:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär_Fältkonfiguration](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

Förutom den direkta skicka-knappen kan ni också lägga till en "Spara som utkast"-åtgärdsknapp för att stödja en process med tillfällig lagring:

![Godkännandeutlösare_Utlösarkonfiguration_Initiativtagarens formulär_Åtgärdskonfiguration](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## Godkännandenod

I ett godkännandearbetsflöde måste ni använda den dedikerade "Godkännande"-noden för att konfigurera den operativa logiken för godkännare att behandla (godkänna, avvisa eller returnera) det initierade godkännandet. "Godkännande"-noden kan endast användas i godkännandearbetsflöden. Se [Godkännandenod](../nodes/approval.md) för mer information.

## Konfigurera initiering av godkännande

Efter att ni har konfigurerat och aktiverat ett godkännandearbetsflöde, kan ni koppla det till skicka-knappen i den motsvarande samlingens formulär, så att användare kan initiera ett godkännande vid inskick:

![Initiera godkännande_Koppla arbetsflöde](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

Efter att arbetsflödet har kopplats, initieras ett godkännande när en användare skickar in det aktuella formuläret.

:::info{title=Obs}
För närvarande stöder knappen för att initiera ett godkännande endast "Skicka"- (eller "Spara"-) knappen i ett formulär för att skapa eller uppdatera. Den stöder inte knappen "Skicka till arbetsflöde" (denna knapp kan endast kopplas till "Efter åtgärdshändelse").
:::

## Att göra-center

Att göra-centret erbjuder en enhetlig ingång för användare att visa och hantera sina att göra-uppgifter. Godkännanden som initierats av den aktuella användaren och deras väntande uppgifter kan nås via Att göra-centret i den övre verktygsfältet, och olika typer av att göra-uppgifter kan visas via navigeringen till vänster.

![Att göra-center](https://static-docs.nocobase.com/20250310161203.png)

### Mina inskickade

#### Visa inskickade godkännanden

![Visa inskickade godkännanden](https://static-docs.nocobase.com/20250310161609.png)

#### Initiera ett nytt godkännande direkt

![Initiera ett nytt godkännande direkt](https://static-docs.nocobase.com/20250310161658.png)

### Mina att göra-uppgifter

#### Att göra-lista

![Att göra-lista](https://static-docs.nocobase.com/20250310161934.png)

#### Att göra-detaljer

![Att göra-detaljer](https://static-docs.nocobase.com/20250310162111.png)

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

Här är URL-parametern `triggerWorkflows` arbetsflödets nyckel; flera arbetsflödesnycklar separeras med kommatecken. Denna nyckel kan erhållas genom att hålla muspekaren över arbetsflödets namn högst upp på arbetsflödesduken:

![Arbetsflöde_Nyckel_Visningsmetod](https://static-docs.nocobase.com/20240426135108.png)

Vid ett lyckat anrop kommer godkännandearbetsflödet för den motsvarande samlingen `posts` att utlösas.

:::info{title="Obs"}
Eftersom externa anrop också måste baseras på användaridentitet, måste autentiseringsinformation tillhandahållas vid anrop via HTTP API, precis som för förfrågningar som skickas från det vanliga gränssnittet. Detta inkluderar `Authorization`-huvudet eller `token`-parametern (token som erhållits vid inloggning), samt `X-Role`-huvudet (användarens aktuella rollnamn).
:::

Om ni behöver utlösa en händelse för en-till-en-relaterad data i denna åtgärd (en-till-många stöds ännu inte), kan ni använda `!` i parametern för att specificera utlösardatan för det associerade fältet:

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

Vid ett lyckat anrop kommer godkännandehändelsen för den motsvarande samlingen `categories` att utlösas.

:::info{title="Obs"}
När ni utlöser en efter-åtgärdshändelse via HTTP API, måste ni också vara uppmärksam på arbetsflödets aktiverade status och om samlingskonfigurationen matchar; annars kan anropet misslyckas eller resultera i ett fel.
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

*   `collectionName`: Namnet på målsamlingen för att initiera godkännandet. Obligatoriskt.
*   `workflowId`: ID för det arbetsflöde som används för att initiera godkännandet. Obligatoriskt.
*   `data`: Fälten för samlingsposten som skapas vid initiering av godkännandet. Obligatoriskt.
*   `status`: Status för posten som skapas vid initiering av godkännandet. Obligatoriskt. Möjliga värden inkluderar:
    *   `0`: Utkast, indikerar att posten sparas men inte skickas in för godkännande.
    *   `1`: Skicka in för godkännande, indikerar att initiativtagaren skickar in godkännandeförfrågan och går in i godkännandeprocessen.

#### Spara och skicka in

När ett initierat (eller återkallat) godkännande är i utkaststatus kan ni spara eller skicka in det igen via följande API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Hämta lista över inskickade godkännanden

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Återkalla

Initiativtagaren kan återkalla en post som för närvarande är under godkännande via följande API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametrar**

*   `<approval id>`: ID för den godkännandepost som ska återkallas. Obligatoriskt.

### Godkännare

Efter att godkännandearbetsflödet går in i en godkännandenod skapas en att göra-uppgift för den aktuella godkännaren. Godkännaren kan slutföra godkännandeuppgiften via gränssnittet eller genom att anropa HTTP API:et.

#### Hämta godkännandeposter

Att göra-uppgifter är godkännandeposter. Ni kan hämta alla den aktuella användarens godkännandeposter via följande API:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Här är `approvalRecords` en samlingsresurs, så ni kan använda vanliga frågevillkor som `filter`, `sort`, `pageSize` och `page`.

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

*   `<record id>`: ID för posten som ska godkännas. Obligatoriskt.
*   `status`: Fältet för godkännandeprocessens status. `2` för "Godkänn", `-1` för "Avvisa". Obligatoriskt.
*   `comment`: Kommentarer för godkännandeprocessen. Valfritt.
*   `data`: Ändringar av samlingsposten vid den aktuella godkännandenoden efter godkännande. Valfritt (gäller endast vid godkännande).

#### Returnera <Badge>v1.9.0+</Badge>

Före version v1.9.0 använde returnering samma API som "Godkänn" och "Avvisa", där `"status": 1` representerade en returnering.

Från och med version v1.9.0 har returnering ett separat API:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametrar**

*   `<record id>`: ID för posten som ska godkännas. Obligatoriskt.
*   `returnToNodeKey`: Nyckeln till målnoden att returnera till. Valfritt. När ett intervall av returnerbara noder är konfigurerat i noden kan denna parameter användas för att specificera vilken nod som ska returneras till. Om inte konfigurerat behöver denna parameter inte skickas, och den kommer som standard att returnera till startpunkten för initiativtagaren att skicka in igen.

#### Delegera

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametrar**

*   `<record id>`: ID för posten som ska godkännas. Obligatoriskt.
*   `assignee`: ID för användaren att delegera till. Obligatoriskt.

#### Lägg till signatär

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametrar**

*   `<record id>`: ID för posten som ska godkännas. Obligatoriskt.
*   `assignees`: En lista över användar-ID:n att lägga till som signatärer. Obligatoriskt.
*   `order`: Ordningen för den tillagda signatären. `-1` betyder före "mig", `1` betyder efter "mig".