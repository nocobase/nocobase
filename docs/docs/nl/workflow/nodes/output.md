---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Workflow-uitvoer

## Introductie

Het "Workflow-uitvoer" knooppunt wordt gebruikt in een aangeroepen workflow om de uitvoerwaarde ervan te definiëren. Wanneer een workflow door een andere wordt aangeroepen, kunt u met het "Workflow-uitvoer" knooppunt een waarde teruggeven aan de aanroeper.

## Knooppunt aanmaken

In de aangeroepen workflow voegt u een "Workflow-uitvoer" knooppunt toe:

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Knooppunt configureren

### Uitvoerwaarde

Voer een variabele in of selecteer deze als uitvoerwaarde. De uitvoerwaarde kan van elk type zijn, zoals een constante (tekenreeks, getal, booleaanse waarde, datum of aangepaste JSON), of een andere variabele uit de workflow.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Tip}
Als u meerdere "Workflow-uitvoer" knooppunten toevoegt aan een aangeroepen workflow, dan wordt bij het aanroepen van de workflow de waarde van het laatst uitgevoerde "Workflow-uitvoer" knooppunt als uitvoer gebruikt.
:::