# Anwendungskonfiguration und `.env`

Diese Seite gilt nur für Anwendungen, die über die NocoBase-CLI erstellt oder gehostet werden.

Wenn Sie gerade die Lektüre von [Installation mit CLI (empfohlen)](./cli.md) abgeschlossen und den Abschnitt „Installationsverzeichnis“ gesehen haben, sind die häufigsten Probleme, auf die Sie stoßen, normalerweise die folgenden:

- Wo wird die Datei `.env` abgelegt?
- Welche Konfigurationen eignen sich noch zum Schreiben in `.env`?
- Welche Konfigurationen eignen sich nun besser zur Übergabe an `nb env update`?

Lassen Sie uns zunächst über die Schlussfolgerung sprechen:

– Für CLI-installierte Anwendungen wird `.env` standardmäßig in `<app-path>/.env` platziert
– Diese Datei ist optional, nicht jede Umgebung muss manuell erstellt werden
- Grundkonfigurationen wie `APP_KEY`, `TZ`, `APP_PORT`, `APP_PUBLIC_PATH` und `DB_*` werden standardmäßig von `nb env update` verwaltet.
- `.env` wird hauptsächlich zur Ergänzung von Laufzeitvariablen verwendet, die die CLI nicht direkt übernommen hat, wie z. B. Speicher, Cache, Protokolle, Beobachtungen und einige Plug-in-Erweiterungsvariablen.

## Finden Sie zuerst `app-path`

