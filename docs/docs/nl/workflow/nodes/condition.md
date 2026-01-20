:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Conditie

## Introductie

Net als een `if`-statement in programmeertalen, bepaalt een conditie de verdere richting van de workflow op basis van het resultaat van de geconfigureerde voorwaarde.

## Node aanmaken

De Conditie-node heeft twee modi: 'Doorgaan bij waar' en 'Splitsen bij waar/onwaar'. U moet één van deze modi kiezen wanneer u de node aanmaakt; deze kan later niet meer worden gewijzigd in de configuratie van de node.

![条件判断_模式选择](https://static-docs.nocobase.com/3de27308c1179523d606c66bf3a5fb4.png)

In de modus 'Doorgaan bij waar' zal de workflow de volgende nodes uitvoeren wanneer het resultaat van de conditie 'waar' is. Anders wordt de workflow beëindigd en voortijdig afgesloten met een mislukte status.

![“是”则继续模式](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Deze modus is geschikt voor scenario's waarbij de workflow niet verder mag gaan als niet aan de voorwaarde is voldaan. Denk bijvoorbeeld aan een knop voor het indienen van een bestelling die is gekoppeld aan een 'Voor actie-gebeurtenis'. Als de voorraad van het product in de bestelling onvoldoende is, moet het aanmaken van de bestelling niet doorgaan, maar mislukken en worden afgebroken.

In de modus 'Splitsen bij waar/onwaar' zal de conditie-node twee vervolgbranches creëren, die respectievelijk overeenkomen met de 'waar'- en 'onwaar'-resultaten van de conditie. Elke branch kan worden geconfigureerd met zijn eigen vervolg-nodes. Nadat een van de branches de uitvoering heeft voltooid, zal deze automatisch terugkeren naar de bovenliggende branch van de conditie-node om de daaropvolgende nodes uit te voeren.

![“是”和“否”分别继续模式](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Deze modus is geschikt voor scenario's waarbij verschillende acties moeten worden uitgevoerd, afhankelijk van of aan de conditie is voldaan of niet. Denk bijvoorbeeld aan het controleren of een bepaald gegeven bestaat: als het niet bestaat, voegt u het toe; als het wel bestaat, werkt u het bij.

## Node-configuratie

### Reken-engine

Momenteel worden drie engines ondersteund:

- **Basis**: Verkrijgt een logisch resultaat door middel van eenvoudige binaire berekeningen en 'EN'/'OF'-groepering.
- **Math.js**: Berekent uitdrukkingen die worden ondersteund door de [Math.js](https://mathjs.org/)-engine om een logisch resultaat te verkrijgen.
- **Formula.js**: Berekent uitdrukkingen die worden ondersteund door de [Formula.js](https://formulajs.info/)-engine om een logisch resultaat te verkrijgen.

In alle drie de rekentypes kunnen variabelen uit de workflow-context als parameters worden gebruikt.