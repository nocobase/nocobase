:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/message).
:::

# ctx.message

Ant Design globale message API, zur Anzeige von temporären Kurzhinweisen in der oberen Mitte der Seite. Nachrichten werden nach einer bestimmten Zeit automatisch geschlossen oder können manuell vom Benutzer geschlossen werden.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback zu Operationen, Validierungshinweise, Kopiererfolg und andere Kurzhinweise |
| **Formularoperationen / Workflow** | Feedback für erfolgreiches Absenden, Speicherfehler, fehlgeschlagene Validierung usw. |
| **Aktionsereignisse (JSAction)** | Sofortiges Feedback für Klicks, Abschluss von Stapelverarbeitungen usw. |

## Typdefinition

```ts
message: MessageInstance;
```

`MessageInstance` ist die Ant Design message-Schnittstelle, die die folgenden Methoden bereitstellt.

## Häufige Methoden

| Methode | Beschreibung |
|------|------|
| `success(content, duration?)` | Zeigt einen Erfolgshinweis an |
| `error(content, duration?)` | Zeigt einen Fehlerhinweis an |
| `warning(content, duration?)` | Zeigt einen Warnhinweis an |
| `info(content, duration?)` | Zeigt einen Informationshinweis an |
| `loading(content, duration?)` | Zeigt einen Ladehinweis an (muss manuell geschlossen werden) |
| `open(config)` | Öffnet eine Nachricht mit benutzerdefinierter Konfiguration |
| `destroy()` | Schließt alle aktuell angezeigten Nachrichten |

**Parameter:**

- `content` (`string` \| `ConfigOptions`): Nachrichtentext oder Konfigurationsobjekt
- `duration` (`number`, optional): Verzögerung für automatisches Schließen (Sekunden), Standard ist 3 Sekunden; der Wert 0 bedeutet kein automatisches Schließen

**ConfigOptions** (wenn `content` ein Objekt ist):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Nachrichtentext
  duration?: number;        // Verzögerung für automatisches Schließen (Sekunden)
  onClose?: () => void;    // Callback beim Schließen
  icon?: React.ReactNode;  // Benutzerdefiniertes Symbol
}
```

## Beispiele

### Grundlegende Verwendung

```ts
ctx.message.success('Operation erfolgreich');
ctx.message.error('Operation fehlgeschlagen');
ctx.message.warning('Bitte wählen Sie zuerst Daten aus');
ctx.message.info('Wird verarbeitet...');
```

### Internationalisierung mit ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading und manuelles Schließen

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Asynchrone Operation ausführen
await saveData();
hide();  // Ladehinweis manuell schließen
ctx.message.success(ctx.t('Saved'));
```

### Benutzerdefinierte Konfiguration mit open

```ts
ctx.message.open({
  type: 'success',
  content: 'Benutzerdefinierter Erfolgshinweis',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Alle Nachrichten schließen

```ts
ctx.message.destroy();
```

## Unterschied zwischen ctx.message und ctx.notification

| Merkmal | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Obere Mitte der Seite | Rechte obere Ecke |
| **Zweck** | Temporärer Kurzhinweis, verschwindet automatisch | Benachrichtigungs-Panel, kann Titel und Beschreibung enthalten, geeignet für längere Anzeige |
| **Typische Szenarien** | Feedback zu Operationen, Validierungshinweise, Kopiererfolg | Benachrichtigungen über Aufgabenabschluss, Systemnachrichten, längere Inhalte, die Aufmerksamkeit erfordern |

## Verwandte Themen

- [ctx.notification](./notification.md) - Benachrichtigungen oben rechts, geeignet für längere Anzeigedauer
- [ctx.modal](./modal.md) - Modal-Bestätigung, blockierende Interaktion
- [ctx.t()](./t.md) - Internationalisierung, wird häufig zusammen mit message verwendet