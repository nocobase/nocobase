#Anwendungen verwalten

Wenn Sie eine NocoBase-Anwendung als CLI-Umgebung gespeichert haben, erfolgt die tägliche Verwaltung grundsätzlich in der Befehlsgruppe `nb app`: Starten, Stoppen, Neustart, Protokolle anzeigen und Upgrade.

Meistens müssen Sie sich nicht alle Parameter merken. Machen Sie zunächst klar, ob Sie „die Anwendung ausführen“, „die Protokolle lesen, um Probleme zu beheben“ oder „auf eine neue Version aktualisieren“ möchten, und wählen Sie dann den entsprechenden Befehl aus.

Wenn Sie zunächst verstehen möchten, warum `nb app` in diesem Befehlssatz zusammengefasst ist und welche Beziehung er zu `nb app autostart` hat, lesen Sie zunächst [nb app design intent](../cli-design/nb-app-design-intent.md). Diese Seite enthält nur die häufigsten täglichen Vorgänge.

## Schnellindex

| Ich möchte... | Welcher Befehl soll verwendet werden |
| --- | --- |
| Anwendungsbetrieb starten oder fortsetzen | [`nb app start`](../../api/cli/app/start.md) |
| Stoppen Sie die Anwendung vorübergehend | [`nb app stop`](../../api/cli/app/stop.md) |
| Stoppen Sie zusammen mit der CLI-verwalteten integrierten Datenbank | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Starten Sie die Anwendung neu, nachdem Sie die Konfiguration geändert haben | [`nb app restart`](../../api/cli/app/restart.md) |
| Anwendungsprotokolle in Echtzeit anzeigen | [`nb app logs`](../../api/cli/app/logs.md) |
| Upgrade auf eine neue Quell- oder Bildversion | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip Bestätigen Sie zunächst die aktuelle Umgebung

Der Befehl `nb app` wirkt sich standardmäßig auf die aktuelle Umgebung aus. Wenn Sie mehrere Umgebungen gleichzeitig verwalten, wird standardmäßig empfohlen, die Zielumgebung zu bestätigen, bevor Vorgänge gestartet, gestoppt, protokolliert oder aktualisiert werden.

Wenn Sie explizit einen anderen `--env` übergeben, fordert die CLI normalerweise eine Bestätigung an. In Skripten oder nicht interaktiven Szenarios können Sie `--yes` hinzufügen, um diesen Schritt zu überspringen. Das Umschalten, Anzeigen und Entfernen mehrerer Umgebungen wird in [Multi-Environment Management](./multi-environment.md) eingeführt.

:::

## Anwendung starten

Rufen Sie die Anwendung auf und verwenden Sie standardmäßig `nb app start`:

```bash
nb app start
```

Wenn Sie etwas anderes als die aktuelle Umgebung bearbeiten möchten, können Sie dies explizit angeben:

```bash
nb app start --env app1 --yes
```

Mehrere andere häufig verwendete Startparameter:

- `nb app start` Standardmäßig werden zuerst die erforderlichen Installations- oder Upgrade-Vorbereitungen automatisch abgeschlossen und dann der Dienst gestartet.

Local npm/Git env startet den lokalen Anwendungsprozess und Docker env erstellt den Anwendungscontainer entsprechend der gespeicherten Konfiguration neu. Detaillierte Parameter finden Sie unter [`nb app start`](../../api/cli/app/start.md).

## Stoppen und neu starten

Wenn Sie die Anwendung nur vorübergehend stoppen möchten, verwenden Sie `nb app stop`:

```bash
nb app stop
```

Wenn Sie gerade die Konfiguration, Abhängigkeiten oder den Code geändert haben, ist es normalerweise einfacher, einfach `nb app restart` direkt zu verwenden:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` wird zuerst gestoppt und dann auf die gleiche Weise wie `start` neu gestartet. Ausführliche Informationen zur Verwendung finden Sie unter [`nb app stop`](../../api/cli/app/stop.md) und [`nb app restart`](../../api/cli/app/restart.md).

## Protokoll anzeigen

Wenn Sie Probleme beheben, schauen Sie sich normalerweise zuerst die Protokolle an:

```bash
nb app logs
```

Wenn Sie nur eine neuere Ausgabe sehen möchten oder das Protokoll nicht weiter verfolgen möchten, können Sie Folgendes verwenden:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

Die lokale npm/Git-Umgebung liest PM2-Protokolle und die Docker-Umgebung liest Containerprotokolle. Standardmäßig folgt `nb app logs` weiterhin der neuen Protokollausgabe. Detaillierte Parameter finden Sie unter [`nb app logs`](../../api/cli/app/logs.md).

## Anwendung aktualisieren

Der Upgrade-Befehl lautet `nb app upgrade`:

```bash
nb app upgrade
```

Dieser Befehl bewirkt mehr als nur „Laden Sie die neue Version herunter“. Der Standardprozess umfasst normalerweise Folgendes:

1. Stoppen Sie die aktuelle Anwendung
2. Laden Sie den gespeicherten Quellcode oder das gespeicherte Bild herunter und ersetzen Sie es
3. Synchronisieren Sie kommerzielle Plug-Ins
4. Aktualisieren Sie die Anwendung und starten Sie sie
5. Aktualisieren Sie die Env-Laufzeitinformationen

Wenn Sie den Quellcode oder das Bild im Voraus aktualisiert haben und nur das Upgrade fortsetzen und die Anwendung basierend auf dem aktuellen Inhalt starten möchten, können Sie `--skip-download` hinzufügen:

```bash
nb app upgrade --skip-download
```

Wenn Sie die Zielversion explizit angeben möchten, können Sie auch `--version` hinzufügen:

```bash
nb app upgrade --version beta
```

:::Warnhinweis

`nb app upgrade` Normalerweise werden Sie vor dem eigentlichen Start auch einmal um eine Bestätigung gebeten. In Skripten, CI oder anderen nicht interaktiven Szenarien muss `--force` explizit übergeben werden. Wenn Sie gleichzeitig auch umgebungsübergreifend arbeiten, müssen Sie normalerweise `--yes` zusammenführen.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Eine ausführlichere Parameterbeschreibung finden Sie unter [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Verwandte Links

- [nb app design intent](../cli-design/nb-app-design-intent.md)
- [Verwaltung mehrerer Umgebungen](./multi-environment.md)
- [`nb app` Befehlsreferenz](../../api/cli/app/index.md)
