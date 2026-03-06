---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/multi-space/multi-app) voor nauwkeurige informatie.
:::

# Multi-app


## Introductie

De **Multi-app plugin** maakt het mogelijk om dynamisch meerdere onafhankelijke applicaties te creëren en te beheren zonder afzonderlijke implementaties. Elke sub-app is een volledig onafhankelijke instantie met een eigen database, plugins en configuraties.

#### Toepassingsscenario's
- **Multi-tenancy**: Biedt onafhankelijke applicatie-instanties waarbij elke klant zijn eigen gegevens, plugin-configuraties en rechtensysteem heeft.
- **Hoofd- en subsystemen voor verschillende bedrijfsdomeinen**: Een groot systeem dat bestaat uit verschillende onafhankelijk geïmplementeerde kleine applicaties.


:::warning
De Multi-app plugin biedt zelf geen mogelijkheden voor het delen van gebruikers.  
Gebruik dit in combinatie met de **[Authenticatie-plugin](/auth-verification)** om gebruikersintegratie tussen meerdere applicaties mogelijk te maken.
:::


## Installatie

Zoek de **Multi-app** plugin in de plugin-manager en schakel deze in.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Gebruikershandleiding


### Een sub-app maken

Klik op "Multi-app" in het menu met systeeminstellingen om de beheerpagina voor multi-apps te openen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klik op de knop "Nieuwe toevoegen" om een nieuwe sub-app te maken:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Toelichting op de formuliervelden

* **Naam**: Sub-app-identificatie, wereldwijd uniek.
* **Weergavenaam**: De naam van de sub-app zoals deze in de interface wordt weergegeven.
* **Opstartmodus**:
  * **Starten bij eerste toegang**: De sub-app start pas wanneer een gebruiker deze voor het eerst via een URL bezoekt.
  * **Samen met de hoofdapplicatie starten**: De sub-app start tegelijkertijd met de hoofdapplicatie (dit verlengt de opstarttijd van de hoofdapplicatie).
* **Poort**: Het poortnummer dat de sub-app gebruikt tijdens runtime.
* **Aangepast domein**: Configureer een onafhankelijk subdomein voor de sub-app.
* **Vastzetten aan menu**: Zet de toegang tot de sub-app vast aan de linkerkant van de bovenste navigatiebalk.
* **Databaseverbinding**: Wordt gebruikt om de gegevensbron voor de sub-app te configureren, met ondersteuning voor drie methoden:
  * **Nieuwe database**: Hergebruikt de huidige databaseservice om een onafhankelijke database te maken.
  * **Nieuwe gegevensverbinding**: Configureert een volledig nieuwe databaseservice.
  * **Schema-modus**: Maakt een onafhankelijk schema voor de sub-app in PostgreSQL.
* **Upgrade**: Als de verbonden database een oudere versie van de NocoBase-datastructuur bevat, wordt deze automatisch bijgewerkt naar de huidige versie.


### Sub-apps starten en stoppen

Klik op de knop **Starten** om een sub-app te starten.  
> Als "Starten bij eerste toegang" was aangevinkt tijdens het maken, start deze automatisch bij het eerste bezoek.  

Klik op de knop **Bekijken** om de sub-app in een nieuw tabblad te openen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Status en logs van sub-apps

U kunt het geheugen- en CPU-gebruik van elke applicatie in de lijst bekijken.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klik op de knop **Logs** om de runtime-logs van de sub-app te bekijken.  
> Als een sub-app na het opstarten niet toegankelijk is (bijv. door databasecorruptie), kunt u de logs gebruiken voor probleemoplossing.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Een sub-app verwijderen

Klik op de knop **Verwijderen** om een sub-app te verwijderen.  
> Bij het verwijderen kunt u kiezen of u ook de database wilt verwijderen. Ga voorzichtig te werk, aangezien deze actie onomkeerbaar is.


### Toegang tot sub-apps
Gebruik standaard `/_app/:appName/admin/` om toegang te krijgen tot sub-apps, bijvoorbeeld:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Daarnaast kunt u onafhankelijke subdomeinen configureren voor sub-apps. U moet het domein verwijzen naar het huidige IP-adres. Als u Nginx gebruikt, moet het domein ook worden toegevoegd aan de Nginx-configuratie.


### Sub-apps beheren via de CLI

In de hoofdmap van het project kunt u de opdrachtregel gebruiken om sub-app-instanties te beheren via **PM2**:

```bash
yarn nocobase pm2 list              # Bekijk de lijst met momenteel actieve instanties
yarn nocobase pm2 stop [appname]    # Stop een specifiek sub-app-proces
yarn nocobase pm2 delete [appname]  # Verwijder een specifiek sub-app-proces
yarn nocobase pm2 kill              # Beëindig geforceerd alle gestarte processen (kan ook de instantie van de hoofdapplicatie bevatten)
```

### Gegevensmigratie van oude Multi-app

Ga naar de oude beheerpagina voor multi-apps en klik op de knop **Gegevens migreren naar nieuwe Multi-app** om de migratie uit te voeren.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Veelgestelde vragen

#### 1. Plugin-beheer
Sub-apps kunnen dezelfde plugins gebruiken als de hoofdapplicatie (inclusief versies), maar plugins kunnen onafhankelijk worden geconfigureerd en gebruikt.

#### 2. Database-isolatie
Sub-apps kunnen worden geconfigureerd met onafhankelijke databases. Als u gegevens tussen applicaties wilt delen, kan dit worden bereikt via externe gegevensbronnen.

#### 3. Gegevensback-up en migratie
Momenteel bevat de gegevensback-up van de hoofdapplicatie geen gegevens van sub-apps (het bevat alleen basisinformatie over de sub-app). Back-ups en migraties moeten handmatig binnen elke sub-app worden uitgevoerd.

#### 4. Implementatie en updates
Sub-app-versies volgen automatisch de upgrades van de hoofdapplicatie, waardoor versieconsistentie tussen de hoofd- en sub-apps wordt gegarandeerd.

#### 5. Resourcebeheer
Het verbruik van resources van elke sub-app is in principe hetzelfde als dat van de hoofdapplicatie. Momenteel bedraagt het geheugengebruik van een enkele applicatie ongeveer 500-600 MB.