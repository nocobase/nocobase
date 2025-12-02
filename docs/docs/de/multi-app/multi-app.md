---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Multi-App


## Einführung

Das **Multi-App Plugin** ermöglicht Ihnen, mehrere unabhängige Anwendungen dynamisch zu erstellen und zu verwalten, ohne separate Bereitstellungen. Jede Unter-App ist eine vollständig unabhängige Instanz mit eigener Datenbank, Plugins und Konfiguration.

#### Anwendungsfälle
- **Multi-Tenancy**: Bieten Sie unabhängige Anwendungsinstanzen an, bei denen jeder Kunde seine eigenen Daten, Plugin-Konfigurationen und sein eigenes Berechtigungssystem besitzt.
- **Haupt- und Subsysteme für verschiedene Geschäftsbereiche**: Ein großes System, das aus mehreren unabhängig bereitgestellten kleineren Anwendungen besteht.


:::warning
Das Multi-App Plugin selbst bietet keine Funktionen zur Benutzerfreigabe.
Wenn Sie Benutzer zwischen mehreren Apps teilen möchten, können Sie es in Verbindung mit dem **[Authentifizierungs-Plugin](/auth-verification)** verwenden.
:::


## Installation

Im Plugin-Manager suchen Sie das **Multi-App** Plugin und aktivieren Sie es.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Benutzerhandbuch


### Unter-App erstellen

Klicken Sie im Menü der Systemeinstellungen auf „Multi-App“, um die Multi-App Verwaltungsseite aufzurufen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klicken Sie auf die Schaltfläche „Hinzufügen“, um eine neue Unter-App zu erstellen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Beschreibung der Formularfelder

* **Name**: Bezeichner der Unter-App, global eindeutig.
* **Anzeigename**: Der Name der Unter-App, der in der Benutzeroberfläche angezeigt wird.
* **Startmodus**:
  * **Beim ersten Zugriff starten**: Die Unter-App startet nur, wenn ein Benutzer zum ersten Mal über eine URL darauf zugreift;
  * **Mit der Haupt-App starten**: Die Unter-App startet gleichzeitig mit der Haupt-App (dies erhöht die Startzeit der Haupt-App).
* **Port**: Die Portnummer, die von der Unter-App zur Laufzeit verwendet wird.
* **Benutzerdefinierte Domain**: Konfigurieren Sie eine unabhängige Subdomain für die Unter-App.
* **An Menü anheften**: Heftet den Eintrag der Unter-App an die linke Seite der oberen Navigationsleiste an.
* **Datenbankverbindung**: Wird zur Konfiguration der Datenquelle für die Unter-App verwendet, wobei die folgenden drei Methoden unterstützt werden:
  * **Neue Datenbank**: Verwendet den aktuellen Datendienst wieder, um eine unabhängige Datenbank zu erstellen;
  * **Neue Datenverbindung**: Konfiguriert einen komplett neuen Datenbankdienst;
  * **Schema-Modus**: Erstellt ein unabhängiges Schema für die Unter-App in PostgreSQL.
* **Upgrade**: Wenn die verbundene Datenbank eine ältere Version der NocoBase Datenstruktur enthält, wird sie automatisch auf die aktuelle Version aktualisiert.


### Unter-App starten und stoppen

Klicken Sie auf die Schaltfläche **Starten**, um die Unter-App zu starten;
> Wenn Sie bei der Erstellung *„Beim ersten Zugriff starten“* ausgewählt haben, wird sie beim ersten Zugriff automatisch gestartet.

Klicken Sie auf die Schaltfläche **Anzeigen**, um die Unter-App in einem neuen Tab zu öffnen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### Unter-App Status und Protokolle

In der Liste können Sie die Speicher- und CPU-Auslastung jeder Anwendung einsehen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klicken Sie auf die Schaltfläche **Protokolle**, um die Laufzeitprotokolle der Unter-App anzuzeigen.
> Sollte die Unter-App nach dem Start nicht zugänglich sein (z. B. aufgrund einer beschädigten Datenbank), können Sie die Protokolle zur Fehlerbehebung verwenden.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Unter-App löschen

Klicken Sie auf die Schaltfläche **Löschen**, um die Unter-App zu entfernen.
> Beim Löschen können Sie wählen, ob die Datenbank ebenfalls gelöscht werden soll. Bitte gehen Sie vorsichtig vor, da diese Aktion nicht rückgängig gemacht werden kann.


### Auf eine Unter-App zugreifen
Standardmäßig greifen Sie auf Unter-Apps über `/_app/:appName/admin/` zu, zum Beispiel:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Sie können auch eine unabhängige Subdomain für die Unter-App konfigurieren. Dazu müssen Sie die Domain auf die aktuelle IP-Adresse auflösen, und wenn Sie Nginx verwenden, müssen Sie die Domain auch in der Nginx-Konfiguration hinzufügen.


### Unter-Apps über die Kommandozeile verwalten

Im Stammverzeichnis des Projekts können Sie Unter-App-Instanzen über die Kommandozeile mit **PM2** verwalten:

```bash
yarn nocobase pm2 list              # Zeigt die Liste der aktuell laufenden Instanzen an
yarn nocobase pm2 stop [appname]    # Stoppt einen bestimmten Unter-App-Prozess
yarn nocobase pm2 delete [appname]  # Löscht einen bestimmten Unter-App-Prozess
yarn nocobase pm2 kill              # Beendet alle gestarteten Prozesse zwangsweise (kann auch Instanzen der Haupt-App enthalten)
```

### Datenmigration von alten Multi-Apps

Gehen Sie zur alten Multi-App Verwaltungsseite und klicken Sie auf die Schaltfläche **Daten zu neuer Multi-App migrieren**, um Daten zu migrieren.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Häufig gestellte Fragen (FAQ)

#### 1. Plugin-Verwaltung
Unter-Apps können dieselben Plugins wie die Haupt-App verwenden (einschließlich Versionen), aber sie können Plugins unabhängig konfigurieren und nutzen.

#### 2. Datenbankisolation
Unter-Apps können mit unabhängigen Datenbanken konfiguriert werden. Wenn Sie Daten zwischen Apps teilen möchten, können Sie dies über externe Datenquellen tun.

#### 3. Datensicherung und Migration
Derzeit unterstützen Datensicherungen in der Haupt-App keine Daten von Unter-Apps (nur grundlegende Informationen zu den Unter-Apps). Sie müssen Daten manuell innerhalb jeder Unter-App sichern und migrieren.

#### 4. Bereitstellung und Updates
Die Version einer Unter-App wird automatisch zusammen mit der Haupt-App aktualisiert, wodurch die Versionskonsistenz zwischen Haupt- und Unter-Apps gewährleistet ist.

#### 5. Ressourcenverwaltung
Der Ressourcenverbrauch jeder Unter-App ist im Wesentlichen derselbe wie der der Haupt-App. Derzeit benötigt eine einzelne Anwendung etwa 500-600 MB Arbeitsspeicher.