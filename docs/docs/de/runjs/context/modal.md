:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/modal).
:::

# ctx.modal

Eine auf Ant Design Modal basierende Shortcut-API, die verwendet wird, um in RunJS aktiv Modal-Fenster (Informationshinweise, Bestätigungs-Popups usw.) zu öffnen. Sie wird durch `ctx.viewer` / das Ansichtssystem implementiert.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField** | Anzeige von Operationsergebnissen, Fehlermeldungen oder Zweitbestätigungen nach Benutzerinteraktionen. |
| **Workflow / Aktionsereignisse** | Popup-Bestätigung vor dem Absenden; Beenden nachfolgender Schritte über `ctx.exit()`, falls der Benutzer abbricht. |
| **Verknüpfungsregeln** | Popup-Hinweise für den Benutzer, wenn die Validierung fehlschlägt. |

> Hinweis: `ctx.modal` ist in RunJS-Umgebungen mit einem Ansichtskontext verfügbar (z. B. JS-Blöcke innerhalb einer Seite, Workflows usw.); in Backend- oder Nicht-UI-Kontexten existiert es möglicherweise nicht. Es wird empfohlen, beim Aufruf die optionale Verkettung (`ctx.modal?.confirm?.()`) zu verwenden.

## Typdefinition

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Gibt true zurück, wenn der Benutzer auf OK klickt, false beim Abbrechen
};
```

`ModalConfig` entspricht der Konfiguration der statischen Methoden von Ant Design `Modal`.

## Gängige Methoden

| Methode | Rückgabewert | Beschreibung |
|------|--------|------|
| `info(config)` | `Promise<void>` | Informationshinweis-Modal |
| `success(config)` | `Promise<void>` | Erfolgshinweis-Modal |
| `error(config)` | `Promise<void>` | Fehlermeldung-Modal |
| `warning(config)` | `Promise<void>` | Warnhinweis-Modal |
| `confirm(config)` | `Promise<boolean>` | Bestätigungs-Modal; gibt `true` zurück, wenn der Benutzer auf OK klickt, und `false`, wenn er abbricht. |

## Konfigurationsparameter

Konsistent mit Ant Design `Modal`, zu den gängigen Feldern gehören:

| Parameter | Typ | Beschreibung |
|------|------|------|
| `title` | `ReactNode` | Titel |
| `content` | `ReactNode` | Inhalt |
| `okText` | `string` | Text der Bestätigungsschaltfläche |
| `cancelText` | `string` | Text der Abbrechen-Schaltfläche (nur für `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Wird beim Klicken auf OK ausgeführt |
| `onCancel` | `() => void` | Wird beim Klicken auf Abbrechen ausgeführt |

## Beziehung zu ctx.message und ctx.openView

| Verwendungszweck | Empfohlene Nutzung |
|------|----------|
| **Leichtgewichtiger temporärer Hinweis** | `ctx.message`, verschwindet automatisch |
| **Info-/Erfolgs-/Fehler-/Warnungs-Modal** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Zweitbestätigung (erfordert Benutzerwahl)** | `ctx.modal.confirm`, zusammen mit `ctx.exit()` zur Steuerung des Ablaufs |
| **Komplexe Interaktionen wie Formulare oder Listen** | `ctx.openView` zum Öffnen einer benutzerdefinierten Ansicht (Seite/Drawer/Modal) |

## Beispiele

### Einfaches Informations-Modal

```ts
ctx.modal.info({
  title: 'Hinweis',
  content: 'Vorgang abgeschlossen',
});
```

### Bestätigungs-Modal und Ablaufsteuerung

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Löschen bestätigen',
  content: 'Sind Sie sicher, dass Sie diesen Datensatz löschen möchten?',
  okText: 'Bestätigen',
  cancelText: 'Abbrechen',
});
if (!confirmed) {
  ctx.exit();  // Beendet nachfolgende Schritte, wenn der Benutzer abbricht
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Bestätigungs-Modal mit onOk

```ts
await ctx.modal.confirm({
  title: 'Einreichung bestätigen',
  content: 'Änderungen können nach dem Absenden nicht mehr bearbeitet werden. Möchten Sie fortfahren?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Fehlermeldung

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Erfolg', content: 'Vorgang abgeschlossen' });
} catch (e) {
  ctx.modal.error({ title: 'Fehler', content: e.message });
}
```

## Verwandte Themen

- [ctx.message](./message.md): Leichtgewichtiger temporärer Hinweis, verschwindet automatisch
- [ctx.exit()](./exit.md): Wird häufig als `if (!confirmed) ctx.exit()` verwendet, um den Ablauf zu beenden, wenn ein Benutzer die Bestätigung abbricht
- [ctx.openView()](./open-view.md): Öffnet eine benutzerdefinierte Ansicht, geeignet für komplexe Interaktionen