---
pkg: '@nocobase/plugin-workflow-sql'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# SQL-actie

## Introductie

In sommige specifieke scenario's zijn de eenvoudige collectie-actieknooppunten mogelijk niet toereikend voor complexe bewerkingen. In dergelijke gevallen kunt u direct het SQL-knooppunt gebruiken om de database complexe SQL-statements te laten uitvoeren voor gegevensmanipulatie.

Het verschil met het direct verbinden met de database voor SQL-bewerkingen buiten de applicatie, is dat u binnen een workflow variabelen uit de procescontext kunt gebruiken als parameters in het SQL-statement.

## Installatie

Dit is een ingebouwde plugin, installatie is niet nodig.

## Knooppunt aanmaken

In de workflow-configuratie-interface klikt u op de plusknop ('+') in de flow om een 'SQL-actie'-knooppunt toe te voegen:

![SQL-actie toevoegen](https://static-docs.nocobase.com/0ce40a226d7a5bf3717813e27da40e62.png)

## Knooppuntconfiguratie

![SQL-knooppunt_Knooppuntconfiguratie](https://static-docs.nocobase.com/20240904002334.png)

### Gegevensbron

Selecteer de gegevensbron waarop de SQL wordt uitgevoerd.

De gegevensbron moet van het type database zijn, zoals de hoofdgegevensbron, PostgreSQL of andere Sequelize-compatibele gegevensbronnen.

### SQL-inhoud

Bewerk het SQL-statement. Momenteel wordt slechts één SQL-statement ondersteund.

Via de variabeleknop rechtsboven in de editor voegt u de benodigde variabelen in. Deze variabelen worden vóór uitvoering via tekstvervanging vervangen door hun corresponderende waarden. De resulterende tekst wordt vervolgens gebruikt als het uiteindelijke SQL-statement en naar de database gestuurd voor bevraging.

## Resultaat van knooppuntuitvoering

Sinds `v1.3.15-beta` is het resultaat van een SQL-knooppuntuitvoering een array van pure data. Daarvoor was het de native Sequelize-retourstructuur die query-metadata bevatte (zie: [`sequelize.query()`](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-query)).

Bijvoorbeeld, de volgende query:

```sql
select count(id) from posts;
```

Resultaat vóór `v1.3.15-beta`:

```json
[
    [
        { "count": 1 }
    ],
    {
        // meta
    }
]
```

Resultaat ná `v1.3.15-beta`:

```json
[
    { "count": 1 }
]
```

## Veelgestelde vragen

### Hoe gebruikt u het resultaat van een SQL-knooppunt?

Als een `SELECT`-statement wordt gebruikt, wordt het queryresultaat in JSON-formaat van Sequelize opgeslagen in het knooppunt. Het kan worden geparseerd en gebruikt met de [JSON-query](./json-query.md) plugin.

### Activeert de SQL-actie collectie-events?

**Nee**. De SQL-actie stuurt het SQL-statement direct naar de database voor verwerking. De gerelateerde `CREATE` / `UPDATE` / `DELETE`-bewerkingen vinden plaats in de database, terwijl collectie-events plaatsvinden op de applicatielaag van Node.js (verwerkt door de ORM), daarom worden collectie-events niet geactiveerd.