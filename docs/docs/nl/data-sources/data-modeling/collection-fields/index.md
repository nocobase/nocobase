:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Collectievelden

## Interfacetypen van velden

Vanuit het Interface-perspectief deelt NocoBase velden in de volgende categorieën in:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Gegevenstypen van velden

Elke Field Interface heeft een standaard gegevenstype. Bijvoorbeeld, voor velden met een Interface van het type Nummer (Number), is het standaard gegevenstype `double`, maar dit kan ook `float`, `decimal` of iets anders zijn. De momenteel ondersteunde gegevenstypen zijn:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Toewijzing van veldtypen

Zo voegt u nieuwe velden toe aan de hoofd database:

1. Selecteer het Interface-type
2. Configureer het optionele gegevenstype voor dit Interface-type

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Voor veldtoewijzing vanuit externe gegevensbronnen volgt u deze stappen:

1. De corresponderende gegevenstypen (Field type) en UI-typen (Field Interface) worden automatisch toegewezen op basis van het veldtype van de externe database.
2. Pas deze indien nodig aan naar een geschikter gegevenstype en Interface-type.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)