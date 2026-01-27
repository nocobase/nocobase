:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Variabelen

## Introductie

Variabelen zijn tokens die een waarde in de huidige context identificeren. U kunt ze gebruiken bij het configureren van gegevensbereiken voor blokken, standaardwaarden voor velden, koppelingsregels en workflows.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Momenteel ondersteunde variabelen

### Huidige gebruiker

Geeft de gegevens weer van de momenteel ingelogde gebruiker.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Huidige rol

Geeft de rol-ID (rolnaam) weer van de momenteel ingelogde gebruiker.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Huidig formulier

De waarden van het huidige formulier, uitsluitend gebruikt in formulierblokken. Gebruiksscenario's zijn onder andere:

- Koppelingsregels voor het huidige formulier
- Standaardwaarden voor formuliervelden (alleen effectief bij het toevoegen van nieuwe gegevens)
- Gegevensbereikinstellingen voor relatievelden
- Configuratie van veldwaarde-toewijzing voor indieningsacties

#### Koppelingsregels voor het huidige formulier

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Standaardwaarden voor formuliervelden (alleen voor nieuwe formulieren)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

<!-- ![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif) -->

#### Gegevensbereikinstellingen voor relatievelden

Wordt gebruikt om de opties van een afhankelijk veld dynamisch te filteren op basis van een bovenliggend veld, wat zorgt voor nauwkeurige gegevensinvoer.

**Voorbeeld:**

1. De gebruiker selecteert een waarde voor het veld **Owner**.
2. Het systeem filtert automatisch de opties voor het veld **Account** op basis van de **userName** van de geselecteerde Owner.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

<!-- ![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif) -->

<!-- #### Configuratie van veldwaarde-toewijzing voor indieningsacties

![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif) -->

<!-- ### Huidig object

Momenteel alleen gebruikt voor veldconfiguratie in subformulieren en subtabellen binnen een formulierblok, en vertegenwoordigt de waarde van elk item:

- Standaardwaarde voor subvelden
- Gegevensbereik voor subrelatievelden

#### Standaardwaarde voor subvelden

