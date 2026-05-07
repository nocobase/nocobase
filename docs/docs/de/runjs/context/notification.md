:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/notification).
:::

# ctx.notification

Basierend auf der Ant Design Notification ist dies eine globale Benachrichtigungs-API, die verwendet wird, um Benachrichtigungs-Panels in der **oberen rechten Ecke** der Seite anzuzeigen. Im Vergleich zu `ctx.message` können Benachrichtigungen einen Titel und eine Beschreibung enthalten, wodurch sie sich für Inhalte eignen, die über einen längeren Zeitraum angezeigt werden sollen oder die Aufmerksamkeit der Benutzer erfordern.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / Aktionsereignisse** | Benachrichtigungen über den Abschluss von Aufgaben, Ergebnisse von Stapelverarbeitungen, Abschluss von Exporten usw. |
| **Workflow (FlowEngine)** | Systemweite Warnungen nach dem Ende asynchroner Prozesse. |
| **Inhalte, die eine längere Anzeige erfordern** | Vollständige Benachrichtigungen mit Titeln, Beschreibungen und Aktionsschaltflächen. |

## Typdefinition

```ts
notification: NotificationInstance;
```

`NotificationInstance` ist das Ant Design Notification-Interface, das die folgenden Methoden bereitstellt.

## Gängige Methoden

| Methode | Beschreibung |
|------|------|
| `open(config)` | Öffnet eine Benachrichtigung mit benutzerdefinierter Konfiguration |
| `success(config)` | Zeigt eine Benachrichtigung vom Typ "Erfolg" an |
| `info(config)` | Zeigt eine Benachrichtigung vom Typ "Information" an |
| `warning(config)` | Zeigt eine Benachrichtigung vom Typ "Warnung" an |
| `error(config)` | Zeigt eine Benachrichtigung vom Typ "Fehler" an |
| `destroy(key?)` | Schließt die Benachrichtigung mit dem angegebenen Schlüssel (Key); wird kein Key übergeben, werden alle geschlossen |

**Konfigurationsparameter** (konsistent mit [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Typ | Beschreibung |
|------|------|------|
| `message` | `ReactNode` | Titel der Benachrichtigung |
| `description` | `ReactNode` | Beschreibung der Benachrichtigung |
| `duration` | `number` | Verzögerung für das automatische Schließen (Sekunden). Standard ist 4,5 Sekunden; auf 0 setzen, um das automatische Schließen zu deaktivieren |
| `key` | `string` | Eindeutige Kennung der Benachrichtigung, wird für `destroy(key)` zum Schließen einer bestimmten Benachrichtigung verwendet |
| `onClose` | `() => void` | Callback-Funktion beim Schließen |
| `placement` | `string` | Position: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Beispiele

### Grundlegende Verwendung

```ts
ctx.notification.open({
  message: 'Vorgang erfolgreich',
  description: 'Die Daten wurden auf dem Server gespeichert.',
});
```

### Schnellaufrufe nach Typ

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Benutzerdefinierte Dauer und Key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Schließt nicht automatisch
});

// Nach Abschluss der Aufgabe manuell schließen
ctx.notification.destroy('task-123');
```

### Alle Benachrichtigungen schließen

```ts
ctx.notification.destroy();
```

## Unterschied zu ctx.message

| Merkmal | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Oben in der Mitte der Seite | Obere rechte Ecke (konfigurierbar) |
| **Struktur** | Einzeiliger kurzer Hinweis | Kann Titel + Beschreibung enthalten |
| **Zweck** | Temporäres Feedback, verschwindet automatisch | Vollständigere Benachrichtigung, kann lange angezeigt werden |
| **Typische Szenarien** | Erfolg einer Operation, Validierungsfehler, Kopieren erfolgreich | Aufgabenabschluss, Systemmeldungen, längere Inhalte, die Aufmerksamkeit erfordern |

## Verwandte Themen

- [ctx.message](./message.md) - Kurzer Hinweis oben, geeignet für schnelles Feedback
- [ctx.modal](./modal.md) - Modal-Bestätigung, blockierende Interaktion
- [ctx.t()](./t.md) - Internationalisierung, wird häufig zusammen mit Benachrichtigungen verwendet