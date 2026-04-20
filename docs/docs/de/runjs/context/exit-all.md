:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/exit-all).
:::

# ctx.exitAll()

Beendet den aktuellen Workflow und alle nachfolgenden Workflows, die in derselben Ereignis-Verteilung (Event Dispatch) ausgelöst wurden. Dies wird häufig verwendet, wenn aufgrund eines globalen Fehlers oder einer fehlgeschlagenen Berechtigungsprüfung alle Workflows unter dem aktuellen Ereignis sofort abgebrochen werden müssen.

## Anwendungsbereiche

`ctx.exitAll()` wird im Allgemeinen in Kontexten verwendet, in denen JavaScript ausgeführt werden kann und **gleichzeitig der aktuelle Workflow sowie alle durch dieses Ereignis ausgelösten nachfolgenden Workflows abgebrochen werden müssen**:

| Szenario | Beschreibung |
|------|------|
| **Workflow** | Die Validierung des Haupt-Workflows schlägt fehl (z. B. unzureichende Berechtigungen), was den Abbruch des Haupt-Workflows und aller noch nicht ausgeführten nachfolgenden Workflows unter demselben Ereignis erfordert. |
| **Verknüpfungsregeln** | Wenn die Validierung einer Verknüpfung fehlschlägt, müssen die aktuelle Verknüpfung und die durch dasselbe Ereignis ausgelösten nachfolgenden Verknüpfungen beendet werden. |
| **Aktionsereignisse** | Die Vorab-Validierung einer Aktion schlägt fehl (z. B. Berechtigungsprüfung vor dem Löschen), wodurch die Hauptaktion und die folgenden Schritte verhindert werden müssen. |

> Unterschied zu `ctx.exit()`: `ctx.exit()` beendet nur den aktuellen Workflow; `ctx.exitAll()` beendet den aktuellen Workflow und alle **noch nicht ausgeführten** nachfolgenden Workflows in derselben Ereignis-Verteilung.

## Typdefinition

```ts
exitAll(): never;
```

Der Aufruf von `ctx.exitAll()` wirft eine interne `FlowExitAllException` aus, die von der Workflow-Engine abgefangen wird, um die aktuelle Workflow-Instanz und nachfolgende Workflows unter demselben Ereignis zu stoppen. Sobald die Funktion aufgerufen wird, werden die verbleibenden Anweisungen im aktuellen JS-Code nicht mehr ausgeführt.

## Vergleich mit ctx.exit()

| Methode | Wirkungsbereich |
|------|----------|
| `ctx.exit()` | Beendet nur den aktuellen Workflow; nachfolgende Workflows bleiben unberührt. |
| `ctx.exitAll()` | Beendet den aktuellen Workflow und bricht nachfolgende Workflows ab, die **sequenziell** unter demselben Ereignis ausgeführt werden. |

## Erläuterung der Ausführungsmodi

- **Sequenzielle Ausführung (sequential)**: Workflows unter demselben Ereignis werden nacheinander ausgeführt. Sobald ein Workflow `ctx.exitAll()` aufruft, werden die nachfolgenden Workflows nicht mehr ausgeführt.
- **Parallele Ausführung (parallel)**: Workflows unter demselben Ereignis werden parallel ausgeführt. Der Aufruf von `ctx.exitAll()` in einem Workflow unterbricht andere bereits laufende Workflows nicht (da diese unabhängig sind).

## Beispiele

### Beenden aller Workflows bei fehlgeschlagener Berechtigungsprüfung

```ts
// Haupt-Workflow und nachfolgende Workflows abbrechen, wenn die Berechtigungen unzureichend sind
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Keine Berechtigung für diese Operation' });
  ctx.exitAll();
}
```

### Beenden bei fehlgeschlagener globaler Vorab-Validierung

```ts
// Beispiel: Wenn vor dem Löschen festgestellt wird, dass verknüpfte Daten nicht löschbar sind,
// werden der Haupt-Workflow und nachfolgende Aktionen verhindert.
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Löschen nicht möglich: Verknüpfte Daten vorhanden');
  ctx.exitAll();
}
```

### Wahl zwischen ctx.exit() und ctx.exitAll()

```ts
// Nur der aktuelle Workflow soll beendet werden -> ctx.exit() verwenden
if (!params.valid) {
  ctx.message.error('Ungültige Parameter');
  ctx.exit();  // Nachfolgende Workflows sind nicht betroffen
}

// Alle nachfolgenden Workflows unter dem aktuellen Ereignis beenden -> ctx.exitAll() verwenden
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Unzureichende Berechtigungen' });
  ctx.exitAll();  // Sowohl der Haupt-Workflow als auch nachfolgende Workflows desselben Ereignisses werden beendet
}
```

### Erst Hinweis ausgeben, dann beenden

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Bitte korrigieren Sie zuerst die Fehler im Formular');
  ctx.exitAll();
}
```

## Hinweise

- Nach dem Aufruf von `ctx.exitAll()` wird der nachfolgende Code im aktuellen JS nicht mehr ausgeführt. Es wird empfohlen, dem Benutzer den Grund vor dem Aufruf über `ctx.message`, `ctx.notification` oder ein Modal zu erklären.
- Im Business-Code ist es normalerweise nicht erforderlich, die `FlowExitAllException` abzufangen; überlassen Sie dies der Workflow-Engine.
- Wenn Sie nur den aktuellen Workflow stoppen möchten, ohne die nachfolgenden zu beeinflussen, verwenden Sie `ctx.exit()`.
- Im parallelen Modus beendet `ctx.exitAll()` nur den aktuellen Workflow und unterbricht keine anderen bereits laufenden Workflows.

## Verwandte Themen

- [ctx.exit()](./exit.md): Beendet nur den aktuellen Workflow
- [ctx.message](./message.md): Nachrichten-Hinweise
- [ctx.modal](./modal.md): Bestätigungs-Modal