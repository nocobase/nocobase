---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/multi-app/multi-app/local).
:::

# Shared-Memory-Modus

## Einführung

Wenn Benutzer eine Aufteilung des Geschäfts auf Anwendungsebene wünschen, aber keine komplexe Bereitstellungs- und Betriebsarchitektur einführen möchten, kann der Shared-Memory-Modus für mehrere Anwendungen verwendet werden.

In diesem Modus können mehrere Anwendungen gleichzeitig in einer NocoBase-Instanz ausgeführt werden. Jede Anwendung ist unabhängig, kann mit einer unabhängigen Datenbank verbunden werden, kann separat erstellt, gestartet und gestoppt werden, aber sie teilen sich denselben Prozess und Speicherplatz. Benutzer müssen weiterhin nur eine NocoBase-Instanz warten.

## Benutzerhandbuch

### Konfiguration der Umgebungsvariablen

Stellen Sie vor der Verwendung der Multi-Anwendungs-Funktion sicher, dass beim Start von NocoBase die folgenden Umgebungsvariablen festgelegt wurden:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Erstellung von Anwendungen

Klicken Sie im Systemeinstellungsmenü auf „App-Supervisor“, um die Anwendungsverwaltungsseite aufzurufen.

![](https://static-docs.nocobase.com/202512291056215.png)

Klicken Sie auf die Schaltfläche „Neu hinzufügen“, um eine neue Anwendung zu erstellen.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Beschreibung der Konfigurationselemente

| Konfigurationselement | Beschreibung |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Anwendungsname**   | Der in der Benutzeroberfläche angezeigte Name der Anwendung                                                                                                                                                                                       |
| **Anwendungskennung**   | Anwendungskennung, global eindeutig                                                                                                                                                                                           |
| **Startmodus**   | - Beim ersten Zugriff starten: Die Unteranwendung wird erst gestartet, wenn der Benutzer sie zum ersten Mal über eine URL aufruft<br>- Zusammen mit der Hauptanwendung starten: Die Unteranwendung wird gleichzeitig mit der Hauptanwendung gestartet (erhöht die Startzeit der Hauptanwendung)                                                                        |
| **Umgebung**       | Im Shared-Memory-Modus ist nur die lokale Umgebung verfügbar, d. h. `local`                                                                                                                                                               |
| **Datenbankverbindung** | Dient zur Konfiguration der Haupt-Datenquelle der Anwendung und unterstützt die folgenden drei Methoden:<br>- Neue Datenbank: Den aktuellen Datenbankdienst wiederverwenden und eine unabhängige Datenbank erstellen<br>- Neue Datenverbindung: Verbindung zu anderen Datenbankdiensten herstellen<br>- Schema-Modus: Wenn die aktuelle Haupt-Datenquelle PostgreSQL ist, wird ein unabhängiges Schema für die Anwendung erstellt |
| **Upgrade**       | Wenn in der verbundenen Datenbank NocoBase-Anwendungsdaten einer niedrigeren Version vorhanden sind, ob ein automatisches Upgrade auf die aktuelle Anwendungsversion zulässig ist                                                                                                                             |
| **JWT-Schlüssel**   | Generiert automatisch einen unabhängigen JWT-Schlüssel für die Anwendung, um sicherzustellen, dass die Anwendungssitzung von der Hauptanwendung und anderen Anwendungen unabhängig ist                                                                                                                                            |
| **Benutzerdefinierte Domain** | Konfiguriert eine unabhängige Zugriffsdomain für die Anwendung                                                                                                                                                                                       |

### Starten der Anwendung

Klicken Sie auf die Schaltfläche **Starten**, um die Unteranwendung zu starten.

> Wenn bei der Erstellung _„Beim ersten Zugriff starten“_ ausgewählt wurde, startet sie beim ersten Zugriff automatisch.

![](https://static-docs.nocobase.com/202512291121065.png)

### Zugriff auf die Anwendung

Klicken Sie auf die Schaltfläche **Besuchen**, um die Unteranwendung in einem neuen Tab zu öffnen.

Standardmäßig wird `/apps/:appName/admin/` verwendet, um auf die Unteranwendung zuzugreifen, zum Beispiel:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Gleichzeitig kann auch eine unabhängige Domain für die Unteranwendung konfiguriert werden. Die Domain muss auf die aktuelle IP aufgelöst werden. Wenn Nginx verwendet wird, muss die Domain auch in der Nginx-Konfiguration hinzugefügt werden.

### Stoppen der Anwendung

Klicken Sie auf die Schaltfläche **Stoppen**, um die Unteranwendung zu stoppen.

![](https://static-docs.nocobase.com/202512291122113.png)

### Anwendungsstatus

In der Liste können Sie den aktuellen Status jeder Anwendung einsehen.

![](https://static-docs.nocobase.com/202512291122339.png)

### Löschen der Anwendung

Klicken Sie auf die Schaltfläche **Löschen**, um die Anwendung zu entfernen.

![](https://static-docs.nocobase.com/202512291122178.png)

## Häufig gestellte Fragen

### 1. Plugin-Verwaltung

Die Plugins, die von anderen Anwendungen verwendet werden können, entsprechen denen der Hauptanwendung (einschließlich der Versionen), aber Plugins können unabhängig konfiguriert und verwendet werden.

### 2. Datenbank-Isolation

Andere Anwendungen können unabhängige Datenbanken konfigurieren. Wenn ein Datenaustausch zwischen Anwendungen gewünscht ist, kann dies über externe Datenquellen realisiert werden.

### 3. Datensicherung und Migration

Derzeit unterstützt die Datensicherung in der Hauptanwendung nicht die Einbeziehung von Daten anderer Anwendungen (sie enthält nur grundlegende Anwendungsinformationen). Sicherungen und Migrationen müssen manuell innerhalb der anderen Anwendungen durchgeführt werden.

### 4. Bereitstellung und Aktualisierung

Im Shared-Memory-Modus folgen die Versionen anderer Anwendungen automatisch dem Upgrade der Hauptanwendung, wodurch die Konsistenz der Anwendungsversionen automatisch gewährleistet wird.

### 5. Anwendungssitzung

- Wenn die Anwendung einen unabhängigen JWT-Schlüssel verwendet, ist die Anwendungssitzung von der Hauptanwendung und anderen Anwendungen unabhängig. Wenn über Unterpfade derselben Domain auf verschiedene Anwendungen zugegriffen wird, ist beim Wechsel zwischen verschiedenen Anwendungen eine erneute Anmeldung erforderlich, da das Anwendungs-TOKEN im LocalStorage zwischengespeichert wird. Es wird empfohlen, unabhängige Domains für verschiedene Anwendungen zu konfigurieren, um eine bessere Sitzungsisolation zu erreichen.
- Wenn die Anwendung keinen unabhängigen JWT-Schlüssel verwendet, teilt sie sich die Sitzung der Hauptanwendung. Nach dem Zugriff auf andere Anwendungen im selben Browser ist bei der Rückkehr zur Hauptanwendung keine erneute Anmeldung erforderlich. Es bestehen jedoch Sicherheitsrisiken: Wenn die Benutzer-IDs verschiedener Anwendungen identisch sind, kann dies dazu führen, dass Benutzer unbefugt auf Daten anderer Anwendungen zugreifen.