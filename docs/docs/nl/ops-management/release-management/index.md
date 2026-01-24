:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Releasebeheer

## Introductie

In de praktijk, om de gegevensbeveiliging en de stabiliteit van applicaties te waarborgen, worden doorgaans meerdere omgevingen ingezet, zoals een ontwikkelomgeving, een pre-productieomgeving en een productieomgeving. Dit document geeft voorbeelden van twee veelvoorkomende no-code ontwikkelprocessen en legt gedetailleerd uit hoe u releasebeheer in NocoBase implementeert.

## Installatie

Drie plugins zijn essentieel voor releasebeheer. Zorg ervoor dat de volgende plugins zijn geactiveerd.

### Variabelen en sleutels

- Ingebouwde plugin, standaard geïnstalleerd en geactiveerd.
- Biedt gecentraliseerde configuratie en beheer van omgevingsvariabelen en sleutels, gebruikt voor het opslaan van gevoelige gegevens, herbruikbare configuratiegegevens, omgevingsspecifieke isolatie, enz. ([Bekijk documentatie](#)).

### Back-upbeheerder

- Alleen beschikbaar in de Professional-editie of hoger ([Meer informatie](https://www.nocobase.com/en/commercial)).
- Ondersteunt back-up en herstel, inclusief geplande back-ups, wat zorgt voor gegevensbeveiliging en snel herstel. ([Bekijk documentatie](../backup-manager/index.mdx)).

### Migratiebeheerder

- Alleen beschikbaar in de Professional-editie of hoger ([Meer informatie](https://www.nocobase.com/en/commercial)).
- Wordt gebruikt om applicatieconfiguraties van de ene applicatieomgeving naar de andere te migreren ([Bekijk documentatie](../migration-manager/index.md)).

## Veelvoorkomende no-code ontwikkelprocessen

### Eén ontwikkelomgeving, eenrichtingsrelease

Deze aanpak is geschikt voor eenvoudige ontwikkelprocessen. Er is één ontwikkelomgeving, één pre-productieomgeving en één productieomgeving. Wijzigingen stromen van de ontwikkelomgeving naar de pre-productieomgeving en worden uiteindelijk geïmplementeerd in de productieomgeving. In dit proces kan alleen de ontwikkelomgeving configuraties wijzigen; noch de pre-productieomgeving, noch de productieomgeving staat wijzigingen toe.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Bij het configureren van migratieregels kiest u voor ingebouwde tabellen in de kern en plugins de regel **'Overschrijven'**; voor alle andere kunt u de standaardinstellingen behouden als er geen speciale vereisten zijn.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Meerdere ontwikkelomgevingen, samengevoegde release

Deze aanpak is geschikt voor samenwerking met meerdere personen of complexe projecten. Meerdere parallelle ontwikkelomgevingen kunnen onafhankelijk worden gebruikt, en alle wijzigingen worden samengevoegd in één pre-productieomgeving voor testen en verificatie voordat ze naar productie worden geïmplementeerd. In dit proces kan ook alleen de ontwikkelomgeving configuraties wijzigen; noch de pre-productieomgeving, noch de productieomgeving staat wijzigingen toe.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Bij het configureren van migratieregels kiest u voor ingebouwde tabellen in de kern en plugins de regel **'Invoegen of bijwerken'**; voor alle andere kunt u de standaardinstellingen behouden als er geen speciale vereisten zijn.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Terugdraaien

Voordat u een migratie uitvoert, maakt het systeem automatisch een back-up van de huidige applicatie. Als de migratie mislukt of de resultaten niet aan de verwachtingen voldoen, kunt u terugdraaien en herstellen via de [Back-upbeheerder](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)