![20240416172933_rec_](https://static-docs.nocobase.com/20240416172933_rec_.gif)

#### Gegevensbereik voor subrelatievelden

![20240416173043_rec_](https://static-docs.nocobase.com/20240416173043_rec_.gif) -->

<!-- ### Bovenliggend object

Vergelijkbaar met "Huidig object", vertegenwoordigt het het bovenliggende object van het huidige object. Ondersteund in NocoBase v1.3.34-beta en hoger. -->

### Huidige record

Een record verwijst naar een rij in een `collectie`, waarbij elke rij één record vertegenwoordigt. De variabele "Huidige record" is beschikbaar in de **koppelingsregels voor rijacties** van weergaveblokken.

Voorbeeld: Schakel de verwijderknop uit voor documenten die "Betaald" zijn.

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Huidige pop-up record

Pop-up acties spelen een zeer belangrijke rol in de NocoBase interfaceconfiguratie.

- Pop-up voor rijacties: Elke pop-up heeft een variabele "Huidige pop-up record", die de huidige rijrecord vertegenwoordigt.
- Pop-up voor relatievelden: Elke pop-up heeft een variabele "Huidige pop-up record", die de momenteel aangeklikte relatierecord vertegenwoordigt.

Blokken binnen een pop-up kunnen de variabele "Huidige pop-up record" gebruiken. Gerelateerde gebruiksscenario's zijn onder andere:

- Het configureren van het gegevensbereik van een blok
- Het configureren van het gegevensbereik van een relatieveld
- Het configureren van standaardwaarden voor velden (in een formulier voor het toevoegen van nieuwe gegevens)
- Het configureren van koppelingsregels voor acties

<!-- #### Het configureren van het gegevensbereik van een blok

![20251027151107](https://static-docs.nocobase.com/20251027151107.png)

#### Het configureren van het gegevensbereik van een relatieveld

![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)

#### Het configureren van standaardwaarden voor velden (in een formulier voor het toevoegen van nieuwe gegevens)

![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)

#### Het configureren van koppelingsregels voor acties

![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)

<!--
#### Configuratie van veldwaarde-toewijzing voor formulier indieningsacties

![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif) -->

<!-- ### Geselecteerde tabelrecords

Momenteel alleen gebruikt voor de standaardwaarde van formuliervelden in de actie "Record toevoegen" van een tabelblok

#### Standaardwaarde van formuliervelden voor de actie "Record toevoegen" -->

<!-- ### Bovenliggende record (verouderd)

Alleen gebruikt in relatieblokken, en vertegenwoordigt de bronrecord van de relatiegegevens.

:::warning
"Bovenliggende record" is verouderd. Het wordt aanbevolen om in plaats daarvan de gelijkwaardige "Huidige pop-up record" te gebruiken.
:::

<!-- ### Datumvariabelen

Datumvariabelen zijn dynamisch parseerbare datumplaatsaanduidingen die in het systeem kunnen worden gebruikt om gegevensbereiken voor blokken, gegevensbereiken voor relatievelden, datumvoorwaarden in koppelingsregels voor acties en standaardwaarden voor datumvelden in te stellen. De parseermethode van datumvariabelen varieert afhankelijk van het gebruiksscenario: in toewijzingsscenario's (zoals het instellen van standaardwaarden) worden ze geparseerd naar specifieke tijdstippen; in filterscenario's (zoals gegevensbereikvoorwaarden) worden ze geparseerd naar tijdsperioden om flexibelere filtering te ondersteunen.

#### Filterscenario's

Gerelateerde gebruiksscenario's zijn onder andere:

- Het instellen van datumveldvoorwaarden voor gegevensbereiken van blokken
- Het instellen van datumveldvoorwaarden voor gegevensbereiken van relatievelden
- Het instellen van datumveldvoorwaarden voor koppelingsregels voor acties

![20250522211606](https://static-docs.nocobase.com/20250522211606.png)

Gerelateerde variabelen zijn onder andere:

- Huidige tijd
- Gisteren
- Vandaag
- Morgen
- Vorige week
- Deze week
- Volgende week
- Vorige maand
- Deze maand
- Volgende maand
- Vorig kwartaal
- Dit kwartaal
- Volgend kwartaal
- Vorig jaar
- Dit jaar
- Volgend jaar
- Afgelopen 7 dagen
- Volgende 7 dagen
- Afgelopen 30 dagen
- Volgende 30 dagen
- Afgelopen 90 dagen
- Volgende 90 dagen

#### Toewijzingsscenario's

In toewijzingsscenario's wordt dezelfde datumvariabele automatisch geparseerd naar verschillende formaten op basis van het type van het doelveld. Bijvoorbeeld, bij het gebruik van "Vandaag" om een waarde toe te wijzen aan verschillende typen datumvelden:

- Voor tijdstempelvelden (Timestamp) en datum/tijdvelden met tijdzone (DateTime with timezone) wordt de variabele geparseerd naar een complete UTC-tijdreeks, zoals 2024-04-20T16:00:00.000Z, die tijdzone-informatie bevat en geschikt is voor synchronisatiebehoeften over tijdzones heen.

- Voor datum/tijdvelden zonder tijdzone (DateTime without timezone) wordt de variabele geparseerd naar een lokale tijdformaatreeks, zoals 2025-04-21 00:00:00, zonder tijdzone-informatie, wat geschikter is voor lokale bedrijfslogica.

- Voor alleen-datumvelden (DateOnly) wordt de variabele geparseerd naar een pure datumreeks, zoals 2025-04-21, die alleen het jaar, de maand en de dag bevat, zonder tijdsdeel.

Het systeem parseert de variabele intelligent op basis van het veldtype om het juiste formaat tijdens de toewijzing te garanderen, waardoor gegevensfouten of uitzonderingen als gevolg van type-mismatches worden voorkomen.

![20250522212802](https://static-docs.nocobase.com/20250522212802.png)

Gerelateerde gebruiksscenario's zijn onder andere:

- Het instellen van standaardwaarden voor datumvelden in formulierblokken
- Het instellen van het waardeattribuut voor datumvelden in koppelingsregels
- Het toewijzen van waarden aan datumvelden in indieningsknoppen

Gerelateerde variabelen zijn onder andere:

- Nu
- Gisteren
- Vandaag
- Morgen -->

### URL-queryparameters

Deze variabele vertegenwoordigt de queryparameters in de URL van de huidige pagina. Ze is alleen beschikbaar wanneer er een queryreeks in de pagina-URL aanwezig is. Het is handiger om deze te gebruiken in combinatie met de [Link-actie](/interface-builder/actions/types/link).

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API-token

De waarde van deze variabele is een tekenreeks die dient als referentie voor toegang tot de NocoBase API. U kunt deze gebruiken om de identiteit van de gebruiker te verifiëren.

### Huidig apparaattype

Voorbeeld: Toon de actie "Sjabloon afdrukken" niet op niet-desktopapparaten.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)