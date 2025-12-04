---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multi-ruimte

## Introductie

De **Multi-ruimte plugin** maakt het mogelijk om binnen één applicatie-instantie meerdere onafhankelijke gegevensruimtes te creëren door middel van logische isolatie.

#### Gebruiksscenario's
- **Meerdere winkels of fabrieken**: Bedrijfsprocessen en systeemconfiguraties zijn zeer consistent, zoals een uniform voorraadbeheer, productieplanning, verkoopstrategieën en rapportagesjablonen, maar het is essentieel om ervoor te zorgen dat de gegevens van elke bedrijfseenheid elkaar niet beïnvloeden.
- **Beheer van meerdere organisaties of dochterondernemingen**: Verschillende organisaties of dochterondernemingen binnen een groep delen hetzelfde platform, maar elk merk heeft onafhankelijke klant-, product- en ordergegevens.

## Installatie

Zoek in het pluginbeheer de **Multi-ruimte plugin** en schakel deze in.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Gebruikershandleiding

### Multi-ruimte Beheer

Nadat u de plugin heeft ingeschakeld, gaat u naar de instellingenpagina **"Gebruikers & Rechten"** en schakelt u over naar het paneel **Ruimtes** om ruimtes te beheren.

> In de beginstatus is er een ingebouwde **Niet-toegewezen Ruimte** aanwezig. Deze wordt voornamelijk gebruikt om oude gegevens te bekijken die nog niet aan een ruimte zijn gekoppeld.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Een ruimte aanmaken

Klik op de knop "Ruimte toevoegen" om een nieuwe ruimte aan te maken:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Gebruikers toewijzen

Nadat u een aangemaakte ruimte heeft geselecteerd, kunt u aan de rechterkant de gebruikers instellen die tot die ruimte behoren:

> **Tip:** Nadat u gebruikers aan een ruimte heeft toegewezen, moet u de **pagina handmatig vernieuwen** zodat de ruimtewissellijst in de rechterbovenhoek de meest recente ruimte weergeeft.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Multi-ruimte wisselen en bekijken

In de rechterbovenhoek kunt u de huidige ruimte wisselen.
Wanneer u op het **oogpictogram** aan de rechterkant klikt (in de gemarkeerde staat), kunt u tegelijkertijd gegevens van meerdere ruimtes bekijken.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Multi-ruimte Gegevensbeheer

Nadat u de plugin heeft ingeschakeld, voegt het systeem automatisch een **Ruimteveld** toe wanneer u een collectie aanmaakt.
**Alleen collecties die dit veld bevatten, worden opgenomen in de logica voor ruimtetoewijzing.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Voor bestaande collecties kunt u handmatig een Ruimteveld toevoegen om ruimtetoewijzing in te schakelen:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Standaardlogica

In collecties die het Ruimteveld bevatten, past het systeem automatisch de volgende logica toe:

1. Bij het aanmaken van gegevens wordt deze automatisch gekoppeld aan de momenteel geselecteerde ruimte;
2. Bij het filteren van gegevens wordt deze automatisch beperkt tot de gegevens van de momenteel geselecteerde ruimte.

### Oude gegevens classificeren in multi-ruimte

Voor gegevens die bestonden voordat de Multi-ruimte plugin werd ingeschakeld, kunt u deze als volgt classificeren in ruimtes:

#### 1. Ruimteveld toevoegen

Voeg handmatig het Ruimteveld toe aan de oude collectie:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Gebruikers toewijzen aan de Niet-toegewezen Ruimte

Koppel de gebruiker die de oude gegevens beheert aan alle ruimtes, inclusief de **Niet-toegewezen Ruimte**, om gegevens te bekijken die nog niet aan een ruimte zijn toegewezen:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Wisselen om alle ruimtegegevens te bekijken

Selecteer bovenaan om gegevens van alle ruimtes te bekijken:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Pagina voor toewijzing van oude gegevens configureren

Maak een nieuwe pagina aan voor de toewijzing van oude gegevens. Toon het "Ruimteveld" op de **lijstpagina** en **bewerkpagina** om de ruimtetoewijzing handmatig aan te passen.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Maak het Ruimteveld bewerkbaar

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Gegevensruimte handmatig toewijzen

Via de hierboven aangemaakte pagina kunt u de gegevens handmatig bewerken om geleidelijk de juiste ruimte toe te wijzen aan de oude gegevens (u kunt ook zelf bulkbewerking configureren).