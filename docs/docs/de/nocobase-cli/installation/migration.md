# So verbinden Sie die alte Installationsmethode mit AI und migrieren auf CLI

Wenn Sie noch Docker-, `create-nocobase-app`- oder Git-Quellcode verwenden, um NocoBase gemäß der alten Dokumentation zu installieren und zu warten, können Sie es auf diese Weise weiterhin verwenden. Es ist nicht erforderlich, die Anwendung sofort neu zu installieren, um auf AI zuzugreifen.

Diese Seite hilft Ihnen hauptsächlich dabei, zunächst die Route zu bestimmen:

- Verwenden Sie weiterhin die ursprünglichen Installations- und Upgrade-Methoden
- Ermöglichen Sie vorhandenen Anwendungen zunächst den Zugriff auf den KI-Agenten
- Migration zum neuen CLI-basierten Ansatz

Standardmäßig wird empfohlen, zunächst zu prüfen, zu welcher Kategorie Sie gehören, und dann das entsprechende Dokument einzugeben. Dies ist stabiler und führt weniger zu Fehlfunktionen der Produktionsumgebung.

## Welche Methode soll ich wählen?

| Wenn Sie jetzt wollen... | Was standardmäßig zu tun ist |
| --- | --- |
| Installieren, aktualisieren und warten Sie weiterhin Anwendungen auf die ursprüngliche Weise | Benutzen Sie einfach weiterhin den alten Weg, lesen Sie zuerst den entsprechenden Dokumenteintrag unten |
| Lassen Sie eine alte Anwendung, die stabil ausgeführt wurde, eine Verbindung zum KI-Agenten herstellen | Standardmäßig wird zuerst die Remoteverbindung verwendet, die das geringste Risiko birgt |
| Verwenden Sie `nb app`, `nb env`, `nb source`, um Anwendungen in Zukunft zu verwalten | Erstellen Sie eine neue CLI-Anwendung und migrieren Sie die alten Daten dorthin |

## Verwenden Sie weiterhin die ursprüngliche Installationsmethode

Wenn Sie an die bisherige Installationsmethode gewöhnt sind, können Sie diese weiterhin verwenden. Befolgen Sie einfach die Originaldokumente für Installation, Upgrade und Umgebungsvariablenkonfiguration.

### NocoBase installieren

- [Docker-Installation](/get-started/installation/docker)
- [create-nocobase-app-Installation](/get-started/installation/create-nocobase-app)
- [Git-Quellcode-Installation](/get-started/installation/git)
- [Umgebungsvariablen](/get-started/installation/env)

### NocoBase aktualisieren

- [Upgrade der Docker-Installation](/get-started/upgrading/docker)
- [Aktualisierung der Installation von create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Git-Quellcode-Installation aktualisieren](/get-started/upgrading/git)

## Methode 1: Lassen Sie zunächst vorhandene Anwendungen auf den AI-Agenten zugreifen

Wenn Ihre alte Anwendung bereits stabil läuft, verwenden Sie standardmäßig diese Methode.

Der Schwerpunkt dieser Methode liegt darin, zunächst vorhandene Anwendungen über eine Remoteverbindung mit der CLI und dem AI-Agenten zu verbinden. Dies stellt das geringste Risiko dar, da Ihre aktuellen Installations-, Start-, Stopp- und Upgrade-Prozesse nicht direkt übernommen werden.

Doch zunächst müssen wir die Grenzen klären:

– Diese Methode verfügt nicht über `nb app`-bezogene Funktionen
- Es übernimmt nicht die Laufzeitverwaltung alter Apps für Sie
- Fähigkeiten im Zusammenhang mit KI-Gebäuden können jedoch normal genutzt werden

Mit anderen Worten: Wenn es Ihnen im Moment am meisten darum geht, „zuerst die KI anzuschließen“ und nicht „sofort das gesamte Betriebsführungssystem auf die CLI umzustellen“, werden Sie standardmäßig zuerst diesen Weg wählen.

Wenn Sie eine Verbindung zu einer vorhandenen Anwendung herstellen, können Sie eine CLI-Umgebung wie folgt initialisieren:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Wenn später eine erneute Authentifizierung erforderlich ist, können Sie Folgendes ausführen:

```bash
nb env auth app1
```

Wenn Sie gerade erst anfangen möchten, KI zum Aufbau von Fähigkeiten zu nutzen, lesen Sie einfach weiter [AI Build Quick Start](/ai-builder/).

## Methode 2: Zur CLI migrieren

Wenn Sie in Zukunft lokale Anwendungen mit `nb app`, `nb env` und `nb source` verwalten möchten, ist es sicherer, die bestehende Anwendung nicht direkt zu übernehmen, sondern eine neue Anwendung zu erstellen und dann die Daten der alten Anwendung dorthin zu migrieren.

Der Grund ist auch ganz einfach: Die Fähigkeit zur „Übernahme bestehender Anwendungen“ befindet sich noch in der Entwicklung.

Daher lautet die derzeit standardmäßig empfohlene Migrationsroute:

1. Erstellen Sie zunächst eine neue CLI-Anwendung
2. Migrieren Sie die Datenbank, `storage` und Umgebungsvariablen der alten Anwendung.
3. Nachdem Sie überprüft haben, ob der Betrieb, die Aktualisierung und die KI-Funktionen der neuen Anwendung normal sind, entscheiden Sie, ob Sie zur Produktionsumgebung wechseln möchten.

Erstellen Sie zunächst eine neue CLI-Umgebung:

```bash
nb init --yes --env app1
```

Vor der Migration wird empfohlen, zu bestätigen, dass diese Inhalte bereit sind:

1. Die Datenbank wurde gesichert
2. Das Verzeichnis `storage` wurde gesichert
3. Die wichtigsten Umgebungsvariablen der alten Anwendung wurden aufgezeichnet, z. B. `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`

Standardmäßig reicht es aus, zunächst die Testumgebung zu migrieren. Migrieren Sie die Produktionsumgebung erst, wenn Sie bestätigt haben, dass die Sicherung, die Umgebungsvariablen und die Datenbankkonfiguration korrekt sind.

## Wo Sie als nächstes suchen müssen

- Wenn Sie bereit sind, Anwendungen auf eine neue Art zu installieren und zu verwalten, fahren Sie mit [Installation mit CLI (empfohlen)](./cli.md) fort.
- Wenn Sie weiterhin die ursprüngliche Installationsmethode verwenden, kehren Sie einfach zum Installations- und Upgrade-Dokumenteintrag oben zurück.
