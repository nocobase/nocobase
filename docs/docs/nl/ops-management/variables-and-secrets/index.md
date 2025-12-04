---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



pkg: "@nocobase/plugin-environment-variables"
---
# Variabelen en Geheimen

## Introductie

Centrale configuratie en beheer van omgevingsvariabelen en geheimen, te gebruiken voor het opslaan van gevoelige gegevens, hergebruik van configuratiegegevens en isolatie van omgevingsconfiguraties.

## Verschillen met `.env`

| **Functie** | **`.env` bestand** | **Dynamisch geconfigureerde variabelen en geheimen** |
| :---------- | :------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Opslaglocatie** | Opgeslagen in het `.env` bestand in de hoofdmap van het project | Opgeslagen in de `environmentVariables` tabel in de database |
| **Laadmethode** | Geladen in `process.env` met tools zoals `dotenv` tijdens het opstarten van de applicatie | Dynamisch gelezen en geladen in `app.environment` tijdens het opstarten van de applicatie |
| **Wijzigingsmethode** | Vereist directe bestandsbewerking; de applicatie moet opnieuw worden opgestart om wijzigingen toe te passen | Ondersteunt runtime-aanpassing; wijzigingen worden direct van kracht na het herladen van de applicatieconfiguratie |
| **Omgevingsisolatie** | Elke omgeving (ontwikkeling, testen, productie) vereist afzonderlijk onderhoud van `.env` bestanden | Elke omgeving (ontwikkeling, testen, productie) vereist afzonderlijk onderhoud van gegevens in de `environmentVariables` tabel |
| **Toepassingsscenario's** | Geschikt voor vaste statische configuraties, zoals hoofddatabase-informatie voor de applicatie | Geschikt voor dynamische configuraties die frequente aanpassingen vereisen of gekoppeld zijn aan bedrijfslogica, zoals externe databases, informatie over bestandsopslag, enz. |

## Installatie

Ingebouwde plugin, geen aparte installatie vereist.

## Gebruik

### Hergebruik van configuratiegegevens

Als bijvoorbeeld meerdere plaatsen in de workflow e-mailnodes en SMTP-configuratie vereisen, kunt u de algemene SMTP-configuratie opslaan in omgevingsvariabelen.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Opslag van gevoelige gegevens

Opslag van diverse externe databaseconfiguratie-informatie, sleutels voor cloudbestandsopslag, enz.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolatie van omgevingsconfiguratie

In verschillende omgevingen, zoals ontwikkeling, testen en productie, worden onafhankelijke configuratiebeheerstrategieën gebruikt om ervoor te zorgen dat de configuraties en gegevens van elke omgeving elkaar niet beïnvloeden. Elke omgeving heeft zijn eigen onafhankelijke instellingen, variabelen en bronnen, wat conflicten tussen ontwikkel-, test- en productieomgevingen voorkomt en ervoor zorgt dat het systeem in elke omgeving naar verwachting functioneert.

De configuratie voor bestandopslagdiensten kan bijvoorbeeld verschillen tussen ontwikkel- en productieomgevingen, zoals hieronder weergegeven:

Ontwikkelomgeving

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Productieomgeving

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Beheer van omgevingsvariabelen

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Omgevingsvariabelen toevoegen

- Ondersteunt enkelvoudige en batchmatige toevoeging
- Ondersteunt platte tekst en versleutelde opslag

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Enkelvoudige toevoeging

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Batchmatige toevoeging

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Aandachtspunten

### De applicatie opnieuw opstarten

Nadat u omgevingsvariabelen hebt gewijzigd of verwijderd, verschijnt bovenaan een melding om de applicatie opnieuw op te starten. Wijzigingen in omgevingsvariabelen worden pas van kracht nadat de applicatie opnieuw is opgestart.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Versleutelde opslag

Versleutelde gegevens voor omgevingsvariabelen maken gebruik van AES symmetrische versleuteling. De PRIVATE KEY voor versleuteling en ontsleuteling wordt opgeslagen in de opslagmap. Bewaar deze zorgvuldig; bij verlies of overschrijving kunnen de versleutelde gegevens niet worden ontsleuteld.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Momenteel ondersteunde plugins voor omgevingsvariabelen

### Action: Custom request

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Gegevensbron: Externe MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Gegevensbron: Externe MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Gegevensbron: Externe Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Gegevensbron: Externe PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Gegevensbron: Externe SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Gegevensbron: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Gegevensbron: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Bestandsopslag: Lokaal

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Bestandsopslag: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Bestandsopslag: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Bestandsopslag: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Bestandsopslag: S3 Pro

Niet aangepast

### Map: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Map: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### E-mailinstellingen

Niet aangepast

### Notification: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Public forms

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Systeeminstellingen

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verification: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verification: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Workflow

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)