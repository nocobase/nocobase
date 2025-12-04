---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Många-till-många (Array)

## Introduktion

Denna funktion låter er använda array-fält i en databassamling för att lagra flera unika nycklar från målsamlingen, och på så sätt skapa en många-till-många-relation mellan de två samlingarna. Tänk er till exempel entiteterna Artiklar och Taggar. En artikel kan kopplas till flera taggar, där artikelsamlingen lagrar ID:n för motsvarande poster från taggsamlingen i ett array-fält.

:::warning{title=Obs}

- När det är möjligt rekommenderas det att ni använder en kopplingssamling för att etablera en standard [många-till-många](../data-modeling/collection-fields/associations/m2m/index.md) relation istället för att förlita er på denna metod.
- För närvarande är det endast PostgreSQL som stöder filtrering av data i källsamlingen med hjälp av fält från målsamlingen för många-till-många-relationer som etablerats med array-fält. I exemplet ovan kan ni till exempel filtrera artiklar baserat på andra fält i taggsamlingen, såsom titeln.

  :::

### Fältkonfiguration

![Konfiguration av många-till-många (array)-fält](https://static-docs.nocobase.com/202407051108180.png)

## Parameterbeskrivning

### Källsamling

Källsamlingen, det vill säga den samling där det aktuella fältet finns.

### Målsamling

Målsamlingen, den samling som relationen etableras med.

### Främmande nyckel

Array-fältet i källsamlingen som lagrar målsamlingens Target key.

Motsvarande relationer för array-fältstyper är följande:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Target key

Fältet i målsamlingen som motsvarar de värden som lagras i källsamlingens array-fält. Detta fält måste vara unikt.