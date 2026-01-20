---
pkg: "@nocobase/plugin-action-export"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Exporteren

## Introductie

De exportfunctie stelt u in staat om gefilterde records te exporteren naar **Excel**-formaat. U kunt hierbij zelf de te exporteren velden configureren. Gebruikers kunnen de benodigde velden selecteren voor verdere data-analyse, -verwerking of archivering. Deze functie vergroot de flexibiliteit van data-operaties, vooral in situaties waarin data moet worden overgedragen naar andere platforms of verder moet worden verwerkt.

### Belangrijkste functies:
- **Veldselectie**: U kunt de te exporteren velden configureren en selecteren, zodat de geëxporteerde data nauwkeurig en beknopt is.
- **Ondersteuning voor Excel-formaat**: De geëxporteerde data wordt opgeslagen als een standaard Excel-bestand, wat integratie en analyse met andere data vergemakkelijkt.

Met deze functie exporteert u eenvoudig belangrijke data uit uw werk voor extern gebruik, wat de efficiëntie verhoogt.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)
## Actieconfiguratie

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Exporteerbare velden

- Eerste niveau: Alle velden van de huidige collectie;
- Tweede niveau: Als het een relatieveld betreft, selecteert u de velden van de gerelateerde collectie;
- Derde niveau: Er worden slechts drie niveaus verwerkt; de relatievelden op het laatste niveau worden niet weergegeven;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Koppelingsregel](/interface-builder/actions/action-settings/linkage-rule): Toont/verbergt de knop dynamisch;
- [Knop bewerken](/interface-builder/actions/action-settings/edit-button): Bewerk de titel, het type en het pictogram van de knop;