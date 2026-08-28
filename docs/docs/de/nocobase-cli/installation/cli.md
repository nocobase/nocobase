# Installation über CLI (empfohlen)

Nach NocoBase 2.1.0 wird die offizielle CLI-basierte Installations- und Verwaltungsmethode bereitgestellt. Sie können damit Installation, Verbindung, Upgrade und tägliche Wartung abschließen und außerdem eine anschließbare und betriebsbereite Umgebung für AI Agent vorbereiten.

## Installieren Sie die NocoBase-CLI

Wird nur bei der Erstinstallation der CLI ausgeführt.

Installieren Sie zunächst die CLI global:

```bash
npm install -g @nocobase/cli
nb --version
```

:::tip Es wird empfohlen, zuerst den Sitzungsmodus zu aktivieren

Wenn Sie mehrere Terminals oder Shells gleichzeitig öffnen oder möchten, dass der AI-Agent parallel zu Ihnen selbst arbeitet, wird standardmäßig empfohlen, zuerst [`nb session setup`](../../api/cli/session/setup.md) auszuführen. Auf diese Weise kann jede Sitzung ihre eigene `current env` beibehalten und sich nicht gegenseitig beeinflussen.

```bash
nb session setup
```

:::

Die CLI sucht standardmäßig nach Selbstaktualisierungen. Sie können die Update-Strategie an Ihre eigenen Gewohnheiten anpassen:

- `prompt`: Aufforderung, wenn eine neue Version gefunden wird
- `auto`: automatische Aktualisierung
- `off`: Automatische Updates deaktivieren

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

Selbstaktualisierung wird nur unterstützt, wenn die CLI durch eine standardmäßige globale npm-, pnpm- oder yarn-Installation verwaltet wird. Wenn sie aus dem Quellcode oder aus einem lokalen Projekt-Dependency-Baum läuft, verwenden Sie [`nb self check`](../../api/cli/self/check.md), um die erkannte Installationsmethode zu prüfen, und aktualisieren Sie stattdessen dieses übergeordnete Projekt.

Wenn Sie NocoBase auf dem Server bereitstellen und den `nb init --ui`-Assistenten über einen Remote-Browser öffnen möchten, wird empfohlen, zunächst den Standardhost der CLI auf die aktuelle Server-IP zu ändern:

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Ersetzen Sie `<server-ip>` durch die tatsächliche IP des aktuellen Servers, auf den Sie zugreifen können.

`nb config` ist die globale Konfiguration der CLI. Normalerweise muss es nur einmal festgelegt werden, und diese Standardwerte werden automatisch verwendet, wenn `nb init --ui` später erneut ausgeführt wird, sodass die Konfiguration nicht jedes Mal wiederholt werden muss.

Allgemein gesprochen:

– `default-ui-host` wird verwendet, um die im Browser erreichbare URL für den Assistenten `nb init --ui` zu erzeugen; der Assistentendienst selbst lauscht immer auf `0.0.0.0`
- `default-api-host` für die API-Adresse, die standardmäßig bei Neuinstallationen generiert wird

Bei der Bereitstellung auf einem Server sollten beide Werte normalerweise in IPs geändert werden, auf die der aktuelle Server zugreifen kann, anstatt weiterhin die lokale Standardadresse zu verwenden.

:::Warnung Dies ist nur ein Installationsassistent oder eine temporäre Zugriffsmethode, kein empfohlener Zugang für Produktionsumgebungen.

Setzen Sie `default-ui-host` / `default-api-host` auf die Server-IP, hauptsächlich, damit Sie `nb init --ui` über einen Remote-Browser öffnen oder vorübergehend überprüfen können, ob nach Abschluss der Installation auf den Dienst zugegriffen werden kann.

Dies bedeutet nicht, dass die Produktionsumgebung `IP + port` für die Bereitstellung externer Dienste über einen längeren Zeitraum verwenden sollte. Bei der formellen Bereitstellung wird weiterhin empfohlen, einen Domänennamen zu verwenden und einen einheitlichen Zugriff über einen Reverse-Proxy wie Nginx oder Caddy bereitzustellen und dann HTTPS zu aktivieren.

:::

## NocoBase installieren

### Methode 1: Installation über den UI-Assistenten

Dies ist der standardmäßig empfohlene Eintrag. Sie müssen nur Folgendes ausführen:

```bash
nb init --ui
```

