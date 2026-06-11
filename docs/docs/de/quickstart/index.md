# Schnellstart

Wenn Sie diese CLI zum ersten Mal verwenden, müssen Sie sich zu Beginn nicht alle Befehle merken. Verwenden Sie `nb init --ui`, um zuerst eine Anwendung zu installieren, und schauen Sie sich dann je nach Szenario den Rest an.

## Stellen Sie zunächst den wichtigsten Geist fest

In NocoBase CLI drehen sich nachfolgende Vorgänge standardmäßig nicht um „ein bestimmtes Verzeichnis“ oder „einen bestimmten Port“, sondern um **env**.

Sie können sich env als „eine Reihe von Anwendungsverbindungs- und Betriebsinformationen, die von der CLI gespeichert werden“ vorstellen. Solange es erfolgreich gespeichert wurde, können viele nachfolgende Befehle direkt verwendet werden:

- Verwenden Sie `nb init`, um eine neue Anwendung zu installieren und sie als env zu speichern
- Verwenden Sie `nb env add`, um eine vorhandene Anwendung mit der CLI zu verbinden
- Verwalten Sie diese Umgebung mit `nb app start`, `nb app logs`, `nb app upgrade`
- Sichern und Wiederherstellen dieser Umgebung mit `nb backup`
- Verwenden Sie `nb app autostart`, `nb proxy`, um die Funktionen der Produktionsumgebung weiterhin zu ergänzen

Bedenken Sie dies zunächst, dann werden die nachfolgenden Dokumente viel reibungsloser ablaufen.

## Standardmäßig empfohlener Pfad

Wenn Sie nicht sicher sind, wo Sie anfangen sollen, ist es normalerweise am einfachsten, diesem Weg zu folgen:

1. Lesen Sie zuerst [Installation mit CLI (empfohlen)](./installation/cli.md) und schließen Sie `nb init` einmal ab.
2. Nachdem die Anwendung als Umgebung gespeichert wurde, sehen Sie sich [Multiple Environment Management] (./operations/multi-environment.md) an, um die aktuelle Umgebung zu bestätigen, die Umgebung zu wechseln und den Status zu überprüfen.
3. Weitere Informationen zum täglichen Starten, Stoppen, Protokollieren und Aktualisieren finden Sie unter [Anwendung verwalten](./operations/manage-app.md).
4. Bevor Sie Upgrades, Migrationen oder wichtige Änderungen durchführen, lesen Sie [Sichern und Wiederherstellen](./operations/backup-restore.md).
5. Wenn Sie bereit sind, offiziell online zu gehen, geben Sie [Übersicht über die Bereitstellung der Produktionsumgebung] (./produktion/index.md) ein.

Die ersten drei Schritte decken die meisten Nutzungsszenarien ab.

## Schnellindex

| Ich möchte... | Wo suchen |
| --- | --- |
| Es gibt noch keine Anwendung, installieren Sie zunächst eine neue NocoBase und speichern Sie diese als CLI env | [Mit CLI installieren (empfohlen)](./installation/cli.md) |
| Sie haben bereits eine laufende NocoBase und möchten auf die CLI-Verwaltung zugreifen | [Mit CLI installieren (empfohlen)](./installation/cli.md) |
| Alte Installationsmethoden nach und nach auf CLI migrieren | [Von alten Installationsmethoden zur CLI migrieren](./installation/migration.md) |
| Sehen Sie, welche Umgebungen lokal gespeichert sind, wechseln Sie die aktuelle Umgebung und prüfen Sie den Status | [Verwaltung mehrerer Umgebungen](./operations/multi-environment.md) |
| Starten, stoppen, starten Sie die Anwendung neu, zeigen Sie Protokolle an oder setzen Sie das Upgrade fort | [Anwendung verwalten](./operations/manage-app.md) |
| Erstellen Sie ein Backup, bevor Sie Daten aktualisieren, migrieren oder stapelweise ändern, und stellen Sie sie dann bei Bedarf wieder her | [Sichern und Wiederherstellen](./operations/backup-restore.md) |
| Bestätigen Sie zunächst die wichtigsten Umgebungsvariablen, die zum Ausführen der Anwendung erforderlich sind | [Anwendungsumgebungsvariablen](./installation/env.md) |
| Plug-Ins von Drittanbietern installieren | [Installation und Aktualisierung von Plug-Ins von Drittanbietern](./plugins/third-party.md) |
| Lassen Sie die Anwendung in die Produktionsumgebung gelangen: automatischer Start, stabiler externer Zugriff, Reverse-Proxy | [Überblick über die Bereitstellung der Produktionsumgebung](./produktion/index.md) |

## Wann Sie sich die Befehlsreferenz ansehen sollten

Dieser Satz von Schnellstartdokumenten dient eher der Frage, was ich jetzt tun möchte. Wenn Sie bereits wissen, welchen Befehl Sie ausführen möchten, und weiterhin die vollständigen Parameter sehen möchten, gehen Sie einfach zu [NocoBase CLI Command Reference](../api/cli/index.md).

Die Standardvorschläge sind:

- Nutzen Sie zunächst das Quick-Start-Dokument, um sich einen Überblick über den Weg zu verschaffen
- Überprüfen Sie dann die Parameterdetails auf der jeweiligen Befehlsseite

Dies erleichtert den Einstieg, als den kompletten Befehlsbaum auf den ersten Blick zu lesen.
