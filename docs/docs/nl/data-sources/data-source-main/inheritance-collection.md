---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Overervingscollectie

## Introductie

:::warning
Alleen ondersteund wanneer de primaire database PostgreSQL is.
:::

U kunt een bovenliggende collectie aanmaken en daaruit een onderliggende collectie afleiden. De onderliggende collectie erft de structuur van de bovenliggende collectie en kan daarnaast ook eigen kolommen definiëren. Dit ontwerppatroon helpt bij het organiseren en beheren van gegevens met vergelijkbare structuren, maar met mogelijke verschillen.

Hier zijn enkele veelvoorkomende kenmerken van collecties met overerving:

- Bovenliggende collectie: De bovenliggende collectie bevat algemene kolommen en gegevens, en definieert de basisstructuur van de gehele overervingshiërarchie.
- Onderliggende collectie: De onderliggende collectie erft de structuur van de bovenliggende collectie, maar kan ook eigen kolommen definiëren. Dit stelt elke onderliggende collectie in staat om de algemene eigenschappen van de bovenliggende collectie te bezitten, terwijl het tegelijkertijd attributen kan bevatten die specifiek zijn voor de subklasse.
- Query's: Bij het uitvoeren van query's kunt u ervoor kiezen om de gehele overervingshiërarchie te bevragen, of alleen de bovenliggende collectie of een specifieke onderliggende collectie. Dit maakt het mogelijk om gegevens op verschillende niveaus op te halen en te verwerken, afhankelijk van uw behoeften.
- Overervingsrelatie: Er wordt een overervingsrelatie tot stand gebracht tussen de bovenliggende en onderliggende collectie. Dit betekent dat u de structuur van de bovenliggende collectie kunt gebruiken om consistente attributen te definiëren, terwijl de onderliggende collectie deze attributen kan uitbreiden of overschrijven.

Dit ontwerppatroon helpt om dataredundantie te verminderen, het databasemodel te vereenvoudigen en gegevens gemakkelijker te onderhouden. U moet echter voorzichtig zijn met het gebruik ervan, aangezien collecties met overerving de complexiteit van query's kunnen vergroten, vooral bij het omgaan met de gehele overervingshiërarchie. Databasesystemen die collecties met overerving ondersteunen, bieden doorgaans specifieke syntaxis en tools om dergelijke collectiestructuren te beheren en te bevragen.

## Gebruikershandleiding

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)