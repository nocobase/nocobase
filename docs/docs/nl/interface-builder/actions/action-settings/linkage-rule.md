:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Actiekoppelingsregels

## Introductie

Met actiekoppelingsregels kunt u dynamisch de status van een actie (zoals tonen, inschakelen, verbergen, uitschakelen, enz.) beheren op basis van specifieke voorwaarden. Door deze regels te configureren, kunt u het gedrag van actieknoppen koppelen aan de huidige record, gebruikersrol of contextuele gegevens.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Gebruik

Wanneer aan de voorwaarde is voldaan (standaard wordt deze doorgevoerd als er geen voorwaarde is ingesteld), wordt de uitvoering van eigenschapsinstellingen of JavaScript geactiveerd. Constanten en variabelen worden ondersteund bij de voorwaardelijke beoordeling.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

De regel ondersteunt het wijzigen van knopeigenschappen.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Constanten

Voorbeeld: Betaalde bestellingen kunnen niet worden bewerkt.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variabelen

### Systeemvariabelen

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Voorbeeld 1: Beheer de zichtbaarheid van een knop op basis van het huidige apparaattype.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Voorbeeld 2: De bulkupdate-knop in de tabelkop van het bestellingenblok is alleen beschikbaar voor de beheerdersrol; andere rollen kunnen deze actie niet uitvoeren.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Contextuele Variabelen

Voorbeeld: De knop 'Toevoegen' bij de orderkansen (relatieblok) is alleen ingeschakeld wanneer de orderstatus 'Wacht op betaling' of 'Concept' is. In andere statussen wordt de knop uitgeschakeld.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Voor meer informatie over variabelen, zie [Variabelen](/interface-builder/variables).