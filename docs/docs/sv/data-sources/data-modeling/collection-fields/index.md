:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Samlingsfält

## Gränssnittstyper för fält

NocoBase klassificerar fält i följande kategorier utifrån gränssnittsperspektivet:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Fältens datatyper

Varje fältgränssnitt har en standarddatatyp. Till exempel, för fält där gränssnittet är ett tal (`Number`), är standarddatatypen `double`, men det kan också vara `float`, `decimal` med mera. De datatyper som stöds för närvarande är:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mappning av fälttyper

Processen för att lägga till nya fält i huvuddatabasen är följande:

1. Välj gränssnittstyp
2. Konfigurera den valfria datatypen för det aktuella gränssnittet

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Processen för fältmappning från externa datakällor är:

1. Mappa automatiskt motsvarande datatyp (`Field type`) och UI-typ (`Field Interface`) baserat på fälttypen i den externa databasen.
2. Ändra till en mer lämplig datatyp och gränssnittstyp vid behov.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)