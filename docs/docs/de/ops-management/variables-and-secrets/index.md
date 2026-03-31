---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Variablen und Geheimnisse

## Einführung

Hier konfigurieren und verwalten Sie zentral Ihre Umgebungsvariablen und Geheimnisse. Dies ist nützlich für die Speicherung sensibler Daten, die Wiederverwendung von Konfigurationsdaten und die Isolation von Umgebungskonfigurationen.

## Unterschiede zu `.env`

| **Merkmal** | **`.env`-Datei** | **Dynamisch konfigurierte Variablen und Geheimnisse** |
| :---------- | :------------------------------------------------------ | :------------------------------------------------------------------------ |
| **Speicherort** | Wird in der `.env`-Datei im Stammverzeichnis des Projekts gespeichert. | Wird in der `environmentVariables`-Tabelle in der Datenbank gespeichert. |
| **Lademethode** | Wird beim Start der Anwendung mithilfe von Tools wie `dotenv` in `process.env` geladen. | Wird dynamisch gelesen und beim Start der Anwendung in `app.environment` geladen. |
| **Änderungsmethode** | Erfordert die direkte Bearbeitung der Datei; Änderungen werden erst nach einem Neustart der Anwendung wirksam. | Unterstützt Änderungen zur Laufzeit; Änderungen werden sofort nach dem Neuladen der Anwendungskonfiguration wirksam. |
| **Umgebungsisolation** | Jede Umgebung (Entwicklung, Test, Produktion) erfordert eine separate Pflege der `.env`-Dateien. | Jede Umgebung (Entwicklung, Test, Produktion) erfordert eine separate Pflege der Daten in der `environmentVariables`-Tabelle. |
| **Anwendungsfälle** | Geeignet für feste, statische Konfigurationen, z. B. Hauptdatenbankinformationen der Anwendung. | Geeignet für dynamische Konfigurationen, die häufige Anpassungen erfordern oder an die Geschäftslogik gebunden sind, z. B. Informationen zu externen Datenbanken, Dateispeichern usw. |

## Installation

Dies ist ein integriertes Plugin, das keine separate Installation erfordert.

## Verwendung

### Wiederverwendung von Konfigurationsdaten

Wenn Sie beispielsweise an mehreren Stellen in einem Workflow E-Mail-Knoten benötigen, die alle eine SMTP-Konfiguration erfordern, können Sie die allgemeine SMTP-Konfiguration in Umgebungsvariablen speichern.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Speicherung sensibler Daten

Hier können Sie Konfigurationsinformationen für verschiedene externe Datenbanken, Schlüssel für Cloud-Dateispeicher und ähnliche Daten speichern.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Isolation von Umgebungskonfigurationen

In verschiedenen Umgebungen wie Entwicklung, Test und Produktion werden unabhängige Konfigurationsmanagementstrategien eingesetzt. Dies stellt sicher, dass sich die Konfigurationen und Daten der einzelnen Umgebungen nicht gegenseitig beeinflussen. Jede Umgebung verfügt über eigene Einstellungen, Variablen und Ressourcen, wodurch Konflikte zwischen Entwicklungs-, Test- und Produktionsumgebungen vermieden und gleichzeitig sichergestellt wird, dass das System in jeder Umgebung wie erwartet funktioniert.

Beispielsweise kann die Konfiguration für Dateispeicherdienste in der Entwicklungs- und Produktionsumgebung unterschiedlich sein, wie unten gezeigt:

Entwicklungsumgebung

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Produktionsumgebung

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Verwaltung von Umgebungsvariablen

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Umgebungsvariablen hinzufügen

- Unterstützt das Hinzufügen einzelner Variablen und im Batch-Verfahren.
- Unterstützt die Speicherung im Klartext und verschlüsselt.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Einzelnes Hinzufügen

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Batch-Hinzufügen

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Hinweise

### Anwendung neu starten

Nach dem Ändern oder Löschen von Umgebungsvariablen erscheint oben ein Hinweis zum Neustart der Anwendung. Änderungen an Umgebungsvariablen werden erst nach dem Neustart der Anwendung wirksam.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Verschlüsselte Speicherung

Die verschlüsselten Daten für Umgebungsvariablen verwenden die symmetrische AES-Verschlüsselung. Der PRIVATE KEY für die Ver- und Entschlüsselung wird im Speicherverzeichnis abgelegt. Bitte bewahren Sie ihn sicher auf; bei Verlust oder Überschreibung können die verschlüsselten Daten nicht mehr entschlüsselt werden.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Derzeit unterstützte Plugins für Umgebungsvariablen

### Action: Benutzerdefinierte Anfrage

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

### Datenquelle: Externe MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Datenquelle: Externe MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Datenquelle: Externe Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Datenquelle: Externe PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Datenquelle: Externe SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Datenquelle: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Datenquelle: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Dateispeicher: Lokal

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Dateispeicher: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Dateispeicher: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Dateispeicher: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Dateispeicher: S3 Pro

Nicht angepasst

### Karte: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Karte: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### E-Mail-Einstellungen

Nicht angepasst

### Benachrichtigung: E-Mail

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Öffentliche Formulare

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Systemeinstellungen

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verifizierung: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verifizierung: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Workflow

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)