---
pkg: '@nocobase/plugin-app-supervisor'
---

# Shared-Memory-Modus

## Einführung

Wenn Sie Geschäftsbereiche auf App-Ebene aufteilen möchten, ohne eine komplexe Deployment- und Betriebsarchitektur einzuführen, verwenden Sie den Shared-Memory-Multi-App-Modus.

In diesem Modus laufen mehrere Apps in einer NocoBase-Instanz. Jede App ist unabhängig, kann eine eigene Datenbank verwenden und einzeln erstellt, gestartet oder gestoppt werden. Gleichzeitig teilen sich alle Apps denselben Prozess- und Speicherraum.

## Benutzerhandbuch

### Umgebungsvariablen

Vor der Nutzung der Multi-App-Funktionen stellen Sie sicher, dass beim Start von NocoBase folgende Umgebungsvariablen gesetzt sind:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### App erstellen

Öffnen Sie in den **System Settings** den Eintrag **App supervisor**, um zur App-Verwaltung zu gelangen.

![](https://static-docs.nocobase.com/202512291056215.png)

Klicken Sie auf **Add**, um eine neue App zu erstellen.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Konfigurationsoptionen

| Option | Beschreibung |
| --- | --- |
| **Anzeigename** | Name der App in der Oberfläche |
| **App-ID** | Eindeutiger, globaler App-Identifier |
| **Startmodus** | - Beim ersten Aufruf starten: Start beim ersten URL-Zugriff<br>- Mit Hauptanwendung starten: Start zusammen mit der Hauptanwendung (verlängert die Startzeit) |
| **Umgebung** | Im Shared-Memory-Modus ist nur `local` verfügbar |
| **Datenbank** | Konfiguration der Hauptdatenquelle:<br>- Neue Datenbank: bestehenden DB-Service wiederverwenden und eigene DB anlegen<br>- Neue Verbindung: mit anderem DB-Service verbinden<br>- Neues Schema: bei PostgreSQL ein eigenes Schema erstellen |
| **Upgrade** | Ob vorhandene Daten älterer NocoBase-Versionen automatisch auf die aktuelle Version angehoben werden |
| **JWT-Secret** | Automatische Erzeugung eines eigenen JWT-Secrets zur Sitzungsisolation |
| **Custom Domain** | Eigene Zugriffsdomain für die App |

### App starten

Klicken Sie auf **Start**, um die App zu starten.

> Wenn beim Erstellen _Start on first visit_ gewählt wurde, startet die App automatisch beim ersten Zugriff.

![](https://static-docs.nocobase.com/202512291121065.png)

### App aufrufen

Klicken Sie auf **Visit**, um die App in einem neuen Tab zu öffnen.

Standardmäßig erfolgt der Zugriff über `/apps/:appName/admin/`, zum Beispiel:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Alternativ können Sie eine eigene Domain konfigurieren. Die Domain muss auf die aktuelle IP auflösen; bei Nginx muss die Domain zusätzlich in der Nginx-Konfiguration eingetragen werden.

### App stoppen

Klicken Sie auf **Stop**, um die App zu stoppen.

![](https://static-docs.nocobase.com/202512291122113.png)

### App-Status

Der aktuelle Status jeder App wird in der Liste angezeigt.

![](https://static-docs.nocobase.com/202512291122339.png)

### App löschen

Klicken Sie auf **Delete**, um eine App zu entfernen.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### 1. Plugin-Verwaltung

Andere Apps können dieselben Plugins (inkl. Versionen) wie die Hauptanwendung nutzen, die Konfiguration bleibt jedoch pro App isoliert.

### 2. Datenbank-Isolation

Apps können eigene Datenbanken nutzen. Für Datenaustausch zwischen Apps verwenden Sie externe Datenquellen.

### 3. Backup und Migration

Backups in der Hauptanwendung enthalten derzeit keine Daten anderer Apps (nur Basis-Metadaten). Backup und Migration müssen je App separat erfolgen.

### 4. Deployment und Upgrade

Im Shared-Memory-Modus folgen App-Versionen automatisch der Hauptanwendung und bleiben damit konsistent.

### 5. App-Sitzungen

- Mit eigenem JWT-Secret ist die Sitzung von Haupt- und anderen Apps isoliert. Bei Zugriff über Subpfade derselben Domain ist beim Wechsel oft eine erneute Anmeldung nötig (Token in LocalStorage). Separate Domains pro App werden empfohlen.
- Ohne eigenes JWT-Secret teilen sich Apps die Sitzung der Hauptanwendung. Das ist komfortabler, birgt aber Sicherheitsrisiken: Bei überlappenden Benutzer-IDs kann es zu unberechtigtem app-übergreifendem Zugriff kommen.
