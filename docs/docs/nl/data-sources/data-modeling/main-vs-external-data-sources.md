:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Hoofd- versus externe databases

De verschillen tussen hoofd- en externe databases in NocoBase komen voornamelijk tot uiting in vier aspecten: ondersteuning voor databasetypen, ondersteuning voor collectietypen, ondersteuning voor veldtypen en mogelijkheden voor back-up en migratie.

## 1. Ondersteuning voor databasetypen

Voor meer details, zie: [Gegevensbronbeheer](https://docs.nocobase.com/data-sources/data-source-manager)

### Databasetypen

| Databasetype | Ondersteuning hoofddatabase | Ondersteuning externe database |
|---|---|---|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Collectiebeheer

| Collectiebeheer | Ondersteuning hoofddatabase | Ondersteuning externe database |
|---|---|---|
| Basisbeheer | ✅ | ✅ |
| Visueel beheer | ✅ | ❌ |

## 2. Ondersteuning voor collectietypen

Voor meer details, zie: [Collecties](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Collectietype | Hoofddatabase | Externe database | Beschrijving |
|---|---|---|---|
| Algemeen | ✅ | ✅ | Basiscollectie |
| Weergave | ✅ | ✅ | Gegevensbronweergave |
| Overerving | ✅ | ❌ | Ondersteunt overerving van datamodellen, alleen hoofddatabase |
| Bestand | ✅ | ❌ | Ondersteunt bestandsuploads, alleen hoofddatabase |
| Opmerking | ✅ | ❌ | Ingebouwd opmerkingensysteem, alleen hoofddatabase |
| Kalender | ✅ | ❌ | Collectie voor kalenderweergaven |
| Expressie | ✅ | ❌ | Ondersteunt formuleberekeningen |
| Boom | ✅ | ❌ | Voor datamodellering met boomstructuur |
| SQL | ✅ | ❌ | Collectie gedefinieerd via SQL |
| Externe verbinding | ✅ | ❌ | Verbindingscollectie voor externe gegevensbronnen, beperkte functionaliteit |

## 3. Ondersteuning voor veldtypen

Voor meer details, zie: [Collectievelden](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Basistypen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Enkele regel tekst | ✅ | ✅ |
| Meerdere regels tekst | ✅ | ✅ |
| Telefoonnummer | ✅ | ✅ |
| E-mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Heel getal | ✅ | ✅ |
| Getal | ✅ | ✅ |
| Percentage | ✅ | ✅ |
| Wachtwoord | ✅ | ✅ |
| Kleur | ✅ | ✅ |
| Icoon | ✅ | ✅ |

### Keuzetypen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Selectievakje | ✅ | ✅ |
| Keuzelijst (enkele selectie) | ✅ | ✅ |
| Keuzelijst (meerdere selecties) | ✅ | ✅ |
| Keuzerondje | ✅ | ✅ |
| Meerdere selectievakjes | ✅ | ✅ |
| Chinese regio | ✅ | ❌ |

### Mediatypen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Media | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Rich Text | ✅ | ✅ |
| Bijlage (relatie) | ✅ | ❌ |
| Bijlage (URL) | ✅ | ✅ |

### Datum- en tijdtypen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Datumtijd (met tijdzone) | ✅ | ✅ |
| Datumtijd (zonder tijdzone) | ✅ | ✅ |
| Unix timestamp | ✅ | ✅ |
| Datum (zonder tijd) | ✅ | ✅ |
| Tijd | ✅ | ✅ |

### Geometrische typen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Punt | ✅ | ✅ |
| Lijn | ✅ | ✅ |
| Cirkel | ✅ | ✅ |
| Veelhoek | ✅ | ✅ |

### Geavanceerde typen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sorteren | ✅ | ✅ |
| Formule | ✅ | ✅ |
| Automatische nummering | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Collectie-selector | ✅ | ❌ |
| Versleuteling | ✅ | ✅ |

### Systeeminformatievelden

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Aanmaakdatum | ✅ | ✅ |
| Laatst gewijzigd op | ✅ | ✅ |
| Aangemaakt door | ✅ | ❌ |
| Laatst gewijzigd door | ✅ | ❌ |
| Tabel OID | ✅ | ❌ |

### Relatietypen

| Veldtype | Hoofddatabase | Externe database |
|---|---|---|
| Eén-op-één | ✅ | ✅ |
| Eén-op-veel | ✅ | ✅ |
| Veel-op-één | ✅ | ✅ |
| Veel-op-veel | ✅ | ✅ |
| Veel-op-veel (array) | ✅ | ✅ |

:::info
Bijlagevelden zijn afhankelijk van bestandscollecties, die alleen worden ondersteund door hoofddatabases. Daarom ondersteunen externe databases momenteel geen bijlagevelden.
:::

## 4. Vergelijking van back-up- en migratieondersteuning

| Functie | Hoofddatabase | Externe database |
|---|---|---|
| Back-up en herstel | ✅ | ❌ (zelf te beheren) |
| Migratiebeheer | ✅ | ❌ (zelf te beheren) |

:::info
NocoBase biedt mogelijkheden voor back-up, herstel en structuurmigratie voor hoofddatabases. Voor externe databases moeten deze bewerkingen onafhankelijk door de gebruiker worden uitgevoerd, afhankelijk van hun eigen databaseomgeving. NocoBase biedt hiervoor geen ingebouwde ondersteuning.
:::

## Samenvattende vergelijking

| Vergelijkingsitem | Hoofddatabase | Externe database |
|---|---|---|
| Databasetypen | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Ondersteuning collectietypen | Alle collectietypen | Alleen algemene en weergavecollecties |
| Ondersteuning veldtypen | Alle veldtypen | Alle veldtypen behalve bijlagevelden |
| Back-up en migratie | Ingebouwde ondersteuning | Zelf te beheren |

## Aanbevelingen

- **Als u NocoBase gebruikt om een geheel nieuw bedrijfssysteem te bouwen**, gebruik dan de **hoofddatabase**. Hiermee kunt u de volledige functionaliteit van NocoBase benutten.
- **Als u NocoBase gebruikt om verbinding te maken met databases van andere systemen voor basis CRUD-bewerkingen** (creëren, lezen, bijwerken, verwijderen), gebruik dan **externe databases**.