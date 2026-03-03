:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/exit).
:::

# ctx.exit()

Beendet die Ausführung des aktuellen Ereignisflusses; nachfolgende Schritte werden nicht ausgeführt. Dies wird häufig verwendet, wenn Geschäftsbedingungen nicht erfüllt sind, der Benutzer den Vorgang abbricht oder ein nicht behebbarer Fehler auftritt.

## Anwendungsbereiche

`ctx.exit()` wird im Allgemeinen in den folgenden Kontexten verwendet, in denen JS ausgeführt werden kann:

| Szenario | Beschreibung |
|------|------|
| **Ereignisfluss** | In Ereignisflüssen, die durch Formularübermittlungen, Schaltflächenklicks usw. ausgelöst werden, werden nachfolgende Schritte beendet, wenn Bedingungen nicht erfüllt sind. |
| **Verknüpfungsregeln** | In Feldverknüpfungen, Filterverknüpfungen usw. wird der aktuelle Ereignisfluss beendet, wenn die Validierung fehlschlägt oder die Ausführung übersprungen werden muss. |
| **Aktionsereignisse** | In benutzerdefinierten Aktionen (z. B. Löschbestätigung, Validierung vor dem Speichern) wird die Ausführung beendet, wenn der Benutzer abbricht oder die Validierung fehlschlägt. |

> Unterschied zu `ctx.exitAll()`: `ctx.exit()` beendet nur den aktuellen Ereignisfluss; andere Ereignisflüsse unter demselben Ereignis sind nicht betroffen. `ctx.exitAll()` beendet sowohl den aktuellen Ereignisfluss als auch alle noch nicht ausgeführten nachfolgenden Ereignisflüsse unter demselben Ereignis.

## Typdefinition

```ts
exit(): never;
```

Der Aufruf von `ctx.exit()` löst eine interne `FlowExitException` aus, die von der FlowEngine abgefangen wird, um die Ausführung des aktuellen Ereignisflusses zu stoppen. Sobald die Funktion aufgerufen wurde, werden die verbleibenden Anweisungen im aktuellen JS-Code nicht mehr ausgeführt.

## Vergleich mit ctx.exitAll()

| Methode | Wirkungsbereich |
|------|----------|
| `ctx.exit()` | Beendet nur den aktuellen Ereignisfluss; nachfolgende Ereignisflüsse bleiben unberührt. |
| `ctx.exitAll()` | Beendet den aktuellen Ereignisfluss und bricht nachfolgende Ereignisflüsse unter demselben Ereignis ab, die auf **sequenzielle Ausführung** eingestellt sind. |

## Beispiele

### Beenden bei Benutzerabbruch

```ts
// In einem Bestätigungs-Modal: Beendet den Ereignisfluss, wenn der Benutzer auf Abbrechen klickt
if (!confirmed) {
  ctx.message.info('Vorgang abgebrochen');
  ctx.exit();
}
```

### Beenden bei fehlgeschlagener Parametervalidierung

```ts
// Hinweis ausgeben und beenden, wenn die Validierung fehlschlägt
if (!params.value || params.value.length < 3) {
  ctx.message.error('Ungültige Parameter, die Länge muss mindestens 3 betragen');
  ctx.exit();
}
```

### Beenden, wenn Geschäftsbedingungen nicht erfüllt sind

```ts
// Beenden, wenn Bedingungen nicht erfüllt sind; nachfolgende Schritte werden nicht ausgeführt
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Nur Entwürfe können übermittelt werden' });
  ctx.exit();
}
```

### Wahl zwischen ctx.exit() und ctx.exitAll()

```ts
// Nur der aktuelle Ereignisfluss soll beendet werden → ctx.exit() verwenden
if (!params.valid) {
  ctx.message.error('Ungültige Parameter');
  ctx.exit();  // Andere Ereignisflüsse bleiben unberührt
}

// Alle nachfolgenden Ereignisflüsse unter dem aktuellen Ereignis müssen beendet werden → ctx.exitAll() verwenden
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Unzureichende Berechtigungen' });
  ctx.exitAll();  // Sowohl der aktuelle Ereignisfluss als auch nachfolgende Ereignisflüsse unter demselben Ereignis werden beendet
}
```

### Beenden basierend auf der Benutzerauswahl nach Modal-Bestätigung

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Löschen bestätigen',
  content: 'Diese Aktion kann nicht rückgängig gemacht werden. Möchten Sie fortfahren?',
});
if (!ok) {
  ctx.message.info('Abgebrochen');
  ctx.exit();
}
```

## Hinweise

- Nach dem Aufruf von `ctx.exit()` wird der nachfolgende Code im aktuellen JS nicht ausgeführt. Es wird empfohlen, dem Benutzer den Grund vor dem Aufruf über `ctx.message`, `ctx.notification` oder ein Modal zu erklären.
- In der Regel ist es nicht erforderlich, die `FlowExitException` im Geschäftscode abzufangen; überlassen Sie dies der FlowEngine.
- Wenn Sie alle nachfolgenden Ereignisflüsse unter dem aktuellen Ereignis beenden müssen, verwenden Sie `ctx.exitAll()`.

## Verwandte Themen

- [ctx.exitAll()](./exit-all.md): Beendet den aktuellen Ereignisfluss und nachfolgende Ereignisflüsse unter demselben Ereignis.
- [ctx.message](./message.md): Nachrichtenhinweise.
- [ctx.modal](./modal.md): Bestätigungs-Modals.