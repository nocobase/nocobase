---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# REST API Gegevensbron

## Introductie

Met deze plugin kunt u naadloos gegevens van REST API-bronnen integreren.

## Installatie

Dit is een commerciële plugin, wat betekent dat u deze moet uploaden en activeren via de pluginmanager.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Een REST API-gegevensbron toevoegen

Nadat u de plugin heeft geactiveerd, kunt u een REST API-gegevensbron toevoegen door deze te selecteren uit het 'Nieuwe toevoegen'-dropdownmenu in het gegevensbronbeheer.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Configureer de REST API-gegevensbron.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Een collectie toevoegen

In NocoBase wordt een RESTful-resource toegewezen aan een collectie, zoals bijvoorbeeld een 'Users' (gebruikers) resource.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Deze API-endpoints worden in NocoBase als volgt toegewezen:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Voor een uitgebreide handleiding over de NocoBase API-ontwerpspecificaties, verwijzen we u naar de [API-documentatie](#).

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Raadpleeg het hoofdstuk "NocoBase API - Core" voor gedetailleerde informatie.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

De collectieconfiguratie voor een REST API-gegevensbron omvat het volgende:

### Lijst

Wijs de interface toe voor het bekijken van een lijst met resources.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Ophalen (Get)

Wijs de interface toe voor het bekijken van resourcedetails.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Aanmaken (Create)

Wijs de interface toe voor het aanmaken van een resource.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Bijwerken (Update)

Wijs de interface toe voor het bijwerken van een resource.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Verwijderen (Destroy)

Wijs de interface toe voor het verwijderen van een resource.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

De interfaces voor 'Lijst' en 'Ophalen' moeten beide geconfigureerd zijn.

## De API debuggen

### Integratie van verzoekparameters

Voorbeeld: Configureer pagineringsparameters voor de Lijst-API. Als de externe API zelf geen paginering ondersteunt, zal NocoBase pagineren op basis van de opgehaalde lijstgegevens.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Let op: alleen variabelen die in de interface zijn toegevoegd, worden gebruikt.

| Naam parameter externe API | NocoBase parameter          |
| -------------------------- | --------------------------- |
| page                       | {{request.params.page}}     |
| limit                      | {{request.params.pageSize}} |

U kunt op 'Try it out' klikken om te debuggen en het antwoord te bekijken.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformatie van antwoordformaat

Het antwoordformaat van de externe API voldoet mogelijk niet aan de NocoBase-standaard. Het moet worden getransformeerd voordat het correct op de frontend kan worden weergegeven.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Pas de conversieregels aan op basis van het antwoordformaat van de externe API om ervoor te zorgen dat de uitvoer voldoet aan de NocoBase-standaard.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Beschrijving van het debugproces

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variabelen

De REST API-gegevensbron ondersteunt drie typen variabelen voor API-integratie:

- Aangepaste gegevensbronvariabelen
- NocoBase-verzoekvariabelen
- Externe antwoordvariabelen

### Aangepaste gegevensbronvariabelen

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase-verzoek

- Params: URL-queryparameters (Search Params), die per interface kunnen verschillen.
- Headers: Aangepaste verzoekheaders, die voornamelijk specifieke X-informatie van NocoBase bevatten.
- Body: De verzoekbody.
- Token: De API-token voor het huidige NocoBase-verzoek.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Externe antwoorden

Momenteel is alleen de antwoordbody beschikbaar.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Hieronder vindt u de variabelen die beschikbaar zijn voor elke interface:

### Lijst

| Parameter               | Beschrijving                                               |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Huidige pagina                                             |
| request.params.pageSize | Aantal items per pagina                                    |
| request.params.filter   | Filtercriteria (moeten voldoen aan NocoBase Filter-formaat) |
| request.params.sort     | Sorteercriteria (moeten voldoen aan NocoBase Sort-formaat)  |
| request.params.appends  | Velden die op aanvraag moeten worden geladen, meestal voor associatievelden |
| request.params.fields   | Velden die moeten worden opgenomen (whitelist)             |
| request.params.except   | Velden die moeten worden uitgesloten (blacklist)           |

### Ophalen (Get)

| Parameter                 | Beschrijving                                               |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Vereist, meestal de ID van de huidige record               |
| request.params.filter     | Filtercriteria (moeten voldoen aan NocoBase Filter-formaat) |
| request.params.appends    | Velden die op aanvraag moeten worden geladen, meestal voor associatievelden |
| request.params.fields     | Velden die moeten worden opgenomen (whitelist)             |
| request.params.except     | Velden die moeten worden uitgesloten (blacklist)           |

### Aanmaken (Create)

| Parameter                | Beschrijving               |
| ------------------------ | -------------------------- |
| request.params.whiteList | Whitelist                  |
| request.params.blacklist | Blacklist                  |
| request.body             | Initiële gegevens voor creatie |

### Bijwerken (Update)

| Parameter                 | Beschrijving                                       |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Vereist, meestal de ID van de huidige record       |
| request.params.filter     | Filtercriteria (moeten voldoen aan NocoBase Filter-formaat) |
| request.params.whiteList  | Whitelist                                          |
| request.params.blacklist  | Blacklist                                          |
| request.body              | Gegevens voor update                               |

### Verwijderen (Destroy)

| Parameter                 | Beschrijving                                       |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Vereist, meestal de ID van de huidige record       |
| request.params.filter     | Filtercriteria (moeten voldoen aan NocoBase Filter-formaat) |

## Veldconfiguratie

Veldmetadata (Fields) worden geëxtraheerd uit de CRUD-interfacedata van de aangepaste resource om te dienen als de velden van de collectie.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extraheer veldmetadata.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Velden en preview.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Bewerk velden (vergelijkbaar met andere gegevensbronnen).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## REST API-gegevensbronblokken toevoegen

Zodra de collectie is geconfigureerd, kunt u blokken toevoegen aan de interface.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)