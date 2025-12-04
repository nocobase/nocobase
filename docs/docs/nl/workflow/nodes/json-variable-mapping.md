---
pkg: '@nocobase/plugin-workflow-json-variable-mapping'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# JSON Variabele Mapping

> v1.6.0

## Introductie

Deze plugin wordt gebruikt om complexe JSON-structuren uit de resultaten van upstream-nodes om te zetten naar variabelen, zodat u deze in volgende nodes kunt gebruiken. Na het mappen van de resultaten van bijvoorbeeld SQL-actie- en HTTP-verzoek-nodes, kunt u de eigenschapswaarden ervan direct in volgende nodes gebruiken.

:::info{title=Tip}
In tegenstelling tot de JSON Berekening-node, ondersteunt de JSON Variabele Mapping-node geen aangepaste expressies en is deze niet gebaseerd op een externe engine. U gebruikt deze alleen om eigenschapswaarden in een JSON-structuur te mappen, wat het gebruik eenvoudiger maakt.
:::

## Node aanmaken

In de configuratie-interface van de workflow klikt u op de plusknop ('+') in de workflow om een 'JSON Variabele Mapping'-node toe te voegen:

![Node aanmaken](https://static-docs.nocobase.com/20250113173635.png)

## Node-configuratie

### Gegevensbron

De gegevensbron kan het resultaat zijn van een upstream-node of een data-object in de procescontext. Dit is meestal een ongestructureerd data-object, zoals het resultaat van een SQL-node of een HTTP-verzoek-node.

![Gegevensbron](https://static-docs.nocobase.com/20250113173720.png)

### Voorbeelddata invoeren

Plak voorbeelddata en klik op de 'Parsen'-knop om automatisch een lijst met variabelen te genereren:

![Voorbeelddata invoeren](https://static-docs.nocobase.com/20250113182327.png)

Als er variabelen in de automatisch gegenereerde lijst staan die u niet nodig heeft, kunt u op de 'Verwijderen'-knop klikken om ze te verwijderen.

:::info{title=Tip}
De voorbeelddata is niet het uiteindelijke uitvoerresultaat; het wordt alleen gebruikt om te helpen bij het genereren van de variabelenlijst.
:::

### Pad inclusief array-index

Als deze optie niet is aangevinkt, wordt de inhoud van de array gemapt volgens de standaard variabele-afhandeling van NocoBase-workflows. Voer bijvoorbeeld het volgende voorbeeld in:

```json
{
  "a": 1,
  "b": [
    {
      "c": 2
    },
    {
      "c": 3
    }
  ]
}
```

In de gegenereerde variabelen zal `b.c` de array `[2, 3]` vertegenwoordigen.

Als u deze optie wel aanvinkt, zal het variabelepad de array-index bevatten, bijvoorbeeld `b.0.c` en `b.1.c`.

![20250113184056](https://static-docs.nocobase.com/20250113184056.png)

Wanneer array-indices zijn opgenomen, moet u ervoor zorgen dat de array-indices in de invoerdata consistent zijn; anders kan dit leiden tot een parseringsfout.

## Gebruik in volgende nodes

In de configuratie van volgende nodes kunt u de variabelen gebruiken die door de JSON Variabele Mapping-node zijn gegenereerd:

![20250113203658](https://static-docs.nocobase.com/20250113203658.png)

Hoewel de JSON-structuur complex kan zijn, hoeft u na het mappen alleen de variabele voor het corresponderende pad te selecteren.