---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Migratiebeheer

## Introductie

Met Migratiebeheer kunt u applicatieconfiguraties overzetten van de ene applicatieomgeving naar de andere. De focus van Migratiebeheer ligt op het migreren van 'applicatieconfiguraties'. Als u een volledige datamigratie nodig heeft, raden we u aan de '[Back-upbeheerder](../backup-manager/index.mdx)' te gebruiken voor het maken van back-ups en het herstellen van uw applicatie.

## Installatie

Migratiebeheer is afhankelijk van de [Back-upbeheerder](../backup-manager/index.mdx) plugin. Zorg ervoor dat deze plugin al is geïnstalleerd en geactiveerd.

## Proces en principes

Migratiebeheer zet tabellen en gegevens van de primaire database over naar een andere applicatie, gebaseerd op de ingestelde migratieregels. Houd er rekening mee dat gegevens van externe databases of sub-applicaties niet worden gemigreerd.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Migratieregels

### Ingebouwde regels

Migratiebeheer kan alle tabellen in de primaire database migreren en ondersteunt de volgende vijf ingebouwde regels:

- **Alleen structuur**: Migreert alleen de structuur (schema) van tabellen; er worden geen gegevens ingevoegd of bijgewerkt.
- **Overschrijven (leegmaken en opnieuw invoegen)**: Verwijdert alle bestaande records uit de doeltabel en voegt vervolgens de nieuwe gegevens in.
- **Invoegen of bijwerken (Upsert)**: Controleert of een record bestaat (op basis van de primaire sleutel). Als dit het geval is, wordt het record bijgewerkt; zo niet, dan wordt het ingevoegd.
- **Invoegen en duplicaten negeren**: Voegt nieuwe records in, maar als een record al bestaat (op basis van de primaire sleutel), wordt de invoeging genegeerd (er vinden geen updates plaats).
- **Overslaan**: Slaat de verwerking van de tabel volledig over (geen structuurwijzigingen, geen datamigratie).

**Aanvullende opmerkingen:**

- "Overschrijven", "Invoegen of bijwerken" en "Invoegen en duplicaten negeren" synchroniseren ook wijzigingen in de tabelstructuur.
- Als een tabel een auto-increment ID als primaire sleutel gebruikt, of als deze geen primaire sleutel heeft, kunnen de regels "Invoegen of bijwerken" en "Invoegen en duplicaten negeren" niet worden toegepast.
- "Invoegen of bijwerken" en "Invoegen en duplicaten negeren" zijn afhankelijk van de primaire sleutel om te bepalen of het record al bestaat.

### Gedetailleerd ontwerp

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Configuratie-interface

Migratieregels configureren

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Onafhankelijke regels inschakelen

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Selecteer onafhankelijke regels en de tabellen die door de huidige onafhankelijke regels moeten worden verwerkt

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Migratiebestanden

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Een nieuwe migratie aanmaken

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Een migratie uitvoeren

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Controle van omgevingsvariabelen van de applicatie (lees meer over [Omgevingsvariabelen](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Als er variabelen ontbreken, verschijnt er een pop-up waarin u wordt gevraagd de benodigde nieuwe omgevingsvariabelen in te voeren, waarna u kunt doorgaan.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Migratielogboeken

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Terugdraaien

Voordat een migratie wordt uitgevoerd, wordt de huidige applicatie automatisch geback-upt. Als de migratie mislukt of de resultaten niet aan de verwachtingen voldoen, kunt u deze terugdraaien met behulp van de [Back-upbeheerder](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)