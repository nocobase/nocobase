:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/interface-builder/event-flow) voor nauwkeurige informatie.
:::

# Gebeurtenissenstroom

## Introductie

Als u bepaalde aangepaste acties wilt activeren wanneer een formulier wijzigt, kunt u de gebeurtenissenstroom gebruiken. Naast formulieren kunnen ook pagina's, blokken, knoppen en velden worden geconfigureerd met gebeurtenissenstromen voor aangepaste bewerkingen.

## Hoe te gebruiken

Hieronder volgt een eenvoudig voorbeeld om te illustreren hoe u een gebeurtenissenstroom configureert. Laten we een koppeling tussen twee tabellen realiseren: wanneer u op een rij in de linker tabel klikt, worden de gegevens in de rechter tabel automatisch gefilterd.

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

De configuratiestappen zijn als volgt:

1. Klik op het "bliksem"-icoon in de rechterbovenhoek van het linker tabelblok om de configuratie-interface van de gebeurtenissenstroom te openen.
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. Klik op "Gebeurtenissenstroom toevoegen (Add event flow)", kies bij "Triggergebeurtenis" voor "Rij klikken (Row click)". Dit betekent dat de stroom wordt geactiveerd wanneer op een tabelrij wordt geklikt.
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. Configureer het "Uitvoeringstijdstip (Execution timing)". Dit bepaalt de volgorde van deze gebeurtenissenstroom ten opzichte van de ingebouwde systeemprocessen. Meestal kunt u de standaardinstelling aanhouden; als u wilt dat een melding of navigatie plaatsvindt nadat de ingebouwde logica is voltooid, kiest u "Na alle stromen (After all flows)". Zie voor meer informatie hieronder [Uitvoeringstijdstip](#uitvoeringstijdstip).
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. "Triggerconditie (Trigger condition)" wordt gebruikt om voorwaarden te configureren; de gebeurtenissenstroom wordt alleen geactiveerd als aan de voorwaarden is voldaan. In dit geval hoeven we niets te configureren, omdat de stroom bij elke klik op een rij moet worden geactiveerd.
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. Beweeg de muis over "Stap toevoegen (Add step)" om bewerkingsstappen toe te voegen. We kiezen "Gegevensbereik instellen (Set data scope)" om het gegevensbereik van de rechter tabel in te stellen.
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. Kopieer de UID van de rechter tabel en vul deze in bij het invoerveld "Doelblok UID (Target block UID)". Er verschijnt direct een interface voor conditieconfiguratie, waar u het gegevensbereik voor de rechter tabel kunt instellen.
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. Laten we een conditie configureren, zoals in de onderstaande afbeelding:
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. Na het configureren van het gegevensbereik moet het blok nog worden vernieuwd om de gefilterde resultaten te tonen. Voeg vervolgens een stap "Doelblokken vernieuwen (Refresh target blocks)" toe en vul de UID van de rechter tabel in.
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. Klik ten slotte op de knop Opslaan in de rechterbenedenhoek om de configuratie te voltooien.

## Gebeurtenis-details

### Voor renderen (Before render)

Een algemene gebeurtenis die kan worden gebruikt in pagina's, blokken, knoppen of velden. In deze gebeurtenis kunt u initialisatiewerkzaamheden uitvoeren, zoals het configureren van verschillende gegevensbereiken onder verschillende voorwaarden.

### Rij klikken (Row click)

Specifieke gebeurtenis voor tabelblokken. Wordt geactiveerd wanneer op een tabelrij wordt geklikt. Bij activering wordt een "Clicked row record" aan de context toegevoegd, die als variabele kan worden gebruikt in condities en stappen.

### Formulierwaarden wijzigen (Form values change)

Specifieke gebeurtenis voor formulierblokken. Wordt geactiveerd wanneer de waarde van een formulierveld wijzigt. U kunt de waarden van het formulier ophalen via de variabele "Current form" in condities en stappen.

### Klikken (Click)

Specifieke gebeurtenis voor knoppen. Wordt geactiveerd wanneer op de knop wordt geklikt.

## Uitvoeringstijdstip

In de configuratie van de gebeurtenissenstroom zijn er twee concepten die vaak worden verward:

- **Triggergebeurtenis (Trigger event):** Wanneer de uitvoering begint (bijv. Voor renderen, Rij klikken, Klikken, Formulierwaarden wijzigen, enz.).
- **Uitvoeringstijdstip (Execution timing):** Waar uw **aangepaste gebeurtenissenstroom** moet worden ingevoegd in het **ingebouwde proces** nadat dezelfde triggergebeurtenis heeft plaatsgevonden.

### Wat zijn "ingebouwde processen / ingebouwde stappen"?

Veel pagina's, blokken of acties hebben hun eigen systeem-ingebouwde verwerkingsprocessen (bijv. indienen, een pop-up openen, gegevens opvragen, enz.). Wanneer u een aangepaste gebeurtenissenstroom toevoegt voor dezelfde gebeurtenis (bijv. "Klikken"), bepaalt het "Uitvoeringstijdstip":

- Of uw stroom vóór of na de ingebouwde logica wordt uitgevoerd;
- Of dat uw stroom vóór of na een specifieke stap in het ingebouwde proces wordt ingevoegd.

### Hoe de opties voor uitvoeringstijdstip in de UI te begrijpen?

- **Vóór alle stromen (Before all flows - standaard):** Wordt als eerste uitgevoerd. Geschikt voor "interceptie/voorbereiding" (bijv. validatie, bevestiging, initialiseren van variabelen, enz.).
- **Na alle stromen (After all flows):** Wordt uitgevoerd nadat de ingebouwde logica is voltooid. Geschikt voor "afhandeling/feedback" (bijv. meldingen, andere blokken vernieuwen, paginanavigatie, enz.).
- **Vóór gespecificeerde stroom / Na gespecificeerde stroom:** Een nauwkeuriger invoegpunt. Na selectie moet u het specifieke "ingebouwde proces" kiezen.
- **Vóór gespecificeerde stroomstap / Na gespecificeerde stroomstap:** Het meest nauwkeurige invoegpunt. Na selectie moet u zowel het "ingebouwde proces" als de "ingebouwde processtap" kiezen.

> Tip: Als u niet zeker weet welk ingebouwd proces of welke stap u moet kiezen, gebruik dan bij voorkeur de eerste twee opties ("Vóór / Na").

## Stap-details

### Aangepaste variabele (Custom variable)

Wordt gebruikt om een aangepaste variabele te definiëren die vervolgens in de context kan worden gebruikt.

#### Bereik (Scope)

Aangepaste variabelen hebben een bereik; variabelen die in de gebeurtenissenstroom van een blok zijn gedefinieerd, kunnen bijvoorbeeld alleen in dat blok worden gebruikt. Als u wilt dat een variabele in alle blokken op de huidige pagina kan worden gebruikt, moet u deze configureren in de gebeurtenissenstroom van de pagina.

#### Formuliervariabele (Form variable)

Gebruik de waarde van een specifiek formulierblok als variabele. De configuratie is als volgt:

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title: Titel van de variabele
- Variable identifier: Identificatie van de variabele
- Form UID: UID van het formulier

#### Andere variabelen

Andere variabelen zullen in de toekomst worden ondersteund, blijf op de hoogte.

### Gegevensbereik instellen (Set data scope)

Stel het gegevensbereik van het doelblok in. De configuratie is als volgt:

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID: UID van het doelblok
- Condition: Filterconditie

### Doelblokken vernieuwen (Refresh target blocks)

Vernieuw het doelblok; het is mogelijk om meerdere blokken te configureren. De configuratie is als volgt:

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID: UID van het doelblok

### Navigeren naar URL (Navigate to URL)

Navigeer naar een bepaalde URL. De configuratie is als volgt:

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL: Doel-URL, ondersteunt het gebruik van variabelen
- Search parameters: Queryparameters in de URL
- Open in new window: Indien aangevinkt, wordt er bij navigatie een nieuwe browserpagina geopend

### Bericht weergeven (Show message)

Toont wereldwijd feedbackinformatie over de bewerking.

#### Wanneer te gebruiken

- Kan feedbackinformatie geven zoals succes, waarschuwing en fout.
- Wordt bovenaan in het midden weergegeven en verdwijnt automatisch; het is een lichte manier van informeren die de handelingen van de gebruiker niet onderbreekt.

#### Specifieke configuratie

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type: Type melding
- Message content: Inhoud van de melding
- Duration: Tijdsduur in seconden

### Melding weergeven (Show notification)

Toont wereldwijd herinneringsinformatie.

#### Wanneer te gebruiken

Toont herinneringsinformatie in de vier hoeken van het systeem. Wordt vaak gebruikt in de volgende situaties:

- Relatief complexe inhoud van de melding.
- Meldingen met interactie, die de gebruiker een volgend actiepunt geven.
- Actieve pushberichten vanuit het systeem.

#### Specifieke configuratie

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type: Type melding
- Notification title: Titel van de melding
- Notification description: Beschrijving van de melding
- Placement: Positie, opties zijn: linksboven, rechtsboven, linksonder, rechtsonder

### JavaScript uitvoeren (Execute JavaScript)

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

Voert JavaScript-code uit.

## Voorbeeld

### Formulier: Externe API aanroepen om velden in te vullen

Scenario: Activeer een gebeurtenissenstroom in een formulier, vraag een externe API aan en vul de verkregen gegevens automatisch in de formuliervelden in.

Configuratiestappen:

1. Open de configuratie van de gebeurtenissenstroom in het formulierblok en voeg een nieuwe gebeurtenissenstroom toe;
2. Kies bij Triggergebeurtenis voor "Voor renderen (Before render)";
3. Kies bij Uitvoeringstijdstip voor "Na alle stromen (After all flows)";
4. Voeg de stap "JavaScript uitvoeren (Execute JavaScript)" toe, plak de onderstaande code en pas deze naar wens aan:

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Let op: ctx.api bevat standaard de huidige NocoBase authenticatie/aangepaste headers
  // Hier overschrijven we dit met een "lege Authorization" om te voorkomen dat het token naar een derde partij wordt verzonden
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// vervang dit door de werkelijke veldnaam
ctx.form.setFieldsValue({ username });
```