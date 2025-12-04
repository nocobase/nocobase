:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Berekening

Met het Berekeningsknooppunt kunt u een uitdrukking evalueren. Het resultaat wordt opgeslagen in het knooppunt zelf, zodat andere knooppunten het later kunnen gebruiken. Het is een hulpmiddel voor het berekenen, verwerken en transformeren van gegevens. Tot op zekere hoogte kan het de functionaliteit in programmeertalen vervangen, waarbij u een functie aanroept op een waarde en het resultaat toewijst aan een variabele.

## Knooppunt maken

In de **workflow**-configuratie-interface klikt u op de plusknop ('+') in de flow om een 'Berekening'-knooppunt toe te voegen:

![计算节点_添加](https://static-docs.nocobase.com/58a466540d26945251cd143eb4b16579.png)

## Knooppuntconfiguratie

![计算节点_节点配置](https://static-docs.nocobase.com/6a155de3f8d3cd1881b2d9c33874.png)

### Berekeningsengine

De berekeningsengine definieert de syntaxis die door de uitdrukking wordt ondersteund. De momenteel ondersteunde berekeningsengines zijn [Math.js](https://mathjs.org/) en [Formula.js](https://formulajs.info/). Elke engine heeft een groot aantal ingebouwde veelgebruikte functies en methoden voor gegevensbewerkingen. Voor specifiek gebruik kunt u de officiële documentatie raadplegen.

:::info{title=Tip}
Het is belangrijk op te merken dat verschillende engines verschillen in de manier waarop ze array-indexen benaderen. Math.js-indexen beginnen bij `1`, terwijl Formula.js-indexen bij `0` beginnen.
:::

Daarnaast, als u eenvoudige tekenreeks-samenvoeging nodig heeft, kunt u direct 'Tekenreeksjabloon' gebruiken. Deze engine vervangt de variabelen in de uitdrukking door hun overeenkomstige waarden en retourneert vervolgens de samengevoegde tekenreeks.

### Uitdrukking

Een uitdrukking is een tekenreeksweergave van een berekeningsformule, die kan bestaan uit variabelen, constanten, operatoren en ondersteunde functies. U kunt variabelen uit de flow-context gebruiken, zoals het resultaat van een voorafgaand knooppunt van het berekeningsknooppunt, of lokale variabelen van een lus.

Als de ingevoerde uitdrukking niet voldoet aan de syntaxis, wordt er een foutmelding weergegeven in de knooppuntconfiguratie. Als een variabele tijdens de uitvoering niet bestaat of het type niet overeenkomt, of als een niet-bestaande functie wordt gebruikt, zal het berekeningsknooppunt voortijdig beëindigen met een foutstatus.

## Voorbeeld

### Totale prijs van een bestelling berekenen

Een bestelling kan meerdere artikelen bevatten, elk met een verschillende prijs en hoeveelheid. De totale prijs van de bestelling moet de som zijn van de producten van de prijs en de hoeveelheid van alle artikelen. Nadat u de lijst met orderdetails (een gegevensset met een één-op-veel-relatie) heeft geladen, kunt u een berekeningsknooppunt gebruiken om de totale prijs van de bestelling te berekenen:

![计算节点_示例_节点配置](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Hier kan de `SUMPRODUCT`-functie van Formula.js de som van de producten voor twee arrays van dezelfde lengte berekenen, wat de totale prijs van de bestelling oplevert.