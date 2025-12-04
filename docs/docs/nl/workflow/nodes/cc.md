---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# CC <Badge>v1.8.2+</Badge>

## Introductie

De CC-node wordt gebruikt om bepaalde contextuele inhoud van de uitvoering van een workflow naar specifieke gebruikers te sturen, zodat zij deze kunnen inzien en raadplegen. In een goedkeuringsproces of een andere procedure kunt u bijvoorbeeld relevante informatie CC'en naar andere deelnemers, zodat zij op de hoogte blijven van de voortgang.

U kunt meerdere CC-nodes instellen in een workflow. Wanneer de workflow-uitvoering deze node bereikt, wordt de relevante informatie naar de opgegeven ontvangers gestuurd.

De CC-inhoud wordt weergegeven in het menu "CC aan mij" van het Takenoverzicht. Hier kunnen gebruikers alle inhoud bekijken die aan hen is ge-CC'd. Ongelezen items worden gemarkeerd en gebruikers kunnen deze handmatig als gelezen markeren nadat ze de inhoud hebben bekeken.

## Node aanmaken

Klik in de workflow-configuratie-interface op de plusknop ("+") in de flow om een "CC"-node toe te voegen:

![Add Carbon Copy](https://static-docs.nocobase.com/20250710222842.png)

## Node-configuratie

![Node Configuration](https://static-docs.nocobase.com/20250710224041.png)

In de node-configuratie-interface kunt u de volgende parameters instellen:

### Ontvangers

Ontvangers zijn de collectie van doelgebruikers voor de CC, dit kan één of meerdere gebruikers zijn. De bron kan een statische waarde zijn, geselecteerd uit de gebruikerslijst, een dynamische waarde gespecificeerd door een variabele, of het resultaat van een query op de gebruikerscollectie.

![Recipient Configuration](https://static-docs.nocobase.com/20250710224421.png)

### Gebruikersinterface

Ontvangers moeten de CC-inhoud bekijken in het menu "CC aan mij" van het Takenoverzicht. U kunt de resultaten van de trigger en elke node in de workflow-context configureren als inhoudsblokken.

![User Interface](https://static-docs.nocobase.com/20250710225400.png)

### Taaktitel

De taaktitel is de titel die wordt weergegeven in het Takenoverzicht. U kunt variabelen uit de workflow-context gebruiken om de titel dynamisch te genereren.

![Task Title](https://static-docs.nocobase.com/20250710225603.png)

## Takenoverzicht

Gebruikers kunnen in het Takenoverzicht alle inhoud bekijken en beheren die aan hen is ge-CC'd, en deze filteren en bekijken op basis van de leesstatus.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Na het bekijken kunt u de inhoud als gelezen markeren, waarna het aantal ongelezen items dienovereenkomstig zal afnemen.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)