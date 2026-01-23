---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# REST API datakälla

## Introduktion

Denna plugin låter dig smidigt integrera data från REST API-källor.

## Installation

Eftersom detta är en kommersiell plugin behöver ni ladda upp och aktivera den via pluginhanteraren.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Lägga till en REST API-datakälla

Efter att ni har aktiverat pluginen kan ni lägga till en REST API-datakälla genom att välja den från rullgardinsmenyn "Lägg till ny" i avsnittet för datakällshantering.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Konfigurera REST API-datakällan.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Lägga till en samling

I NocoBase mappas en RESTful-resurs till en samling, till exempel en Users-resurs.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Dessa API-slutpunkter mappas i NocoBase på följande sätt:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

För en omfattande guide om NocoBase API-designspecifikationer, se API-dokumentationen.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Se kapitlet "NocoBase API - Core" för detaljerad information.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurationen för en samling i en REST API-datakälla inkluderar följande:

### Lista

Mappa gränssnittet för att visa en lista över resurser.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Hämta

Mappa gränssnittet för att visa resursdetaljer.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Skapa

Mappa gränssnittet för att skapa en resurs.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Uppdatera

Mappa gränssnittet för att uppdatera en resurs.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Radera

Mappa gränssnittet för att radera en resurs.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Både gränssnitten för "Lista" och "Hämta" måste konfigureras.

## Felsöka API:et

### Integrering av förfrågningsparametrar

Exempel: Konfigurera sidnumreringsparametrar för List-API:et. Om tredjeparts-API:et inte stöder sidnumrering inbyggt, kommer NocoBase att sidnumrera baserat på den hämtade listdatan.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Observera att endast variabler som har lagts till i gränssnittet kommer att gälla.

| Tredjeparts-API-parameternamn | NocoBase-parameter          |
| ----------------------------- | --------------------------- |
| page                          | {{request.params.page}}     |
| limit                         | {{request.params.pageSize}} |

Ni kan klicka på "Try it out" för att felsöka och se svaret.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Omvandling av svarsformat

Svarsformatet från tredjeparts-API:et kanske inte följer NocoBase-standarden, och det behöver omvandlas innan det kan visas korrekt i frontend.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Justera omvandlingsreglerna baserat på tredjeparts-API:ets svarsformat för att säkerställa att utdata överensstämmer med NocoBase-standarden.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Beskrivning av felsökningsprocessen

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variabler

REST API-datakällan stöder tre typer av variabler för API-integrering:

- Anpassade datakällsvariabler
- NocoBase förfrågningsvariabler
- Tredjepartssvarsvariabler

### Anpassade datakällsvariabler

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase-förfrågan

- Params: URL-frågeparametrar (Search Params), som varierar beroende på gränssnittet.
- Headers: Anpassade förfrågningshuvuden, som primärt tillhandahåller specifik X-information från NocoBase.
- Body: Förfrågans brödtext.
- Token: API-token för den aktuella NocoBase-förfrågan.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Tredjepartssvar

För närvarande är endast svarsbrödtexten tillgänglig.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Nedan följer de variabler som är tillgängliga för varje gränssnitt:

### Lista

| Parameter               | Beskrivning                                                |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Aktuell sida                                               |
| request.params.pageSize | Antal objekt per sida                                      |
| request.params.filter   | Filterkriterier (måste uppfylla NocoBase Filter-format)    |
| request.params.sort     | Sorteringskriterier (måste uppfylla NocoBase Sort-format)  |
| request.params.appends  | Fält att ladda vid behov, vanligtvis för relationsfält    |
| request.params.fields   | Fält att inkludera (vitlista)                              |
| request.params.except   | Fält att exkludera (svartlista)                            |

### Hämta

| Parameter                 | Beskrivning                                                |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Obligatoriskt, vanligtvis det aktuella post-ID:t           |
| request.params.filter     | Filterkriterier (måste uppfylla NocoBase Filter-format)    |
| request.params.appends    | Fält att ladda vid behov, vanligtvis för relationsfält    |
| request.params.fields     | Fält att inkludera (vitlista)                              |
| request.params.except     | Fält att exkludera (svartlista)                            |

### Skapa

| Parameter                | Beskrivning               |
| ------------------------ | ------------------------- |
| request.params.whiteList | Vitlista                  |
| request.params.blacklist | Svartlista                |
| request.body             | Initial data för skapande |

### Uppdatera

| Parameter                 | Beskrivning                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatoriskt, vanligtvis det aktuella post-ID:t   |
| request.params.filter     | Filterkriterier (måste uppfylla NocoBase Filter-format) |
| request.params.whiteList  | Vitlista                                           |
| request.params.blacklist  | Svartlista                                         |
| request.body              | Data för uppdatering                               |

### Radera

| Parameter                 | Beskrivning                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Obligatoriskt, vanligtvis det aktuella post-ID:t   |
| request.params.filter     | Filterkriterier (måste uppfylla NocoBase Filter-format) |

## Fältkonfiguration

Fältmetadata (Fields) extraheras från CRUD-gränssnittsdatan för den anpassade resursen för att fungera som fält för samlingen.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Extrahera fältmetadata.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Fält och förhandsgranskning.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Redigera fält (liknande hur ni gör med andra datakällor).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Lägga till REST API-datakällsblock

När samlingen är konfigurerad kan ni lägga till block i gränssnittet.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)