In [Mit CLI installieren (empfohlen)](./cli.md#Installationsverzeichnis) lautet die Standardverzeichnisstruktur von CLI env wie folgt:

```text
<app-path>/
├── source/
├── storage/
└── .env
```

Wenn Sie nicht sicher sind, wo sich der aktuell angewendete `app-path` befindet, können Sie direkt nachsehen:

```bash
nb env info app1 --field app.appPath
```

Ersetzen Sie einfach `app1` durch Ihren Umgebungsnamen.

Das heißt, für eine Anwendung, die über die CLI erstellt oder gehostet wird, ist der am besten geeignete Speicherort für die Datei `.env`:

```text
<app-path>/.env
```

Im Allgemeinen ist es nicht erforderlich, es in `source/.env` abzulegen, und es ist nicht erforderlich, `.env` gemäß der alten Installationsmethode im Stammverzeichnis des Docker Compose-Projekts zu finden.

## Wann müssen Sie `.env` selbst erstellen?

`.env` ist optional.

Wenn Sie zunächst nur die Anwendung ausführen oder nur grundlegende Konfigurationen wie Ports, Zeitzonen, Datenbankverbindungen und öffentliche Zugriffspfade ändern möchten, ist es in vielen Fällen nicht erforderlich, `.env` manuell zu erstellen.

Fügen Sie sie nur zu `<app-path>/.env` hinzu, wenn Sie einige Laufzeitvariablen hinzufügen müssen, die die CLI nicht direkt übernommen hat.

## Standardmäßig wird zuerst `nb env update` verwendet

Bei der neuen CLI-Installationsmethode wird empfohlen, der grundlegenden Anwendungskonfiguration standardmäßig Priorität auf [`nb env update`](../../api/cli/env/update.md) zu geben.

Dies hat zwei Vorteile:

– Die Konfiguration und die Umgebung selbst werden im selben CLI-Speicher gespeichert, was die Überprüfung und Änderung erleichtert
– In Zukunft können Sie, Skripte und KI-Agenten weiterhin denselben Befehlssatz für die Wartung verwenden, sodass es nicht einfach ist, dass die Situation auftritt, dass „ein Satz Änderungen in der Datei vorgenommen wird, aber ein anderer Satz in der CLI aufgezeichnet wird“.

### Diese Konfigurationen eignen sich nun besser zur Übergabe an `nb env update`

Möglicherweise waren Sie es in der Vergangenheit gewohnt, die folgenden Elemente direkt in `.env` zu schreiben. Im CLI-Installationsmodus wird jedoch empfohlen, standardmäßig `nb env update` zu verwenden:

| Ich möchte mich ändern... | So ändern Sie die Standardeinstellung |
| --- | --- |
| `APP_KEY` | `nb env update <name> --app-key <value>` |
| `TZ` | `nb env update <name> --timezone <value>` |
| `APP_PORT` | `nb env update <name> --app-port <value>` |
| `APP_PUBLIC_PATH` | `nb env update <name> --app-public-path <value>` |
| `CDN_BASE_URL` | `nb env update <name> --cdn-base-url <value>` |
| Datenbanktyp und Verbindungsparameter, wie `DB_DIALECT`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` | `nb env update <name> --db-dialect ... --db-host ... --db-port ... --db-database ... --db-user ... --db-password ...` |
| PostgreSQL-Schema, Tabellenpräfix, Unterstrich zur Benennung solcher Datenbank-Ergänzungselemente, z. B. `DB_SCHEMA`, `DB_TABLE_PREFIX`, `DB_UNDERSCORED` | `nb env update <name> --db-schema ... --db-table-prefix ... --db-underscored` |

Wenn Sie beispielsweise den Anwendungsport und die Zeitzone ändern möchten, können Sie direkt so schreiben:

```bash
nb env update app1 --app-port 13080 --timezone Asia/Shanghai
```

Wenn Sie die Datenbankverbindungsparameter ändern möchten, können Sie wie folgt schreiben:

```bash
nb env update app1 \
  --db-dialect postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --db-database nocobase \
  --db-user nocobase \
  --db-password nocobase
```

Nachdem Sie die Änderungen vorgenommen haben, werden Sie von der CLI normalerweise aufgefordert, später `nb app restart` auszuführen. Eine ausführlichere Parameterbeschreibung finden Sie unter [`nb env update`](../../api/cli/env/update.md).

## Welche Situationen eignen sich besser zum Schreiben in `.env`

Wenn eine Variable noch keinen entsprechenden CLI-Parameter hat oder es sich eher um eine erweiterte Konfiguration handelt, die „direkt an die Anwendungslaufzeit übergeben wird“, schreiben Sie einfach weiter `<app-path>/.env`.

In der Regel umfassen diese Kategorien:

- Dateispeicher- und Objektspeicherkonfigurationen wie `LOCAL_STORAGE_*`, `AWS_S3_*`, `ALI_OSS_*`, `TX_COS_*`
- Cache- und Redis-Konfiguration, z. B. `CACHE_*`, `REDIS_URL`
- Protokoll- und Beobachtungskonfigurationen wie `LOGGER_*`, `TELEMETRY_*`
– Bestimmte Plug-in- oder erweiterungsspezifische Variablen, z. B. Export, asynchrone Aufgaben, Workflow und AI-Erweiterungsbezogene Variablen

Zum Beispiel:

```bash
LOCAL_STORAGE_DEST=storage/uploads
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
```

Bei diesem Variablentyp handelt es sich im Wesentlichen um eine Anwendungslaufzeitkonfiguration, und die CLI übernimmt sie derzeit nicht Element für Element. Am natürlichsten ist es, es in `.env` zu platzieren.

## So teilen Sie die Arbeit zwischen `.env` und `nb env update` auf

Wenn Sie nicht sicher sind, wohin eine bestimmte Konfiguration gehen soll, befolgen Sie einfach standardmäßig diese Regel:

- Wenn `nb env update` bereits einen entsprechenden Parameter hat, wird dieser standardmäßig zuerst verwendet.
– Wenn es keinen entsprechenden Parameter gibt oder er offensichtlich zur Konfiguration der Laufzeiterweiterung wie Plug-Ins, Speicher, Cache und Protokolle gehört, fügen Sie ihn in `<app-path>/.env` ein.

In den meisten Szenarien ist diese Arbeitsteilung ausreichend.

### Ein häufiges Missverständnis

Behalten Sie nicht zwei Kopien derselben Konfiguration gleichzeitig bei.

Wenn Sie beispielsweise grundlegende Elemente wie `APP_PORT`, `TZ`, `APP_PUBLIC_PATH` und `DB_HOST` mit `nb env update` gespeichert haben, müssen Sie sie normalerweise nicht erneut in `.env` schreiben. Andernfalls kann es bei der späteren Fehlerbehebung leicht passieren, dass man nicht erkennt, welche Ebene der Wert ist, der wirklich wirksam werden soll.

## Ein minimales `.env`-Beispiel

Wenn Ihre Grundkonfiguration über die CLI gespeichert wurde, muss `.env` wahrscheinlich nur einige Erweiterungsvariablen beibehalten, wie zum Beispiel:

```bash
LOGGER_LEVEL=info
REDIS_URL=redis://127.0.0.1:6379
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=ap-southeast-1
```

Dies ist auch die Mentalität, die Ihnen diese Seite am meisten vermitteln möchte:

`.env` ist immer noch nützlich, aber bei der neuen CLI-Installationsmethode geht es eher darum, die Konfiguration der Laufzeiterweiterung zu ergänzen, als weiterhin alle grundlegenden Installationsparameter zu übernehmen.

## Wo Sie als nächstes suchen müssen

- Wenn Sie die Struktur des Anwendungsverzeichnisses nicht bestätigt haben, kehren Sie zunächst zu [Mit CLI installieren (empfohlen)](./cli.md#Installationsverzeichnis) zurück.
- Wenn Sie grundlegende Konfigurationen wie Ports, Zeitzonen, Datenbankverbindungen und öffentliche Zugriffspfade ändern möchten, lesen Sie weiterhin [`nb env update`](../../api/cli/env/update.md)
- Wenn Sie Anwendungsprotokolle starten, neu starten oder anzeigen möchten, lesen Sie weiter unter [Anwendung verwalten](../operations/manage-app.md)
