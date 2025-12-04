:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens verwijderen

Gebruik dit om gegevens te verwijderen uit een collectie die aan specifieke voorwaarden voldoen.

Het basisgebruik van het verwijderknooppunt is vergelijkbaar met dat van het updateknooppunt. Het verwijderknooppunt vereist echter geen veldtoewijzing; u hoeft alleen de collectie en de filtervoorwaarden te selecteren. Het resultaat van het verwijderknooppunt geeft het aantal succesvol verwijderde rijen terug. Dit is alleen zichtbaar in de uitvoeringsgeschiedenis en kan niet als variabele in volgende knooppunten worden gebruikt.

:::info{title=Let op}
Momenteel ondersteunt het verwijderknooppunt geen rij-voor-rij verwijdering; het voert altijd batchverwijderingen uit. Hierdoor worden er geen andere gebeurtenissen geactiveerd voor elke individuele gegevensverwijdering.
:::

## Knooppunt aanmaken

Klik in de workflow-configuratie-interface op de plusknop ("+") in de flow om een "Gegevens verwijderen"-knooppunt toe te voegen:

![Verwijderknooppunt aanmaken](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Knooppuntconfiguratie

![Verwijderknooppunt_Knooppuntconfiguratie](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Collectie

Selecteer de collectie waaruit u gegevens wilt verwijderen.

### Filtervoorwaarden

Vergelijkbaar met de filtervoorwaarden bij een reguliere collectiequery, kunt u de contextvariabelen van de workflow gebruiken.

## Voorbeeld

Om bijvoorbeeld periodiek geannuleerde en ongeldige historische ordergegevens op te schonen, kunt u het verwijderknooppunt gebruiken:

![Verwijderknooppunt_Voorbeeld_Knooppuntconfiguratie](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

De workflow wordt periodiek geactiveerd en verwijdert alle geannuleerde en ongeldige historische ordergegevens.