Wenn Sie einen festen Port für die Assistentenseite angeben möchten, können Sie `--ui-port` direkt hinzufügen, zum Beispiel:

```bash
nb init --ui --ui-port 3000
```

![nb init UI-Assistent](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

Der Assistent führt Sie Schritt für Schritt durch die für die Installation oder Verbindung erforderliche Konfiguration basierend auf dem aktuellen Szenario.

### Methode 2: Interaktion über das Terminal

Wenn Sie Schritt für Schritt im Terminal tippen möchten, können Sie Folgendes direkt ausführen:

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Methode 3: Durch nicht interaktive Befehle

Wenn Sie in einem Skript, CI/CD oder einer anderen nicht interaktiven Umgebung arbeiten, verwenden Sie einfach `--yes`. In diesem Modus muss `--env` explizit übergeben werden und nicht explizit angegebene Parameter werden mit Standardwerten verarbeitet.

Die kürzeste Standardmethode zum Schreiben ist:

```bash
nb init --yes --env app1
```

Spezifisch für gängige Kombinationen wie unterschiedliche Installationsquellen, Versionsauswahl, `basic`-Zertifizierung, CI/CD-Verbindung zu vorhandenen Anwendungen und Datenbankbenennung, schauen Sie sich einfach [Befehlsreferenzbeispiel `nb init`] an (Beispiel ../../api/cli/init.md#).

## Was sollten Sie nach Abschluss der Installation zuerst bestätigen?

`--env` ist der Umgebungsname in der CLI. Im Allgemeinen dreht sich das nächste, was Sie nach Abschluss der Installation tun, um diese Umgebung.

Normalerweise wird empfohlen, zuerst diese drei Dinge zu bestätigen:

1. Ob die Umgebung erfolgreich erstellt und gespeichert wurde
2. Ob die Anwendung normal gestartet werden kann und ob die Protokolle normal sind
3. Wenn Sie es offiziell für die Außenwelt öffnen möchten, haben Sie den Zugang zur Produktionsumgebung geplant, anstatt `IP + port` weiterhin direkt zu verwenden?

### Installationsverzeichnis

Wenn Sie gerade eine lokale Anwendung mit `nb init --env app1` installiert haben, können Sie den vollständigen Pfad über `nb env info app1 --field app.appPath` anzeigen.

Standardmäßig organisiert die CLI lokale Dateien unter `app-path` gemäß der folgenden Konvention:

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

Allgemein gesprochen:

- `source/` entspricht hauptsächlich dem lokalen Anwendungsverzeichnis von npm/Git env. Für die Docker-Umgebung behält die CLI diesen Satz an Standardpfadableitungen ebenfalls bei, aber in den meisten Fällen müssen Sie sich nicht manuell darum kümmern
- `storage/` wird zum Speichern von Laufzeitdaten verwendet, z. B. integrierte Datenbankdaten, Plug-Ins, Protokolle usw.
- `.env` ist eine optionale Anwendungsumgebungsvariablendatei. Nur wenn Sie Umgebungsvariablen anpassen müssen, müssen Sie sie in `<app-path>/.env` hinzufügen. Wenn diese Datei vorhanden ist, wird sie standardmäßig von Docker-, NPM- und Git-Installationsquellen gelesen.

Eine ausführlichere Beschreibung finden Sie unter [`nb init` Befehlsreferenz](../../api/cli/init.md).

### Erinnerung an die Bereitstellung der Produktionsumgebung

Wenn Sie die Installation gerade abgeschlossen haben und zunächst die Installationsergebnisse überprüfen möchten, ist es normalerweise kein Problem, die Seite mit `IP + port` zu öffnen.

Wenn diese Umgebung jedoch offiziell Dienste für die Außenwelt bereitstellen soll, muss besonderes Augenmerk darauf gelegt werden:

- `nb init --ui` selbst ist nur eine temporäre Seite des Installationsassistenten, die zum Abschließen der Installation oder Initialisierung verwendet wird, und ist nicht der offizielle externe Diensteingang der Anwendung.
- Nach Abschluss der Installation über `nb init` eignet sich der derzeit von der Anwendung bereitgestellte `IP + port` besser für die Debugging-Phase, die Überprüfungsphase oder den temporären Zugriff auf das Intranet
- In der Produktionsumgebung wird nicht empfohlen, den NocoBase-Anwendungsport für eine langfristige Nutzung direkt dem öffentlichen Netzwerk zugänglich zu machen.
- Für den offiziellen externen Zugriff wird empfohlen, einen Domainnamen und einen Reverse-Proxy zu NocoBase über Nginx oder Caddy zu verwenden
– Produktionsumgebungen sollten der Aktivierung von HTTPS Vorrang vor der langfristigen Nutzung von exponierten `http://IP:port` geben.

Mit anderen Worten: `default-ui-host` und `default-api-host` dienen lediglich dazu, den Installationsassistenten und die Standardadressgenerierung komfortabler zu gestalten, und stellen nicht den Zugangseingang zur endgültigen Produktionsumgebung dar.

Wenn diese Umgebung zum offiziellen Start bereit ist, wird empfohlen, als nächsten Schritt nach Abschluss der Installation „eine Verbindung zum Reverse-Proxy herzustellen und HTTPS zu aktivieren“ und nicht als optionales Optimierungselement.

Wenn Sie jetzt bereit sind, mit der formellen Bereitstellung fortzufahren, wird empfohlen, mit der [Bereitstellung der Produktionsumgebung](../production/index.md) zu beginnen und sich dann bei Bedarf weiterhin die Reverse-Proxy-Konfiguration von [Nginx](../production/reverse-proxy/nginx.md) oder [Caddy](../production/reverse-proxy/caddy.md) anzusehen.

### Täglicher Betrieb

Sie können zunächst bestätigen, ob diese Umgebung erfolgreich gespeichert wurde:

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Wenn Sie nach der Installation mit den nachfolgenden Vorgängen fortfahren möchten, können Sie auf den folgenden Index klicken, um nach unten zu schauen:

| Ich möchte... | Wo suchen |
| --- | --- |
| Wenn Sie bereit sind, diese Umgebung offiziell für die Außenwelt zugänglich zu machen, verbinden Sie sie mit dem Reverse-Proxy der Produktionsumgebung und verwenden Sie den Domänennamen und HTTPS, um den Dienst verfügbar zu machen. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Bestätigen Sie, ob die Umgebung erfolgreich gespeichert wurde, prüfen Sie, welche Umgebung derzeit verwendet wird, und wechseln Sie zwischen mehreren Umgebungen. | [`nb env`](../../api/cli/env/index.md), [Multi-Umgebungsverwaltung](../operations/multi-environment.md). |
| Starten, stoppen, starten Sie die Anwendung neu, zeigen Sie Protokolle an oder fahren Sie mit dem Upgrade der Anwendung fort. | [`nb app`](../../api/cli/app/index.md), [Anwendung verwalten](../operations/manage-app.md). |
| Überprüfen Sie Datenbankverbindungen, zeigen Sie den Status der integrierten Datenbank an oder beheben Sie Probleme mit Datenbankcontainern. | [`nb db`](../../api/cli/db/index.md). |
| Installierte Plug-Ins anzeigen, Plug-Ins aktivieren oder deaktivieren. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Aktivieren Sie die kommerzielle Autorisierung, überprüfen Sie den Autorisierungsstatus und synchronisieren Sie kommerzielle Plug-Ins. | [`nb license`](../../api/cli/license/index.md). |
| Verwalten Sie lokale Quellcodeprojekte, z. B. das Herunterladen von Quellcode, das Starten des Entwicklungsmodus, das Erstellen oder Testen. Dies wird normalerweise mit npm/Git env verwendet. | [`nb source`](../../api/cli/source/index.md). |

Wenn Sie gerade eine lokale Anwendung installiert haben, können Sie normalerweise zuerst diese Befehle ausführen:

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Wenn Sie mehrere Umgebungen gleichzeitig verwalten, finden Sie unter [Multiple Environment Management](../operations/multi-environment.md) Informationen zu nachfolgenden Wechsel- und Statusanzeigemethoden.

Wenn Sie die Anwendung später aktualisieren möchten, schauen Sie sich einfach [Manage Application](../operations/manage-app.md) und [`nb app upgrade` Command Reference](../../api/cli/app/upgrade.md) an.

## Verwandte Links

- [`nb init` Befehlsreferenz](../../api/cli/init.md)
- [`nb env info` Befehlsreferenz](../../api/cli/env/info.md)
- [Reverse-Proxy der Produktionsumgebung: Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Vom alten Weg zur CLI migrieren](./migration.md)
- [Verwaltung mehrerer Umgebungen](../operations/multi-environment.md)
- [Anwendung verwalten](../operations/manage-app.md)
