---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Multi-app


## Introduktion

**Multi-app-pluginet** låter dig dynamiskt skapa och hantera flera oberoende applikationer utan att behöva separata driftsättningar. Varje underapp är en helt oberoende instans med sin egen databas, sina egna plugin och sin egen konfiguration.

#### Användningsområden
- **Multitenancy**: Tillhandahåll oberoende applikationsinstanser, där varje kund har sin egen data, sina egna plugin-konfigurationer och sitt eget behörighetssystem.
- **Huvud- och delsystem för olika affärsområden**: Ett stort system som består av flera oberoende driftsatta mindre applikationer.


:::warning
Multi-app-pluginet i sig självt erbjuder ingen funktionalitet för att dela användare.
Om ni behöver dela användare mellan flera appar kan ni använda det i kombination med **[Autentiseringspluginet](/auth-verification)**.
:::


## Installation

I plugin-hanteraren hittar ni **Multi-app**-pluginet och aktiverar det.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Användarhandbok


### Skapa en underapp

I systeminställningsmenyn klickar ni på ”Multi-app” för att komma till sidan för Multi-app-hantering:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klicka på knappen ”Lägg till ny” för att skapa en ny underapp:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Beskrivning av formulärfält

*   **Namn**: Underappens identifierare, globalt unik.
*   **Visningsnamn**: Namnet på underappen som visas i gränssnittet.
*   **Startläge**:
    *   **Starta vid första besöket**: Underappen startar endast när en användare besöker den via URL för första gången.
    *   **Starta med huvudappen**: Underappen startar samtidigt som huvudappen (detta kommer att öka huvudappens starttid).
*   **Port**: Portnumret som används av underappen vid körning.
*   **Anpassad domän**: Konfigurera en oberoende subdomän för underappen.
*   **Fäst i menyn**: Fäst underappens ingång på vänster sida av den övre navigeringsfältet.
*   **Databasanslutning**: Används för att konfigurera underappens datakälla, med stöd för följande tre metoder:
    *   **Ny databas**: Återanvänd den aktuella datatjänsten för att skapa en oberoende databas.
    *   **Ny databasanslutning**: Konfigurera en helt ny databastjänst.
    *   **Schemaläge**: Skapa ett oberoende schema för underappen i PostgreSQL.
*   **Uppgradera**: Om den anslutna databasen innehåller en äldre version av NocoBase-datastrukturen kommer den automatiskt att uppgraderas till den aktuella versionen.


### Starta och stoppa en underapp

Klicka på knappen **Starta** för att starta underappen;
> Om ”Starta vid första besöket” markerades vid skapandet, kommer den att starta automatiskt vid första besöket.

Klicka på knappen **Visa** för att öppna underappen i en ny flik.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Underappens status och loggar

I listan kan ni se varje applikations minnes- och CPU-användning.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klicka på knappen **Loggar** för att se underappens körloggar.
> Om underappen är otillgänglig efter start (t.ex. på grund av en korrupt databas), kan ni använda loggarna för felsökning.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Ta bort en underapp

Klicka på knappen **Ta bort** för att ta bort underappen.
> Vid borttagning kan ni välja om databasen också ska tas bort. Var försiktig, då denna åtgärd inte kan ångras.


### Åtkomst till en underapp
Som standard nås underappar via `/_app/:appName/admin/`, till exempel:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Ni kan också konfigurera en oberoende subdomän för underappen. Ni måste då peka domänen till den aktuella IP-adressen, och om ni använder Nginx behöver ni även lägga till domänen i Nginx-konfigurationen.


### Hantera underappar via kommandoraden

I projektets rotkatalog kan ni använda kommandoraden för att hantera underappsinstanser via **PM2**:

```bash
yarn nocobase pm2 list              # Visa lista över aktuella körande instanser
yarn nocobase pm2 stop [appname]    # Stoppa en specifik underappsprocess
yarn nocobase pm2 delete [appname]  # Ta bort en specifik underappsprocess
yarn nocobase pm2 kill              # Tvångsavsluta alla startade processer (kan inkludera huvudappens instans)
```

### Migrera data från gammal Multi-app

Gå till den gamla Multi-app-hanteringssidan och klicka på knappen **Migrera data till ny Multi-app** för att migrera data.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Vanliga frågor

#### 1. Plugin-hantering
Underappar kan använda samma plugin som huvudappen (inklusive versioner), men de kan konfigureras och användas oberoende.

#### 2. Databasisolering
Underappar kan konfigureras med oberoende databaser. Om ni vill dela data mellan appar kan detta uppnås via externa datakällor.

#### 3. Databackup och migrering
För närvarande stöder databackuper i huvudappen inte att inkludera underappens data (endast grundläggande information om underappen). Ni måste manuellt säkerhetskopiera och migrera data inom varje underapp.

#### 4. Driftsättning och uppdateringar
Versionen av en underapp kommer automatiskt att uppgraderas tillsammans med huvudappen, vilket säkerställer versionskonsistens mellan huvud- och underapparna.

#### 5. Resurshantering
Resursförbrukningen för varje underapp är i princip densamma som för huvudappen. För närvarande använder en enskild applikation cirka 500-600 MB minne.