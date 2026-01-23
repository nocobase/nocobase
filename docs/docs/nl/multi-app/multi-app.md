---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Multi-app


## Introductie

De **Multi-app plugin** stelt u in staat om dynamisch meerdere onafhankelijke applicaties te creëren en te beheren, zonder dat u deze afzonderlijk hoeft te implementeren. Elke sub-app is een volledig onafhankelijke instantie met een eigen database, plugins en configuratie.

#### Gebruiksscenario's
- **Multi-tenancy**: Biedt onafhankelijke applicatie-instanties, waarbij elke klant beschikt over eigen gegevens, plugin-configuraties en een eigen rechtenstructuur.
- **Hoofd- en subsystemen voor verschillende bedrijfsdomeinen**: Een groot systeem dat bestaat uit meerdere afzonderlijk geïmplementeerde kleinere applicaties.


:::warning
De Multi-app plugin zelf biedt geen functionaliteit voor het delen van gebruikers.
Als u gebruikers tussen meerdere apps wilt koppelen, kunt u dit combineren met de **[Authenticatie plugin](/auth-verification)**.
:::


## Installatie

Ga in het pluginbeheer naar de **Multi-app plugin** en schakel deze in.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Gebruikershandleiding


### Een sub-app aanmaken

Klik in het menu Systeeminstellingen op ‘Multi-app’ om de Multi-app beheerpagina te openen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klik op de knop ‘Nieuw toevoegen’ om een nieuwe sub-app aan te maken:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Beschrijving van de formuliervelden

*   **Naam**: De identificatie van de sub-app, globaal uniek.
*   **Weergavenaam**: De naam van de sub-app zoals deze in de interface wordt weergegeven.
*   **Opstartmodus**:
    *   **Start bij eerste bezoek**: De sub-app start alleen wanneer een gebruiker deze voor het eerst via een URL bezoekt;
    *   **Start met hoofd-app**: De sub-app start tegelijkertijd met de hoofd-app (dit zal de opstarttijd van de hoofd-app verlengen).
*   **Poort**: Het poortnummer dat de sub-app gebruikt tijdens runtime.
*   **Aangepast domein**: Configureer een onafhankelijk subdomein voor de sub-app.
*   **Vastmaken aan menu**: Maak de ingang van de sub-app vast aan de linkerkant van de bovenste navigatiebalk.
*   **Databaseverbinding**: Wordt gebruikt om de gegevensbron voor de sub-app te configureren, met ondersteuning voor de volgende drie methoden:
    *   **Nieuwe database**: Hergebruik de huidige gegevensservice om een onafhankelijke database aan te maken;
    *   **Nieuwe gegevensverbinding**: Configureer een volledig nieuwe databaseservice;
    *   **Schema-modus**: Maak een onafhankelijk schema voor de sub-app aan in PostgreSQL.
*   **Upgraden**: Als de verbonden database een oudere versie van de NocoBase-gegevensstructuur bevat, wordt deze automatisch geüpgraded naar de huidige versie.


### Een sub-app starten en stoppen

Klik op de knop **Starten** om de sub-app te starten;
> Als *“Start bij eerste bezoek”* was aangevinkt tijdens het aanmaken, zal de sub-app automatisch starten bij het eerste bezoek.

Klik op de knop **Bekijken** om de sub-app in een nieuw tabblad te openen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Sub-app status en logs

In de lijst kunt u het geheugen- en CPU-gebruik van elke applicatie bekijken.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klik op de knop **Logs** om de runtime logs van de sub-app te bekijken.
> Als de sub-app na het starten niet toegankelijk is (bijv. door een beschadigde database), kunt u de logs gebruiken voor probleemoplossing.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Een sub-app verwijderen

Klik op de knop **Verwijderen** om de sub-app te verwijderen.
> Bij het verwijderen kunt u kiezen of u de database ook wilt verwijderen. Ga voorzichtig te werk, want deze actie is onomkeerbaar.


### Een sub-app openen
Standaard opent u sub-apps via `/_app/:appName/admin/`, bijvoorbeeld:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
U kunt ook een onafhankelijk subdomein voor de sub-app configureren. U moet het domein naar het huidige IP-adres laten verwijzen, en als u Nginx gebruikt, moet u het domein ook toevoegen aan de Nginx-configuratie.


### Sub-apps beheren via de commandoregel

In de hoofdmap van het project kunt u via de commandoregel **PM2** gebruiken om sub-app-instanties te beheren:

```bash
yarn nocobase pm2 list              # Toont de lijst met momenteel actieve instanties
yarn nocobase pm2 stop [appname]    # Stopt een specifiek sub-app proces
yarn nocobase pm2 delete [appname]  # Verwijdert een specifiek sub-app proces
yarn nocobase pm2 kill              # Forceert het beëindigen van alle gestarte processen (kan ook instanties van de hoofd-app omvatten)
```

### Gegevensmigratie van oude Multi-app

Ga naar de oude Multi-app beheerpagina en klik op de knop **Gegevens migreren naar nieuwe Multi-app** om de gegevensmigratie uit te voeren.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Veelgestelde vragen

#### 1. Pluginbeheer
Sub-apps kunnen dezelfde plugins gebruiken als de hoofd-app (inclusief versies), maar ze kunnen plugins onafhankelijk configureren en gebruiken.

#### 2. Database-isolatie
Sub-apps kunnen worden geconfigureerd met onafhankelijke databases. Als u gegevens tussen apps wilt delen, kan dit via externe gegevensbronnen worden gerealiseerd.

#### 3. Gegevensback-up en -migratie
Momenteel ondersteunt gegevensback-up in de hoofd-app geen gegevens van sub-apps (alleen basisinformatie van de sub-app). U moet handmatig een back-up maken en gegevens migreren binnen elke sub-app.

#### 4. Implementatie en updates
De versie van een sub-app wordt automatisch geüpgraded samen met de hoofd-app, wat zorgt voor versieconsistentie tussen de hoofd- en sub-apps.

#### 5. Resourcebeheer
Het resourceverbruik van elke sub-app is in principe hetzelfde als dat van de hoofd-app. Momenteel verbruikt één applicatie ongeveer 500-600MB geheugen.