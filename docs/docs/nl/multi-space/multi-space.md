---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/multi-space/multi-space) voor nauwkeurige informatie.
:::

# Multi-ruimte

## Introductie

De **Multi-ruimte plugin** maakt het mogelijk om binnen een enkele applicatie-instantie meerdere onafhankelijke gegevensruimtes te creëren via logische isolatie.

#### Toepassingsscenario's
- **Meerdere winkels of fabrieken**: Bedrijfsprocessen en systeemconfiguraties zijn in hoge mate consistent — zoals uniform voorraadbeheer, productieplanning, verkoopstrategieën en rapportagesjablonen — maar de gegevens van elke bedrijfseenheid moeten onafhankelijk blijven.
- **Beheer van meerdere organisaties of dochterondernemingen**: Meerdere organisaties of dochterondernemingen onder een moederbedrijf delen hetzelfde platform, maar elk merk heeft onafhankelijke klant-, product- en ordergegevens.

## Installatie

Zoek de **Multi-ruimte (Multi-Space)** plugin in het Pluginbeheer en schakel deze in.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Gebruikershandleiding

### Multi-ruimtebeheer

Ga na het inschakelen van de plugin naar de instellingenpagina **「Gebruikers & Machtigingen」** en wissel naar het paneel **Ruimte** om ruimtes te beheren.

> In de beginstatus is er een ingebouwde **Niet-toegewezen ruimte (Unassigned Space)** aanwezig, die voornamelijk wordt gebruikt om oude gegevens te bekijken die nog niet aan een ruimte zijn gekoppeld.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Ruimte aanmaken

Klik op de knop "Ruimte toevoegen" om een nieuwe ruimte aan te maken:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Gebruikers toewijzen

Nadat u een aangemaakte ruimte heeft geselecteerd, kunt u aan de rechterkant de gebruikers instellen die bij die ruimte horen:

> **Tip:** Nadat u gebruikers aan een ruimte heeft toegewezen, moet u de pagina **handmatig vernieuwen**. Pas daarna wordt de keuzelijst voor ruimtes in de rechterbovenhoek bijgewerkt met de nieuwste ruimtes.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Wisselen tussen en bekijken van ruimtes

In de rechterbovenhoek kunt u wisselen tussen de huidige ruimtes.  
Wanneer u op het **oog-icoon** aan de rechterkant klikt (gemarkeerde status), kunt u de gegevens van meerdere ruimtes tegelijkertijd bekijken.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gegevensbeheer in multi-ruimte

Zodra de plugin is ingeschakeld, configureert het systeem automatisch een **Ruimte-veld** bij het aanmaken van een collectie.  
**Alleen collecties die dit veld bevatten, worden opgenomen in de logica van het ruimtebeheer.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Voor bestaande collecties kunt u handmatig een ruimte-veld toevoegen om ruimtebeheer in te schakelen:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standaardlogica

In collecties die een ruimte-veld bevatten, past het systeem automatisch de volgende logica toe:

1. Bij het aanmaken van gegevens worden deze automatisch gekoppeld aan de momenteel geselecteerde ruimte;
2. Bij het filteren van gegevens worden deze automatisch beperkt tot de gegevens van de momenteel geselecteerde ruimte.


### Oude gegevens indelen in ruimtes

Voor gegevens die al bestonden voordat de multi-ruimte plugin werd ingeschakeld, kunt u de volgende stappen volgen om ze in ruimtes in te delen:

#### 1. Ruimte-veld toevoegen

Voeg handmatig een ruimte-veld toe aan de oude collectie:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Gebruikers toewijzen aan de niet-toegewezen ruimte

Koppel de gebruikers die de oude gegevens beheren aan alle ruimtes, inclusief de **Niet-toegewezen ruimte (Unassigned Space)**, om gegevens te kunnen zien die nog niet aan een ruimte zijn toegewezen:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Wisselen naar weergave van alle ruimtegegevens

Selecteer bovenaan de optie om gegevens van alle ruimtes te bekijken:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Pagina voor toewijzing van oude gegevens configureren

Maak een nieuwe pagina aan voor de toewijzing van oude gegevens. Toon het "Ruimte-veld" in zowel de **Lijst-pagina** als de **Bewerkingspagina** om de ruimtetoewijzing handmatig aan te passen.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Stel het ruimte-veld in op bewerkbare modus:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Handmatig gegevensruimtes toewijzen

Gebruik de bovengenoemde pagina om gegevens handmatig te bewerken en zo stap voor stap de juiste ruimte toe te wijzen aan oude gegevens (u kunt eventueel ook bulkbewerking configureren).