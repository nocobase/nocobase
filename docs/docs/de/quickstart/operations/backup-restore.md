# Sichern und Wiederherstellen

Wenn Sie eine NocoBase-Anwendung als CLI-Umgebung gespeichert haben, werden die tägliche Sicherung und Wiederherstellung grundsätzlich in der Befehlsgruppe `nb backup` durchgeführt. `nb backup create` wird verwendet, um ein Backup in der Zielumgebung zu erstellen und es auf die lokale Umgebung herunterzuladen. `nb backup restore` wird verwendet, um die lokale Sicherungsdatei in der Zielumgebung wiederherzustellen.

Meistens reicht es aus, sich an den Standardratschlag zu erinnern: Sichern Sie vor dem Upgrade, der Migration oder der Stapeländerung von Daten; Führen Sie die Wiederherstellung nur durch, wenn Sie eindeutig wissen, dass Sie die aktuellen Daten überschreiben möchten.

## Schnellindex

| Ich möchte... | Welcher Befehl soll verwendet werden |
| --- | --- |
| Sichern Sie zunächst die aktuelle Umgebung auf lokal | [`nb backup create`](../../api/cli/backup/create.md) |
| Speichern Sie die Sicherung im angegebenen Verzeichnis | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Lassen Sie das Skript weiterhin die Sicherungsergebnisse verarbeiten | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Lokale Sicherung in der aktuellen Umgebung wiederherstellen | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Lokale Sicherung in einer anderen Umgebung wiederherstellen | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip Bestätigen Sie zunächst die aktuelle Umgebung

Der Befehl `nb backup` wirkt sich standardmäßig auf die aktuelle Umgebung aus. Wenn Sie mehrere Umgebungen gleichzeitig verwalten, besteht die Standardempfehlung darin, einen Blick auf die aktuelle Umgebung zu werfen, bevor Sie eine Sicherung oder Wiederherstellung durchführen.

```bash
nb env current
nb env use app1
```

Wenn Sie explizit einen anderen `--env` übergeben, fordert die CLI normalerweise eine Bestätigung an. In Skripten oder nicht interaktiven Szenarios können Sie `--yes` hinzufügen, um diesen Schritt zu überspringen.

:::

## Erstellen Sie ein Backup

Die einfachste Verwendung besteht darin, direkt ein Backup zu erstellen:

```bash
nb backup create
```

Nachdem der Befehl erfolgreich zurückgegeben wurde, wurde die Sicherungsdatei lokal heruntergeladen. Wenn `--output` weggelassen wird, speichert die CLI die Datei im aktuellen Arbeitsverzeichnis und verwendet den vom Remote-Ende zurückgegebenen Dateinamen – normalerweise `backup_*.nbdata`.

Wenn Sie die Backups in einem Verzeichnis ablegen möchten, können Sie Folgendes verwenden:

```bash
nb backup create --output ./backups
```

Wenn `./backups` bereits vorhanden ist und es sich um ein Verzeichnis handelt, hängt die CLI automatisch den Namen der Remote-Backup-Datei an das Verzeichnis an. Nur wenn der Pfad nicht existiert, behandelt die CLI ihn als Zieldateipfad.

Wenn Sie Backup-Ergebnisse weiterhin in Skripten, CI oder Agent-Links nutzen möchten, können Sie `--json-output` hinzufügen:

```bash
nb backup create --env app1 --yes --json-output
```

In diesem Modus gibt die CLI keinen Fortschrittstext mehr aus, sondern gibt direkt den endgültigen JSON zurück, der normalerweise drei Felder enthält: `env`, `name` und `output`.

## Sicherung wiederherstellen

Der Wiederherstellungsbefehl lädt die lokale Sicherungsdatei in die Zielumgebung hoch und überschreibt die aktuellen Anwendungsdaten:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Wenn Sie etwas anderes als die aktuelle Umgebung wiederherstellen möchten, ist es normalerweise sicherer, so zu schreiben:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::Warnhinweis

Bei der Wiederherstellung handelt es sich um einen Vollkasko-Vorgang. Standardmäßig wird empfohlen, vor der Wiederherstellung ein weiteres Backup der aktuellen Zielumgebung zu erstellen.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` prüft zunächst, ob der von `--file` angegebene Pfad existiert und bestätigt, dass es sich um eine normale Datei handelt. Nachdem der Upload erfolgreich war, wartet die CLI weiterhin darauf, dass die Anwendung die Integritätsprüfung erneut besteht. Wenn der Befehl also erfolgreich zurückgegeben wird, ist die Anwendung normalerweise in einem zugänglichen Zustand wiederhergestellt.

Wird `--force` nicht übergeben, fordert Sie das interaktive Terminal erneut zur Bestätigung auf. In nicht interaktiven Terminals, Skripten und AI-Agent-Sitzungen ist `--force` erforderlich.

## Häufige Situationen

Wenn Sie eher mit der Bedienung der Benutzeroberfläche vertraut sind oder Funktionen wie geplante Sicherung und Cloud-Speichersynchronisierung benötigen, können Sie direkt [Backup-Management](../../ops-management/backup-manager/index.mdx) aufrufen. In solchen Szenarien ist die Web-Benutzeroberfläche oft besser geeignet.

## Verwandte Links

- [`nb backup` Befehlsreferenz](../../api/cli/backup/index.md)
- [`nb env` Befehlsreferenz](../../api/cli/env/index.md)
- [Verwaltung mehrerer Umgebungen](./multi-environment.md)
- [Backup-Management](../../ops-management/backup-manager/index.mdx)
