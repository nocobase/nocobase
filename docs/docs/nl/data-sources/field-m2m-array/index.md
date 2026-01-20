---
pkg: "@nocobase/plugin-field-m2m-array"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Vele-op-vele (array)

## Introductie

Met deze functionaliteit kunt u array-velden in een collectie gebruiken om meerdere unieke sleutels van de doelcollectie op te slaan, waardoor u een vele-op-vele relatie tussen de twee collecties kunt leggen. Denk bijvoorbeeld aan de entiteiten Artikelen en Tags. Een artikel kan aan meerdere tags gekoppeld zijn, waarbij de artikelcollectie de ID's van de corresponderende records uit de tagscollectie opslaat in een array-veld.

:::warning{title=Let op}

- Gebruik waar mogelijk een koppelcollectie om een standaard [vele-op-vele](../data-modeling/collection-fields/associations/m2m/index.md) relatie te leggen, in plaats van deze methode te gebruiken.
- Momenteel ondersteunt alleen PostgreSQL het filteren van gegevens in de broncollectie met behulp van velden uit de doelcollectie voor vele-op-vele relaties die zijn gelegd met array-velden. Bijvoorbeeld, in het bovengenoemde scenario, kunt u artikelen filteren op basis van andere velden in de tagscollectie, zoals de titel.

  :::

### Veldconfiguratie

![many-to-many(array) field configuration](https://static-docs.nocobase.com/202407051108180.png)

## Parameterbeschrijving

### Broncollectie

De broncollectie, waar het huidige veld zich bevindt.

### Doelcollectie

De doelcollectie waarmee de relatie wordt gelegd.

### Vreemde sleutel

Het array-veld in de broncollectie dat de doelsleutel uit de doelcollectie opslaat.

De corresponderende relaties voor array-veldtypen zijn als volgt:

| NocoBase | PostgreSQL | MySQL  | SQLite |
| -------- | ---------- | ------ | ------ |
| `set`    | `array`    | `JSON` | `JSON` |

### Doelsleutel

Het veld in de doelcollectie dat overeenkomt met de waarden die zijn opgeslagen in het array-veld van de broncollectie. Dit veld moet uniek zijn.