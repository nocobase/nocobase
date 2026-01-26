---
pkg: '@nocobase/plugin-acl'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Rechten configureren

## Algemene rechteninstellingen

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Configuratierechten

1.  Interface configureren toestaan: Dit recht bepaalt of een gebruiker de interface mag configureren. Wanneer u dit recht activeert, verschijnt er een UI-configuratieknop. De "admin"-rol heeft dit recht standaard ingeschakeld.
2.  Plugins installeren, activeren, deactiveren toestaan: Dit recht bepaalt of een gebruiker plugins mag inschakelen of uitschakelen. Wanneer dit recht actief is, krijgt de gebruiker toegang tot de pluginbeheerinterface. De "admin"-rol heeft dit recht standaard ingeschakeld.
3.  Plugins configureren toestaan: Dit recht stelt de gebruiker in staat om pluginparameters te configureren of backendgegevens van plugins te beheren. De "admin"-rol heeft dit recht standaard ingeschakeld.
4.  Cache wissen, applicatie herstarten toestaan: Dit recht is gekoppeld aan systeembeheertaken zoals het wissen van de cache en het herstarten van de applicatie. Na activering verschijnen de bijbehorende bedieningsknoppen in het persoonlijke centrum. Dit recht is standaard uitgeschakeld.
5.  Nieuwe menu-items standaard toegankelijk: Nieuw aangemaakte menu's zijn standaard toegankelijk, en deze instelling is standaard ingeschakeld.

### Globale actierechten

Globale actierechten zijn universeel van toepassing op alle collecties en worden gecategoriseerd op basis van het type bewerking. Deze rechten kunt u configureren op basis van de gegevensomvang: alle gegevens of de eigen gegevens van de gebruiker. De eerste optie staat bewerkingen toe op de gehele collectie, terwijl de laatste optie bewerkingen beperkt tot gegevens die relevant zijn voor de gebruiker.

## Collectie actierechten

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b5218e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Collectie actierechten verfijnen de globale actierechten door de toegang tot bronnen binnen elke collectie individueel te configureren. Deze rechten zijn verdeeld in twee aspecten:

1.  Actierechten: Deze omvatten acties zoals toevoegen, bekijken, bewerken, verwijderen, exporteren en importeren. De rechten worden ingesteld op basis van de gegevensomvang:
    -   Alle records: Geeft de gebruiker de mogelijkheid om acties uit te voeren op alle records binnen de collectie.
    -   Eigen records: Beperkt de gebruiker tot het uitvoeren van acties alleen op records die zij zelf hebben aangemaakt.

2.  Veldrechten: Veldrechten stellen u in staat om specifieke rechten in te stellen voor elk veld tijdens verschillende bewerkingen. Zo kunnen bepaalde velden worden geconfigureerd als alleen-lezen, zonder bewerkingsrechten.

## Menu-toegangsrechten

Menu-toegangsrechten bepalen de toegang op basis van menu-items.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Plugin-configuratierechten

Plugin-configuratierechten bepalen de mogelijkheid om specifieke pluginparameters te configureren. Wanneer dit is ingeschakeld, verschijnt de bijbehorende pluginbeheerinterface in het admincentrum.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)