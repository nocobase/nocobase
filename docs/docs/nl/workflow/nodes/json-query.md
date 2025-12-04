---
pkg: '@nocobase/plugin-workflow-json-query'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# JSON Berekening

## Introductie

Gebaseerd op verschillende JSON-berekeningsengines, kunt u met dit knooppunt complexe JSON-gegevens, die door eerdere (upstream) knooppunten zijn gegenereerd, berekenen of de structuur ervan transformeren, zodat volgende knooppunten deze kunnen gebruiken. Denk bijvoorbeeld aan de resultaten van SQL-bewerkingen en HTTP-verzoeken; met dit knooppunt kunt u deze omzetten in de gewenste waarden en variabele formaten, zodat ze bruikbaar zijn voor de daaropvolgende knooppunten.

## Knooppunt aanmaken

In de configuratie-interface van de **workflow** klikt u op de plusknop ('+') in het proces om een 'JSON Berekening'-knooppunt toe te voegen:

![Knooppunt aanmaken](https://static-docs.nocobase.com/7de796517539ad9dfc88b7160f1d0dd7.png)

:::info{title=Tip}
Meestal plaatst u het JSON Berekening-knooppunt onder andere gegevensknooppunten om de gegevens daaruit te kunnen parseren.
:::

## Knooppuntconfiguratie

### Parseringsengine

Het JSON Berekening-knooppunt ondersteunt verschillende syntaxes via diverse parseringsengines. U kunt een keuze maken op basis van uw voorkeur en de specifieke kenmerken van elke engine. Momenteel worden drie parseringsengines ondersteund:

- [JMESPath](https://jmespath.org/)
- [JSONPath Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
- [JSONata](https://jsonata.org/)

![Enginekeuze](https://static-docs.nocobase.com/29be3b92a62b7d20312d1673e749f2ec.png)

### Gegevensbron

De **gegevensbron** kan het resultaat zijn van een eerder knooppunt of een gegevensobject in de **workflow**-context. Meestal is dit een gegevensobject zonder ingebouwde structuur, zoals het resultaat van een SQL-knooppunt of een HTTP-verzoekknooppunt.

![Gegevensbron](https://static-docs.nocobase.com/f5a97e20693b3d30b3a994a576aa282d.png)

:::info{title=Tip}
Doorgaans zijn de gegevensobjecten van **collectie**-gerelateerde knooppunten al gestructureerd via de **collectie**-configuratie-informatie en hoeven deze over het algemeen niet te worden geparseerd door het JSON Berekening-knooppunt.
:::

### Parseringsuitdrukking

Afhankelijk van de parseringsbehoeften en de gekozen parseringsengine, definieert u hier uw aangepaste parseeruitdrukking.

![Parseeruitdrukking](https://static-docs.nocobase.com/181abd162fd32c09b62f6aa1d1cb3ed4.png)

:::info{title=Tip}
Verschillende engines bieden verschillende parseringssyntaxes. Voor details kunt u de documentatie via de links raadplegen.
:::

Vanaf versie `v1.0.0-alpha.15` ondersteunen uitdrukkingen het gebruik van variabelen. Variabelen worden vooraf geparseerd voordat de specifieke engine wordt uitgevoerd, waarbij ze volgens de regels van stringtemplates worden vervangen door specifieke stringwaarden. Deze worden vervolgens samengevoegd met andere statische strings in de uitdrukking om de uiteindelijke uitdrukking te vormen. Deze functionaliteit is erg handig wanneer u uitdrukkingen dynamisch moet opbouwen, bijvoorbeeld wanneer bepaalde JSON-inhoud een dynamische sleutel vereist voor parsing.

### Eigenschapsmapping

Wanneer het berekeningsresultaat een object (of een array van objecten) is, kunt u via eigenschapsmapping de benodigde eigenschappen verder toewijzen aan subvariabelen, zodat deze door volgende knooppunten kunnen worden gebruikt.

![Eigenschapsmapping](https://static-docs.nocobase.com/b876abe4ccf6b4709eb8748f21ef3527.png)

:::info{title=Tip}
Voor een object (of een array van objecten) als resultaat geldt: als er geen eigenschapsmapping wordt uitgevoerd, wordt het hele object (of de array van objecten) als één variabele opgeslagen in het resultaat van het knooppunt. De eigenschapswaarden van het object kunnen dan niet direct als afzonderlijke variabelen worden gebruikt.
:::

## Voorbeeld

Stel dat de te parseren gegevens afkomstig zijn van een voorafgaand SQL-knooppunt dat wordt gebruikt om gegevens op te vragen, en het resultaat is een set ordergegevens:

```json
[
  {
    "id": 1,
    "products": [
      {
        "id": 1,
        "title": "Product 1",
        "price": 100,
        "quantity": 1
      },
      {
        "id": 2,
        "title": "Product 2",
        "price": 120,
        "quantity": 2
      }
    ]
  },
  {
    "id": 2,
    "products": [
      {
        "id": 3,
        "title": "Product 3",
        "price": 130,
        "quantity": 1
      },
      {
        "id": 4,
        "title": "Product 4",
        "price": 140,
        "quantity": 2
      }
    ]
  }
]
```

Als we de totale prijs van de twee orders in de gegevens willen parseren en berekenen, en deze samen met de corresponderende order-ID's willen samenvoegen tot objecten om de totale orderprijs bij te werken, dan kunt u dit als volgt configureren:

![Voorbeeld - SQL-configuratie parseren](https://static-docs.nocobase.com/e62322a868b26ff98120bfcd6dcdb3bd.png)

1. Selecteer de JSONata parseringsengine;
2. Selecteer het resultaat van het SQL-knooppunt als de **gegevensbron**;
3. Gebruik de JSONata-uitdrukking `$[0].{"id": id, "total": products.(price * quantity)}` om te parseren;
4. Selecteer eigenschapsmapping om `id` en `total` toe te wijzen aan subvariabelen;

Het uiteindelijke parseringsresultaat is als volgt:

```json
[
  {
    "id": 1,
    "total": 340
  },
  {
    "id": 2,
    "total": 410
  }
]
```

Vervolgens doorloopt u de resulterende orderarray om de totale prijs van de orders bij te werken.

![Totale prijs van de corresponderende order bijwerken](https://static-docs.nocobase.com/b3329b0efe4471f5eed1f0673bef740e.png)