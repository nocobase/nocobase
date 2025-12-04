:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Overzicht van Blokextensies

In NocoBase 2.0 is het mechanisme voor blokextensies aanzienlijk vereenvoudigd. Ontwikkelaars hoeven alleen de bijbehorende **FlowModel** basisklasse te overerven en de relevante interfacemethoden (voornamelijk de `renderComponent()` methode) te implementeren om snel blokken aan te passen.

## Blokcategorieën

NocoBase categoriseert blokken in drie typen, die in groepen worden weergegeven in de configuratie-interface:

- **Gegevensblokken**: Blokken die `DataBlockModel` of `CollectionBlockModel` overerven.
- **Filterblokken**: Blokken die `FilterBlockModel` overerven.
- **Overige blokken**: Blokken die direct `BlockModel` overerven.

> De groepering van blokken wordt bepaald door de bijbehorende basisklasse. De classificatielogica is gebaseerd op overervingsrelaties en vereist geen aanvullende configuratie.

## Beschrijving van Basisklassen

Het systeem biedt vier basisklassen voor extensies:

### BlockModel

**Basisblokmodel**, de meest veelzijdige basisklasse voor blokken.

- Geschikt voor blokken die puur ter weergave dienen en niet afhankelijk zijn van gegevens.
- Wordt gecategoriseerd onder de groep **Overige blokken**.
- Toepasbaar in gepersonaliseerde scenario's.

### DataBlockModel

**Gegevensblokmodel (niet gebonden aan een gegevenscollectie)**, voor blokken met aangepaste gegevensbronnen.

- Niet direct gebonden aan een gegevenscollectie; u kunt de logica voor het ophalen van gegevens aanpassen.
- Wordt gecategoriseerd onder de groep **Gegevensblokken**.
- Toepasbaar voor: het aanroepen van externe API's, aangepaste gegevensverwerking, statistische grafieken, enz.

### CollectionBlockModel

**Collectieblokmodel**, voor blokken die aan een gegevenscollectie moeten worden gekoppeld.

- Vereist koppeling aan een basisklasse van een gegevenscollectiemodel.
- Wordt gecategoriseerd onder de groep **Gegevensblokken**.
- Toepasbaar voor: lijsten, formulieren, kanbanborden en andere blokken die duidelijk afhankelijk zijn van een specifieke gegevenscollectie.

### FilterBlockModel

**Filterblokmodel**, voor het bouwen van blokken met filtervoorwaarden.

- Basisklasse voor modellen die filtervoorwaarden bouwen.
- Wordt gecategoriseerd onder de groep **Filterblokken**.
- Werkt doorgaans samen met gegevensblokken.

## Hoe kiest u een Basisklasse?

Bij het kiezen van een basisklasse kunt u de volgende principes aanhouden:

- **Moet gekoppeld worden aan een gegevenscollectie**: Geef prioriteit aan `CollectionBlockModel`.
- **Aangepaste gegevensbron**: Kies `DataBlockModel`.
- **Voor het instellen van filtervoorwaarden en samenwerking met gegevensblokken**: Kies `FilterBlockModel`.
- **Weet u niet zeker hoe u moet categoriseren**: Kies `BlockModel`.

## Snel aan de slag

Het maken van een aangepast blok vereist slechts drie stappen:

1. Overerf de bijbehorende basisklasse (bijv. `BlockModel`).
2. Implementeer de `renderComponent()` methode om een React-component terug te geven.
3. Registreer het blokmodel in de **plugin**.

Voor gedetailleerde voorbeelden verwijzen wij u naar [Een blok-plugin schrijven](./write-a-block-plugin).