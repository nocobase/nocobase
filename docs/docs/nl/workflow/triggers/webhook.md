---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Webhook

## Inleiding

De Webhook-trigger biedt een URL die door externe systemen kan worden aangeroepen via HTTP-verzoeken. Wanneer een externe gebeurtenis plaatsvindt, wordt een HTTP-verzoek naar deze URL gestuurd om de workflow-uitvoering te starten. Dit is ideaal voor meldingen die door externe systemen worden geïnitieerd, zoals betalingscallbacks of berichten.

## Een workflow aanmaken

Wanneer u een workflow aanmaakt, kiest u het type 'Webhook-gebeurtenis':

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Tip"}
Het verschil tussen 'synchrone' en 'asynchrone' workflows is dat een synchrone workflow wacht tot de workflow volledig is uitgevoerd voordat er een antwoord wordt teruggestuurd, terwijl een asynchrone workflow direct het antwoord terugstuurt dat in de triggerconfiguratie is ingesteld, en de uitvoering op de achtergrond in de wachtrij plaatst.
:::

## Triggerconfiguratie

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook-URL

De URL voor de Webhook-trigger wordt automatisch door het systeem gegenereerd en is gekoppeld aan deze workflow. U kunt op de knop aan de rechterkant klikken om deze te kopiëren en vervolgens in het externe systeem plakken.

Alleen de HTTP POST-methode wordt ondersteund; andere methoden retourneren een `405`-fout.

### Beveiliging

Momenteel wordt HTTP Basic Authentication ondersteund. U kunt deze optie inschakelen en een gebruikersnaam en wachtwoord instellen. Neem de gebruikersnaam en het wachtwoord op in de Webhook-URL van het externe systeem om beveiligde authenticatie voor de Webhook te implementeren (voor details over de standaard, zie: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Wanneer een gebruikersnaam en wachtwoord zijn ingesteld, controleert het systeem of de gebruikersnaam en het wachtwoord in het verzoek overeenkomen. Indien deze niet worden opgegeven of niet overeenkomen, wordt een `401`-fout geretourneerd.

### Verzoekgegevens parseren

Wanneer een externe partij de Webhook aanroept, moeten de gegevens die in het verzoek worden meegestuurd, worden geparseerd voordat ze in de workflow kunnen worden gebruikt. Na het parseren worden deze als triggervariabelen beschikbaar gesteld, die in volgende knooppunten kunnen worden gebruikt.

Het parseren van het HTTP-verzoek is verdeeld in drie delen:

1.  Verzoekheaders

    Verzoekheaders zijn meestal eenvoudige sleutel-waardeparen van het type string. De header-velden die u nodig heeft, kunt u direct configureren. Denk aan `Date`, `X-Request-Id`, enz.

2.  Verzoekparameters

    Verzoekparameters zijn de queryparameters in de URL, zoals de `query`-parameter in `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. U kunt een volledige voorbeeld-URL of alleen het deel met de queryparameters plakken, en vervolgens op de parseerknop klikken om de sleutel-waardeparen automatisch te parseren.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Automatisch parseren converteert het parametergedeelte van de URL naar een JSON-structuur en genereert paden zoals `query[0]`, `query[0].a` op basis van de parameterhiërarchie. De padnaam kan handmatig worden gewijzigd als deze niet aan uw behoeften voldoet, maar dit is meestal niet nodig. De alias is de weergavenaam van de variabele wanneer deze wordt gebruikt, en is optioneel. Het parseren genereert ook een volledige lijst met parameters uit het voorbeeld; u kunt onnodige parameters verwijderen.

3.  Verzoekbody

    De verzoekbody is het 'Body'-gedeelte van het HTTP-verzoek. Momenteel worden alleen verzoekbody's met een `Content-Type` van `application/json` ondersteund. U kunt de paden die moeten worden geparseerd direct configureren, of u kunt een JSON-voorbeeld invoeren en op de parseerknop klikken voor automatische parsing.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Automatisch parseren converteert de sleutel-waardeparen in de JSON-structuur naar paden. Bijvoorbeeld, `{"a": 1, "b": {"c": 2}}` genereert paden zoals `a`, `b` en `b.c`. De alias is de weergavenaam van de variabele wanneer deze wordt gebruikt, en is optioneel. Het parseren genereert ook een volledige lijst met parameters uit het voorbeeld; u kunt onnodige parameters verwijderen.

### Antwoordinstellingen

De configuratie van het Webhook-antwoord verschilt tussen synchrone en asynchrone workflows. Voor asynchrone workflows wordt het antwoord direct in de trigger geconfigureerd. Na ontvangst van een Webhook-verzoek wordt het geconfigureerde antwoord onmiddellijk teruggestuurd naar het externe systeem, waarna de workflow wordt uitgevoerd. Voor synchrone workflows moet u een antwoordknooppunt toevoegen binnen de flow om dit te verwerken volgens de bedrijfsvereisten (voor details, zie: [Antwoordknooppunt](#antwoordknooppunt)).

Doorgaans heeft het antwoord voor een asynchroon getriggerde Webhook-gebeurtenis een statuscode van `200` en een antwoordbody van `ok`. U kunt de statuscode, headers en body van het antwoord ook naar behoefte aanpassen.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Antwoordknooppunt

Referentie: [Antwoordknooppunt](../nodes/response.md)

## Voorbeeld

In een Webhook-workflow kunt u verschillende antwoorden retourneren op basis van verschillende bedrijfscondities, zoals weergegeven in de onderstaande afbeelding:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Gebruik een voorwaardelijk vertakkingsknooppunt om te bepalen of aan een bepaalde bedrijfsstatus is voldaan. Indien dit het geval is, retourneert u een succesvol antwoord; anders een foutantwoord.