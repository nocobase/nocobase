---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Variabele

## Introductie

U kunt variabelen declareren in een workflow of waarden toewijzen aan reeds gedeclareerde variabelen. Dit wordt meestal gebruikt om tijdelijke gegevens binnen de workflow op te slaan.

## Knooppunt aanmaken

In de workflow configuratie-interface klikt u op de plusknop ("+") in de workflow om een "Variabele" knooppunt toe te voegen:

![Add Variable Node](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Knooppunt configureren

### Modus

Het variabele knooppunt is vergelijkbaar met variabelen in programmeertalen; u moet het eerst declareren voordat u het kunt gebruiken en er een waarde aan kunt toewijzen. Daarom moet u bij het aanmaken van een variabele knooppunt de modus van de variabele kiezen. Er zijn twee modi beschikbaar:

![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Nieuwe variabele declareren: Hiermee maakt u een nieuwe variabele aan.
- Waarde toewijzen aan bestaande variabele: Hiermee wijst u een waarde toe aan een variabele die eerder in de workflow is gedeclareerd, wat gelijk staat aan het wijzigen van de waarde van de variabele.

Wanneer het knooppunt dat u aanmaakt het eerste variabele knooppunt in de workflow is, kunt u alleen de declaratiemodus kiezen, omdat er op dat moment nog geen variabelen beschikbaar zijn om een waarde aan toe te wijzen.

Wanneer u ervoor kiest om een waarde toe te wijzen aan een gedeclareerde variabele, moet u ook de doelvariabele selecteren, oftewel het knooppunt waar de variabele is gedeclareerd:

![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Waarde

De waarde van een variabele kan van elk type zijn. Het kan een constante zijn, zoals een string, getal, booleaanse waarde of datum, of het kan een andere variabele uit de workflow zijn.

In de declaratiemodus staat het instellen van de variabelewaarde gelijk aan het toewijzen van een initiële waarde aan de variabele.

![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)

In de toewijzingsmodus staat het instellen van de variabelewaarde gelijk aan het wijzigen van de waarde van de gedeclareerde doelvariabele naar een nieuwe waarde. Bij later gebruik zal deze nieuwe waarde worden opgehaald.

![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## De waarde van de variabele gebruiken

In de knooppunten die volgen op het variabele knooppunt, kunt u de waarde van de variabele gebruiken door de gedeclareerde variabele te selecteren uit de groep "Knooppuntvariabelen". Bijvoorbeeld, in een query knooppunt, gebruikt u de waarde van de variabele als een queryconditie:

![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Voorbeeld

Een nuttiger scenario voor het variabele knooppunt is in vertakkingen, waar nieuwe waarden worden berekend of samengevoegd met eerdere waarden (vergelijkbaar met `reduce`/`concat` in programmeren), en vervolgens worden gebruikt nadat de vertakking is voltooid. Hieronder volgt een voorbeeld van het gebruik van een lusvertakking en een variabele knooppunt om een ontvanger-string samen te stellen.

Maak eerst een collectie-getriggerde workflow aan die triggert wanneer "Artikel" gegevens worden bijgewerkt, en laad de gerelateerde "Auteur" relatiegegevens voor (om ontvangers te verkrijgen):

![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Maak vervolgens een variabele knooppunt aan om de ontvanger-string op te slaan:

![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Maak daarna een lusvertakkingsknooppunt aan om door de auteurs van het artikel te itereren en hun ontvangerinformatie samen te voegen in de ontvanger-variabele:

![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Binnen de lusvertakking maakt u eerst een rekenknooppunt aan om de huidige auteur samen te voegen met de reeds opgeslagen auteur-string:

![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Na het rekenknooppunt maakt u nog een variabele knooppunt aan. Selecteer de toewijzingsmodus, kies het ontvanger-variabele knooppunt als toewijzingsdoel, en selecteer het resultaat van het rekenknooppunt als waarde:

![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Op deze manier, nadat de lusvertakking is voltooid, bevat de ontvanger-variabele de ontvanger-string van alle auteurs van het artikel. Vervolgens kunt u na de lus een HTTP-verzoek knooppunt gebruiken om een e-mailverzend-API aan te roepen, waarbij u de waarde van de ontvanger-variabele als ontvangerparameter aan de API doorgeeft:

![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71aa1c3e172bcb2dce10a250947e.png)

Hiermee is een eenvoudige bulk-e-mailfunctie geïmplementeerd met behulp van een lus en een variabele knooppunt.