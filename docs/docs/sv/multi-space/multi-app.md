---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/multi-space/multi-app).
:::

# Multi-app

## Introduktion

**Pluginet Multi-app** gör det möjligt att dynamiskt skapa och hantera flera oberoende applikationer utan separata driftsättningar. Varje underapplikation är en helt oberoende instans med sin egen databas, sina egna plugin och konfigurationer.

#### Tillämpningsområden
- **Flerhyresgäststöd (Multi-tenancy)**: Tillhandahåller oberoende applikationsinstanser där varje kund har sina egna data, pluginkonfigurationer och behörighetssystem.
- **Huvud- och undersystem för olika affärsområden**: Ett stort system som består av flera oberoende driftsatta mindre applikationer.

:::warning
Pluginet Multi-app erbjuder i sig inte möjligheten att dela användare.  
För att möjliggöra användarintegration mellan flera applikationer kan det användas tillsammans med **[Autentiseringspluginet](/auth-verification)**.
:::

## Installation

Hitta pluginet **Multi-app** i plugin-hanteraren och aktivera det.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Användarmanual

### Skapa en underapplikation

Klicka på ”Multi-app” i systeminställningsmenyn för att öppna hanteringssidan för multi-app:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klicka på knappen ”Lägg till ny” för att skapa en ny underapplikation:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Beskrivning av formulärfält

* **Namn**: Identifierare för underapplikationen, globalt unik.
* **Visningsnamn**: Namnet på underapplikationen som visas i gränssnittet.
* **Startläge**:
  * **Starta vid första åtkomst**: Underapplikationen startar först när en användare besöker den via en URL för första gången.
  * **Starta med huvudapplikationen**: Underapplikationen startar samtidigt som huvudapplikationen (detta ökar starttiden för huvudapplikationen).
* **Port**: Portnumret som används av underapplikationen under körning.
* **Anpassad domän**: Konfigurera en oberoende underdomän för underapplikationen.
* **Fäst i menyn**: Fäster ingången till underapplikationen på vänster sida av den övre navigeringsmenyn.
* **Databanslutning**: Används för att konfigurera underapplikationens datakälla, med stöd för tre metoder:
  * **Ny databas**: Återanvänder den nuvarande databastjänsten för att skapa en oberoende databas.
  * **Ny dataanslutning**: Konfigurerar en helt ny databastjänst.
  * **Schema-läge**: Skapar ett oberoende schema för underapplikationen i PostgreSQL.
* **Uppgradera**: Om den anslutna databasen innehåller en äldre version av NocoBase-datastrukturen kommer den automatiskt att uppgraderas till den aktuella versionen.

### Starta och stoppa underapplikationer

Klicka på knappen **Starta** för att starta en underapplikation.  
> Om ”Starta vid första åtkomst” valdes vid skapandet, kommer den att starta automatiskt vid det första besöket.  

Klicka på knappen **Visa** för att öppna underapplikationen i en ny flik.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Status och loggar för underapplikationer

Ni kan se minnes- och CPU-användning för varje applikation i listan.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klicka på knappen **Loggar** för att se underapplikationens körningsloggar.  
> Om en underapplikation inte går att nå efter start (t.ex. på grund av en skadad databas), kan ni felsöka med hjälp av loggarna.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Ta bort en underapplikation

Klicka på knappen **Ta bort** för att ta bort en underapplikation.  
> Vid borttagning kan ni välja om även databasen ska raderas. Var försiktig, eftersom denna åtgärd inte kan ångras.

### Åtkomst till underapplikationer
Som standard används `/_app/:appName/admin/` för att komma åt underapplikationer, till exempel:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Ni kan även konfigurera oberoende underdomäner för underapplikationer. Ni behöver peka domänen till den aktuella IP-adressen. Om ni använder Nginx måste domänen även läggas till i Nginx-konfigurationen.

### Hantera underapplikationer via CLI

I projektets rotkatalog kan ni använda kommandoraden för att hantera underapplikationsinstanser via **PM2**:

```bash
yarn nocobase pm2 list              # Visa listan över instanser som körs för tillfället
yarn nocobase pm2 stop [appname]    # Stoppa en specifik underapplikationsprocess
yarn nocobase pm2 delete [appname]  # Ta bort en specifik underapplikationsprocess
yarn nocobase pm2 kill              # Tvinga avslut av alla startade processer (kan inkludera huvudapplikationens instans)
```

### Datamigrering från äldre Multi-app

Gå till den gamla hanteringssidan för multi-app och klicka på knappen **Migrera data till ny Multi-app** för att utföra migreringen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Vanliga frågor

#### 1. Plugin-hantering
Underapplikationer kan använda samma plugin som huvudapplikationen (inklusive versioner), men plugin kan konfigureras och användas oberoende.

#### 2. Databasisolering
Underapplikationer kan konfigureras med oberoende databaser. Om ni vill dela data mellan applikationer kan detta uppnås via externa datakällor.

#### 3. Säkerhetskopiering och migrering av data
För närvarande inkluderar säkerhetskopiering av data på huvudapplikationen inte data från underapplikationer (den innehåller endast grundläggande information om underapplikationen). Säkerhetskopiering och migrering måste utföras manuellt i varje underapplikation.

#### 4. Driftsättning och uppdateringar
Underapplikationernas versioner kommer automatiskt att följa huvudapplikationens uppgraderingar, vilket säkerställer versionskonsistens mellan huvud- och underapplikationer.

#### 5. Resurshantering
Resursförbrukningen för varje underapplikation är i princip densamma som för huvudapplikationen. För närvarande ligger minnesanvändningen för en enskild applikation på cirka 500–600 MB.