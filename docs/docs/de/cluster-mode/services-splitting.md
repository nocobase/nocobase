:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Dienstaufteilung <Badge>v1.9.0+</Badge>

## Einführung

Normalerweise laufen alle Dienste einer NocoBase-Anwendung in derselben Node.js-Instanz. Wenn die Funktionalität innerhalb der Anwendung mit zunehmendem Geschäftsumfang komplexer wird, können einige zeitintensive Dienste die Gesamtleistung beeinträchtigen.

Um die Anwendungsleistung zu verbessern, unterstützt NocoBase im Cluster-Modus die Aufteilung der Anwendungsdienste auf verschiedene Knoten, um dort ausgeführt zu werden. Dies verhindert, dass Leistungsprobleme eines einzelnen Dienstes die gesamte Anwendung beeinträchtigen und somit die normale Beantwortung von Benutzeranfragen verhindert wird.

Andererseits ermöglicht es auch, bestimmte Dienste gezielt horizontal zu skalieren und so die Ressourcenauslastung des Clusters zu verbessern.

Bei der Cluster-Bereitstellung von NocoBase können verschiedene Dienste aufgeteilt und auf unterschiedlichen Knoten ausgeführt werden. Die folgende Abbildung zeigt die Struktur der Aufteilung:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Welche Dienste können aufgeteilt werden?

### Asynchrone Workflows

**Dienst-KEY**: `workflow:process`

Workflows im asynchronen Modus werden nach dem Auslösen in eine Warteschlange gestellt und dort ausgeführt. Diese Workflows können als Hintergrundaufgaben betrachtet werden und erfordern in der Regel nicht, dass Benutzer auf die Rückgabe eines Ergebnisses warten. Insbesondere bei komplexen und zeitaufwändigen Prozessen und einem hohen Auslösevolumen wird empfohlen, diese auf unabhängige Knoten aufzuteilen und dort auszuführen.

### Andere asynchrone Aufgaben auf Benutzerebene

**Dienst-KEY**: `async-task:process`

Dazu gehören Aufgaben, die durch Benutzeraktionen wie asynchronen Import und Export erstellt werden. Bei großen Datenmengen oder hoher Parallelität wird empfohlen, diese auf unabhängige Knoten aufzuteilen und dort auszuführen.

## Wie Dienste aufgeteilt werden

Die Aufteilung verschiedener Dienste auf unterschiedliche Knoten wird durch die Konfiguration der Umgebungsvariable `WORKER_MODE` erreicht. Diese Umgebungsvariable kann gemäß den folgenden Regeln konfiguriert werden:

- `WORKER_MODE=<leer>`: Wenn nicht konfiguriert oder leer, ist der Worker-Modus identisch mit dem aktuellen Einzelinstanz-Modus; er empfängt alle Anfragen und verarbeitet alle Aufgaben. Dies ist kompatibel mit zuvor nicht konfigurierten Anwendungen.
- `WORKER_MODE=!` Der Worker-Modus verarbeitet nur Anfragen und keine Aufgaben.
- `WORKER_MODE=workflow:process,async-task:process`: Konfiguriert mit einem oder mehreren Dienst-Identifikatoren (durch Kommas getrennt), ist der Worker-Modus so eingestellt, dass er nur Aufgaben für diese Identifikatoren verarbeitet und keine Anfragen verarbeitet.
- `WORKER_MODE=*`: Der Worker-Modus verarbeitet alle Hintergrundaufgaben, unabhängig vom Modul, verarbeitet aber keine Anfragen.
- `WORKER_MODE=!,workflow:process`: Der Worker-Modus verarbeitet Anfragen und verarbeitet gleichzeitig Aufgaben für einen bestimmten Identifikator.
- `WORKER_MODE=-`: Der Worker-Modus verarbeitet keine Anfragen und Aufgaben (dieser Modus wird innerhalb des Worker-Prozesses benötigt).

Zum Beispiel in einer K8S-Umgebung können Knoten mit derselben Aufteilungsfunktionalität dieselbe Umgebungsvariablenkonfiguration verwenden, was die horizontale Skalierung eines bestimmten Diensttyps erleichtert.

## Konfigurationsbeispiele

### Mehrere Knoten mit separater Verarbeitung

Angenommen, es gibt drei Knoten, nämlich `node1`, `node2` und `node3`. Diese können wie folgt konfiguriert werden:

- `node1`: Verarbeitet nur Benutzer-UI-Anfragen, konfigurieren Sie `WORKER_MODE=!`.
- `node2`: Verarbeitet nur Workflow-Aufgaben, konfigurieren Sie `WORKER_MODE=workflow:process`.
- `node3`: Verarbeitet nur asynchrone Aufgaben, konfigurieren Sie `WORKER_MODE=async-task:process`.

### Mehrere Knoten mit gemischter Verarbeitung

Angenommen, es gibt vier Knoten, nämlich `node1`, `node2`, `node3` und `node4`. Diese können wie folgt konfiguriert werden:

- `node1` und `node2`: Verarbeiten alle regulären Anfragen, konfigurieren Sie `WORKER_MODE=!`, und ein Load Balancer verteilt die Anfragen automatisch auf diese beiden Knoten.
- `node3` und `node4`: Verarbeiten alle anderen Hintergrundaufgaben, konfigurieren Sie `WORKER_MODE=*`.

## Entwicklerreferenz

Beim Entwickeln von Geschäfts-Plugins können Sie ressourcenintensive Dienste je nach Anforderungsszenario aufteilen. Dies kann auf folgende Weisen erreicht werden:

1. Definieren Sie einen neuen Dienst-Identifikator, zum Beispiel `my-plugin:process`, für die Umgebungsvariablenkonfiguration und stellen Sie eine Dokumentation dazu bereit.
2. In der Geschäftslogik des serverseitigen Plugins verwenden Sie die `app.serving()`-Schnittstelle, um die Umgebung zu prüfen und zu entscheiden, ob der aktuelle Knoten einen bestimmten Dienst basierend auf der Umgebungsvariable bereitstellen soll.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Im serverseitigen Code des Plugins
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Verarbeiten Sie die Geschäftslogik für diesen Dienst
} else {
  // Verarbeiten Sie die Geschäftslogik für diesen Dienst nicht
}
```