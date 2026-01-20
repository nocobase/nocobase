---
versions:
  - label: Nieuwste (Stabiel)
    features: Stabiele functionaliteit, grondig getest, alleen bugfixes.
    audience: Gebruikers die een stabiele ervaring wensen en voor productie-implementaties.
    stability: ★★★★★
    production_recommendation: Aanbevolen
  - label: Bèta (Testversie)
    features: Bevat aankomende nieuwe functionaliteiten, initieel getest, maar kan enkele problemen bevatten.
    audience: Gebruikers die nieuwe functionaliteiten vroegtijdig willen ervaren en feedback willen geven.
    stability: ★★★★☆
    production_recommendation: Voorzichtig gebruiken
  - label: Alpha (Ontwikkelversie)
    features: Versie in ontwikkeling, met de nieuwste functionaliteiten die mogelijk onvolledig of instabiel zijn.
    audience: Technische gebruikers en bijdragers die geïnteresseerd zijn in de nieuwste ontwikkelingen.
    stability: ★★☆☆☆
    production_recommendation: Voorzichtig gebruiken

install_methods:
  - label: Docker-installatie (Aanbevolen)
    features: Geen code nodig, eenvoudige installatie, geschikt voor snelle kennismaking.
    scenarios: No-code gebruikers, gebruikers die snel willen implementeren op een server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Haal de nieuwste image op en herstart de container.
  - label: create-nocobase-app installatie
    features: Onafhankelijke applicatiecode, ondersteunt plugin-uitbreidingen en UI-aanpassing.
    scenarios: Front-end/full-stack ontwikkelaars, teamprojecten, low-code ontwikkeling.
    technical_requirement: ★★★☆☆
    upgrade_method: Werk afhankelijkheden bij met yarn.
  - label: Git broncode-installatie
    features: Direct de nieuwste broncode verkrijgen, geschikt voor bijdragen en debugging.
    scenarios: Technische ontwikkelaars, gebruikers die niet-uitgebrachte versies willen proberen.
    technical_requirement: ★★★★★
    upgrade_method: Synchroniseer updates via het Git-proces.
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Installatiemethoden en versieoverzicht

U kunt NocoBase op verschillende manieren installeren.

## Versieoverzicht

| Item | **Nieuwste (Stabiel)** | **Bèta (Testversie)** | **Alpha (Ontwikkelversie)** |
|------|------------------------|----------------------|-----------------------|
| **Kenmerken** | Stabiele functionaliteit, grondig getest, alleen bugfixes. | Bevat aankomende nieuwe functionaliteiten, initieel getest, maar kan enkele problemen bevatten. | Versie in ontwikkeling, met de nieuwste functionaliteiten die mogelijk onvolledig of instabiel zijn. |
| **Doelgroep** | Gebruikers die een stabiele ervaring wensen en voor productie-implementaties. | Gebruikers die nieuwe functionaliteiten vroegtijdig willen ervaren en feedback willen geven. | Technische gebruikers en bijdragers die geïnteresseerd zijn in de nieuwste ontwikkelingen. |
| **Stabiliteit** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Aanbevolen voor productie** | Aanbevolen | Voorzichtig gebruiken | Voorzichtig gebruiken |

## Vergelijking van installatiemethoden

| Item | **Docker-installatie (Aanbevolen)** | **create-nocobase-app installatie** | **Git broncode-installatie** |
|------|--------------------------|------------------------------|------------------|
| **Kenmerken** | Geen code nodig, eenvoudige installatie, geschikt voor snelle kennismaking. | Onafhankelijke applicatiecode, ondersteunt plugin-uitbreidingen en UI-aanpassing. | Direct de nieuwste broncode verkrijgen, geschikt voor bijdragen en debugging. |
| **Gebruiksscenario's** | No-code gebruikers, gebruikers die snel willen implementeren op een server. | Front-end/full-stack ontwikkelaars, teamprojecten, low-code ontwikkeling. | Technische ontwikkelaars, gebruikers die niet-uitgebrachte versies willen proberen. |
| **Technische vereisten** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Upgrademethode** | Haal de nieuwste image op en herstart de container. | Werk afhankelijkheden bij met yarn. | Synchroniseer updates via het Git-proces. |
| **Handleidingen** | [<code>Installatie</code>](#) [<code>Upgrade</code>](#) [<code>Implementatie</code>](#) | [<code>Installatie</code>](#) [<code>Upgrade</code>](#) [<code>Implementatie</code>](#) | [<code>Installatie</code>](#) [<code>Upgrade</code>](#) [<code>Implementatie</code>](#) |