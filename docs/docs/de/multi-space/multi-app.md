---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/multi-space/multi-app).
:::

# Multi-App

## Einführung

Das **Multi-App-Plugin** ermöglicht die dynamische Erstellung und Verwaltung mehrerer unabhängiger Anwendungen, ohne dass separate Bereitstellungen erforderlich sind. Jede Unteranwendung ist eine vollständig unabhängige Instanz mit eigener Datenbank, eigenen Plugins und Konfigurationen.

#### Anwendungsfälle
- **Mandantenfähigkeit (Multi-Tenancy)**: Bietet unabhängige Anwendungsinstanzen, bei denen jeder Kunde über eigene Daten, Plugin-Konfigurationen und Berechtigungssysteme verfügt.
- **Haupt- und Teilsysteme für verschiedene Geschäftsbereiche**: Ein großes System, das aus mehreren unabhängig bereitgestellten kleinen Anwendungen besteht.

:::warning
Das Multi-App-Plugin selbst bietet keine Funktionen zur gemeinsamen Nutzung von Benutzern.  
Um eine Benutzerintegration über mehrere Anwendungen hinweg zu ermöglichen, kann es in Verbindung mit dem **[Authentifizierungs-Plugin](/auth-verification)** verwendet werden.
:::

## Installation

Suchen Sie das **Multi-App**-Plugin in der Plugin-Verwaltung und aktivieren Sie es.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Benutzerhandbuch

### Erstellen einer Unteranwendung

Klicken Sie im Systemeinstellungsmenü auf „Multi-App“, um die Multi-App-Verwaltungsseite aufzurufen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Klicken Sie auf die Schaltfläche „Neu hinzufügen“, um eine neue Unteranwendung zu erstellen:

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Erläuterung der Formularfelder

* **Name**: Kennung der Unteranwendung, global eindeutig.
* **Anzeigename**: Der in der Benutzeroberfläche angezeigte Name der Unteranwendung.
* **Startmodus**:
  * **Beim ersten Zugriff starten**: Die Unteranwendung startet erst, wenn ein Benutzer zum ersten Mal über die URL darauf zugreift.
  * **Zusammen mit der Hauptanwendung starten**: Die Unteranwendung startet gleichzeitig mit der Hauptanwendung (dies erhöht die Startzeit der Hauptanwendung).
* **Port**: Die von der Unteranwendung während der Laufzeit verwendete Portnummer.
* **Benutzerdefinierte Domain**: Konfigurieren Sie eine unabhängige Subdomain für die Unteranwendung.
* **An Menü anheften**: Fixiert den Zugriffspunkt der Unteranwendung auf der linken Seite der oberen Navigationsleiste.
* **Datenbankverbindung**: Wird zur Konfiguration der Datenquelle für die Unteranwendung verwendet und unterstützt drei Methoden:
  * **Neue Datenbank**: Verwendet den aktuellen Datendienst wieder, um eine unabhängige Datenbank zu erstellen.
  * **Neue Datenverbindung**: Konfiguriert einen völlig neuen Datenbankdienst.
  * **Schema-Modus**: Erstellt ein unabhängiges Schema für die Unteranwendung in PostgreSQL.
* **Upgrade**: Wenn die verbundene Datenbank eine ältere Version der NocoBase-Datenstruktur enthält, wird sie automatisch auf die aktuelle Version aktualisiert.

### Unteranwendungen starten und stoppen

Klicken Sie auf die Schaltfläche **Starten**, um eine Unteranwendung zu starten.  
> Wenn bei der Erstellung *„Beim ersten Zugriff starten“* ausgewählt wurde, startet sie automatisch beim ersten Besuch.  

Klicken Sie auf die Schaltfläche **Anzeigen**, um die Unteranwendung in einem neuen Tab zu öffnen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### Status und Protokolle der Unteranwendung

In der Liste können Sie den Speicher- und CPU-Verbrauch jeder Anwendung einsehen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Klicken Sie auf die Schaltfläche **Protokolle**, um die Laufzeitprotokolle der Unteranwendung anzuzeigen.  
> Falls eine Unteranwendung nach dem Start nicht erreichbar ist (z. B. aufgrund einer beschädigten Datenbank), können Sie die Fehlerbehebung mithilfe der Protokolle durchführen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Unteranwendung löschen

Klicken Sie auf die Schaltfläche **Löschen**, um eine Unteranwendung zu entfernen.  
> Beim Löschen können Sie wählen, ob auch die Datenbank gelöscht werden soll. Bitte gehen Sie vorsichtig vor, da dieser Vorgang nicht rückgängig gemacht werden kann.

### Zugriff auf Unteranwendungen
Standardmäßig wird `/_app/:appName/admin/` verwendet, um auf Unteranwendungen zuzugreifen, zum Beispiel:
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Zusätzlich können Sie unabhängige Subdomains für Unteranwendungen konfigurieren. Sie müssen die Domain auf die aktuelle IP-Adresse auflösen. Wenn Sie Nginx verwenden, muss die Domain auch in der Nginx-Konfiguration hinzugefügt werden.

### Verwaltung von Unteranwendungen über die Befehlszeile

Im Stammverzeichnis des Projekts können Sie die Befehlszeile verwenden, um Unteranwendungsinstanzen über **PM2** zu verwalten:

```bash
yarn nocobase pm2 list              # Liste der aktuell laufenden Instanzen anzeigen
yarn nocobase pm2 stop [appname]    # Einen bestimmten Unteranwendungsprozess stoppen
yarn nocobase pm2 delete [appname]  # Einen bestimmten Unteranwendungsprozess löschen
yarn nocobase pm2 kill              # Alle gestarteten Prozesse erzwingen beenden (kann auch die Instanz der Hauptanwendung einschließen)
```

### Datenmigration aus alten Multi-App-Versionen

Rufen Sie die alte Multi-App-Verwaltungsseite auf und klicken Sie auf die Schaltfläche **Daten in neue Multi-App migrieren**, um die Datenmigration durchzuführen.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## Häufig gestellte Fragen (FAQ)

#### 1. Plugin-Verwaltung
Unteranwendungen können dieselben Plugins wie die Hauptanwendung verwenden (einschließlich der Versionen), aber Plugins können unabhängig konfiguriert und genutzt werden.

#### 2. Datenbankisolierung
Unteranwendungen können mit unabhängigen Datenbanken konfiguriert werden. Wenn Sie Daten zwischen Anwendungen austauschen möchten, kann dies über externe Datenquellen realisiert werden.

#### 3. Datensicherung und Migration
Derzeit umfasst die Datensicherung in der Hauptanwendung keine Daten der Unteranwendungen (sie enthält nur Basisinformationen der Unteranwendungen). Sicherungen und Migrationen müssen manuell innerhalb jeder Unteranwendung durchgeführt werden.

#### 4. Bereitstellung und Aktualisierungen
Die Versionen der Unteranwendungen folgen automatisch den Upgrades der Hauptanwendung, wodurch die Versionskonsistenz zwischen Haupt- und Unteranwendungen gewährleistet wird.

#### 5. Ressourcenverwaltung
Der Ressourcenverbrauch jeder Unteranwendung entspricht im Wesentlichen dem der Hauptanwendung. Derzeit liegt der Speicherverbrauch einer einzelnen Anwendung bei etwa 500-600 MB.