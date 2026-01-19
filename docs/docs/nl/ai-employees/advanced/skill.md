:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Geavanceerd

## Introductie

Gangbare grote taalmodellen (LLM's) kunnen tools gebruiken. De AI-medewerker plugin bevat ingebouwde, veelgebruikte tools die door deze taalmodellen kunnen worden ingezet.

De vaardigheden die u instelt op de instellingenpagina van de AI-medewerker zijn de tools die het grote taalmodel kan gebruiken.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Vaardigheden instellen

Ga naar de configuratiepagina van de AI-medewerker plugin, klik op het tabblad `AI employees` om de beheerpagina van de AI-medewerkers te openen.

Selecteer de AI-medewerker waarvoor u vaardigheden wilt instellen, en klik op de knop `Edit` om de bewerkingspagina van de AI-medewerker te openen.

Klik op het tabblad `Skills` op de knop `Add Skill` om een vaardigheid toe te voegen aan de huidige AI-medewerker.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Overzicht van vaardigheden

### Frontend

De Frontend-groep stelt de AI-medewerker in staat om te interageren met frontend-componenten.

- De vaardigheid `Form filler` stelt de AI-medewerker in staat om gegenereerde formulierdata terug te plaatsen in een door de gebruiker gespecificeerd formulier.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Datamodellering

De groep vaardigheden voor datamodellering geeft de AI-medewerker de mogelijkheid om de interne API's van NocoBase aan te roepen voor datamodellering.

- `Intent Router`: routeert intenties en bepaalt of de gebruiker een `collectie` structuur wil wijzigen of een nieuwe wil aanmaken.
- `Get collection names`: haalt de namen op van alle bestaande `collecties` in het systeem.
- `Get collection metadata`: haalt de structuurinformatie op van een gespecificeerde `collectie`.
- `Define collections`: stelt de AI-medewerker in staat om `collecties` aan te maken in het systeem.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` geeft de AI-medewerker de mogelijkheid om `workflows` uit te voeren. `Workflows` die in de `workflow` plugin zijn geconfigureerd met `Trigger type` als `AI employee event`, zullen hier beschikbaar zijn als vaardigheden voor de AI-medewerker.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

De vaardigheden binnen de Code Editor-groep stellen de AI-medewerker voornamelijk in staat om te interageren met de code-editor.

- `Get code snippet list`: haalt de lijst met vooraf ingestelde codefragmenten op.
- `Get code snippet content`: haalt de inhoud op van een gespecificeerd codefragment.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Overige

- `Chart generator`: geeft de AI-medewerker de mogelijkheid om grafieken te genereren en deze direct in het gesprek weer te geven.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)