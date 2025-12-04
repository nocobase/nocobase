---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# Variabler och hemligheter

## Introduktion

Centraliserad konfiguration och hantering av miljövariabler och hemligheter för att lagra känslig data, återanvända konfigurationsdata och isolera miljökonfigurationer.

## Skillnader från `.env`

| **Funktion**                      | **`.env`-filen**                                                               | **Dynamiskt konfigurerade variabler och hemligheter**                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Lagringsplats**                 | Lagras i `.env`-filen i projektets rotkatalog.                                 | Lagras i databasens tabell `environmentVariables`.                                                                                                           |
| **Laddningsmetod**                | Laddas in i `process.env` med verktyg som `dotenv` vid applikationsstart.      | Läses dynamiskt och laddas in i `app.environment` vid applikationsstart.                                                                                     |
| **Ändringsmetod**                 | Kräver direkt filredigering, och applikationen måste startas om för att ändringar ska träda i kraft. | Stöder modifiering under körning; ändringar träder i kraft direkt efter att applikationskonfigurationen laddats om.                                        |
| **Miljöisolering**                | Varje miljö (utveckling, test, produktion) kräver separat underhåll av `.env`-filer. | Varje miljö (utveckling, test, produktion) kräver separat underhåll av data i tabellen `environmentVariables`.                                               |
| **Tillämpliga scenarier**         | Lämplig för fasta statiska konfigurationer, som huvuddatabasinformation för applikationen. | Lämplig för dynamiska konfigurationer som kräver frekventa justeringar eller är kopplade till affärslogik, såsom externa databaser, information om fillagring, etc. |

## Installation

Inbyggd plugin, ingen separat installation krävs.

## Användning

### Återanvändning av konfigurationsdata

Om till exempel flera platser i ett arbetsflöde behöver e-postnoder och SMTP-konfiguration, kan den gemensamma SMTP-konfigurationen lagras i miljövariabler.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Lagring av känslig data

Lagring av konfigurationsinformation för olika externa databaser, nycklar för molnfillagring och liknande data.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolering av miljökonfigurationer

I olika miljöer som utveckling, test och produktion används oberoende konfigurationshanteringsstrategier för att säkerställa att konfigurationerna och datan i varje miljö inte stör varandra. Varje miljö har sina egna oberoende inställningar, variabler och resurser, vilket undviker konflikter mellan utvecklings-, test- och produktionsmiljöer och säkerställer att systemet fungerar som förväntat i varje miljö.

Till exempel kan konfigurationen för fillagringstjänster skilja sig mellan utvecklings- och produktionsmiljöer, som visas nedan:

Utvecklingsmiljö

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Produktionsmiljö

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Hantering av miljövariabler

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Lägga till miljövariabler

- Stöder enskild och massvis tillägg.
- Stöder klartext och krypterad lagring.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Enskilt tillägg

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Massvis tillägg

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Att tänka på

### Starta om applikationen

Efter att du har ändrat eller tagit bort miljövariabler visas en uppmaning om att starta om applikationen högst upp. Ändringar av miljövariabler träder i kraft först efter att applikationen har startats om.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Krypterad lagring

Krypterad data för miljövariabler använder AES symmetrisk kryptering. Den privata nyckeln (PRIVATE KEY) för kryptering och dekryptering lagras i lagringskatalogen. Var vänlig och förvara den säkert; om den förloras eller skrivs över kommer den krypterade datan inte att kunna dekrypteras.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugins som för närvarande stöder miljövariabler

### Åtgärd: Anpassad förfrågan

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autentisering: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autentisering: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autentisering: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autentisering: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autentisering: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autentisering: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Datakälla: Extern MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Datakälla: Extern MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Datakälla: Extern Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Datakälla: Extern PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Datakälla: Extern SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Datakälla: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Datakälla: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Fillagring: Lokal

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Fillagring: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Fillagring: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Fillagring: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Fillagring: S3 Pro

Ej anpassad

### Karta: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Karta: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### E-postinställningar

Ej anpassad

### Meddelande: E-post

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Offentliga formulär

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Systeminställningar

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verifiering: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verifiering: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Arbetsflöde

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)