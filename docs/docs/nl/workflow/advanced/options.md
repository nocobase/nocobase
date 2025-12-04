:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Geavanceerde configuratie

## Uitvoeringsmodus

Workflows worden asynchroon of synchroon uitgevoerd, afhankelijk van het triggertype dat u tijdens het aanmaken kiest. De asynchrone modus betekent dat, nadat een specifieke gebeurtenis is geactiveerd, de workflow in een wachtrij terechtkomt en één voor één door de achtergrondplanning wordt uitgevoerd. De synchrone modus daarentegen komt na activering niet in de planningswachtrij, maar begint direct met de uitvoering en geeft onmiddellijk feedback na voltooiing.

Collectie-evenementen, na-actie-evenementen, aangepaste actie-evenementen, geplande evenementen en goedkeuringsevenementen worden standaard asynchroon uitgevoerd. Voor-actie-evenementen worden standaard synchroon uitgevoerd. Zowel collectie-evenementen als formulier-evenementen ondersteunen beide modi, die u kunt selecteren bij het aanmaken van een workflow:

![Synchrone modus_Workflow synchroon aanmaken](https://static-docs.nocobase.com/39bc0821f50c1bde4729c531c6236795.png)

:::info{title=Tip}
Vanwege hun aard kunnen synchrone workflows geen knooppunten gebruiken die een 'wachtende' status veroorzaken, zoals 'Handmatige verwerking'.
:::

## Uitvoeringsgeschiedenis automatisch verwijderen

Wanneer een workflow frequent wordt geactiveerd, kunt u het automatisch verwijderen van de uitvoeringsgeschiedenis configureren. Dit vermindert de overlast en verlicht tegelijkertijd de opslagdruk op de database.

U kunt ook configureren of de uitvoeringsgeschiedenis van een workflow automatisch moet worden verwijderd, in de aanmaak- en bewerkingsvensters van de workflow.

![Configuratie voor automatisch verwijderen van uitvoeringsgeschiedenis](https://static-docs.nocobase.com/b2e4c08e7a01e213069912fe04baa7bd.png)

Automatisch verwijderen kan worden geconfigureerd op basis van de status van het uitvoeringsresultaat. In de meeste gevallen wordt aanbevolen om alleen de status 'Voltooid' aan te vinken, zodat u records van mislukte uitvoeringen behoudt voor toekomstige probleemoplossing.

Het wordt aanbevolen om het automatisch verwijderen van de uitvoeringsgeschiedenis niet in te schakelen wanneer u een workflow debugt, zodat u de geschiedenis kunt gebruiken om te controleren of de uitvoeringslogica van de workflow aan de verwachtingen voldoet.

:::info{title=Tip}
Het verwijderen van de geschiedenis van een workflow vermindert het aantal uitgevoerde keren niet.
:::