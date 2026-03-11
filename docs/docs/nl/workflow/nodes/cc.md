---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/workflow/nodes/cc) voor nauwkeurige informatie.
:::

# CC <Badge>v1.8.2+</Badge>

## Introductie

De CC-node wordt gebruikt om bepaalde contextuele inhoud van de uitvoering van een workflow naar gespecificeerde gebruikers te sturen ter informatie en inzage. Bijvoorbeeld in een goedkeurings- of ander proces kan relevante informatie worden ge-CC'd naar andere deelnemers, zodat zij tijdig op de hoogte blijven van de voortgang.

Er kunnen meerdere CC-nodes in een workflow worden ingesteld, zodat de relevante informatie naar de opgegeven ontvangers wordt verzonden wanneer de workflow-uitvoering deze node bereikt.

De CC-inhoud wordt weergegeven in het menu "CC naar mij" van het Takenoverzicht, waar gebruikers alle naar hen ge-CC'de inhoud kunnen bekijken. Op basis van de ongelezen status wordt de gebruiker geattendeerd op nog niet bekeken CC-inhoud; na het bekijken kan de gebruiker deze handmatig als gelezen markeren.

## Node aanmaken

Klik in de workflow-configuratie-interface op de plusknop ("+") in de flow om een "CC"-node toe te voegen:

![CC_toevoegen](https://static-docs.nocobase.com/20250710222842.png)

## Node-configuratie

![Node-configuratie](https://static-docs.nocobase.com/20250710224041.png)

In de node-configuratie-interface kunt u de volgende parameters instellen:

### Ontvangers

Ontvangers zijn de collectie van doelgebruikers voor de CC, wat één of meerdere gebruikers kunnen zijn. De geselecteerde bron kan een statische waarde zijn uit de gebruikerslijst, een dynamische waarde gespecificeerd door een variabele, of het resultaat van een query op de gebruikerscollectie.

![Ontvanger-configuratie](https://static-docs.nocobase.com/20250710224421.png)

### Gebruikersinterface

Ontvangers moeten de CC-inhoud bekijken in het menu "CC naar mij" van het Takenoverzicht. U kunt resultaten van de trigger en willekeurige nodes in de workflow-context configureren als inhoudsblokken.

![Gebruikersinterface](https://static-docs.nocobase.com/20250710225400.png)

### Taakkaart <Badge>2.0+</Badge>

Kan worden gebruikt om de taakkaarten in de lijst "CC naar mij" in het Takenoverzicht te configureren.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

In de kaart kunt u vrij de gewenste bedrijfsvelden configureren die u wilt weergeven (met uitzondering van relatievelden).

Nadat de workflow CC-taak is aangemaakt, is de aangepaste taakkaart zichtbaar in de lijst van het Takenoverzicht:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Taaktitel

De taaktitel is de titel die wordt weergegeven in het Takenoverzicht. U kunt variabelen uit de workflow-context gebruiken om de titel dynamisch te genereren.

![Taaktitel](https://static-docs.nocobase.com/20250710225603.png)

## Takenoverzicht

Gebruikers kunnen in het Takenoverzicht alle naar hen ge-CC'de inhoud bekijken en beheren, en filteren en bekijken op basis van de leesstatus.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Na het bekijken kan de inhoud als gelezen worden gemarkeerd, waarna het aantal ongelezen items dienovereenkomstig zal afnemen.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)