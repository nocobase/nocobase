:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/on).
:::

# ctx.on()

Abonnieren Sie Kontext-Ereignisse (wie Änderungen von Feldwerten, Eigenschaftsänderungen, Ressourcen-Aktualisierungen usw.) in RunJS. Ereignisse werden basierend auf ihrem Typ auf benutzerdefinierte DOM-Ereignisse an `ctx.element` oder interne Ereignisbus-Ereignisse von `ctx.resource` abgebildet.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSField / JSEditableField** | Überwachen Sie Änderungen von Feldwerten aus externen Quellen (Formulare, Verknüpfungen usw.), um die Benutzeroberfläche synchron zu aktualisieren und eine bidirektionale Bindung zu erreichen. |
| **JSBlock / JSItem / JSColumn** | Überwachen Sie benutzerdefinierte Ereignisse auf dem Container, um auf Daten- oder Statusänderungen zu reagieren. |
| **resource-bezogen** | Überwachen Sie Lebenszyklus-Ereignisse von Ressourcen wie Aktualisierungen oder Speichervorgänge, um Logik nach Datenaktualisierungen auszuführen. |

## Typdefinition

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Häufige Ereignisse

| Ereignisname | Beschreibung | Ereignisquelle |
|--------|------|----------|
| `js-field:value-change` | Feldwert wurde extern geändert (z. B. Formularverknüpfung, Aktualisierung von Standardwerten) | CustomEvent an `ctx.element`, wobei `ev.detail` der neue Wert ist |
| `resource:refresh` | Ressourcendaten wurden aktualisiert | `ctx.resource` Ereignisbus |
| `resource:saved` | Speichern der Ressource abgeschlossen | `ctx.resource` Ereignisbus |

> Regeln für die Ereigniszuordnung: Ereignisse mit dem Präfix `resource:` werden über `ctx.resource.on` verarbeitet, während andere in der Regel über DOM-Ereignisse an `ctx.element` (falls vorhanden) laufen.

## Beispiele

### Bidirektionale Bindung von Feldern (React useEffect + Bereinigung)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Natives DOM-Listening (Alternative, wenn ctx.on nicht verfügbar ist)

```ts
// Wenn ctx.on nicht bereitgestellt wird, kann ctx.element direkt verwendet werden
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Bei der Bereinigung: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Benutzeroberfläche nach Ressourcen-Aktualisierung aktualisieren

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Rendering basierend auf Daten aktualisieren
});
```

## Zusammenspiel mit ctx.off

- Mit `ctx.on` registrierte Listener sollten zum geeigneten Zeitpunkt über [ctx.off](./off.md) entfernt werden, um Speicherlecks oder doppelte Auslösungen zu vermeiden.
- In React wird `ctx.off` normalerweise innerhalb der Bereinigungsfunktion von `useEffect` aufgerufen.
- `ctx.off` existiert möglicherweise nicht; es wird empfohlen, Optional Chaining zu verwenden: `ctx.off?.('eventName', handler)`.

## Hinweise

1. **Paarweise Aufhebung**: Jedem `ctx.on(eventName, handler)` sollte ein entsprechendes `ctx.off(eventName, handler)` gegenüberstehen, wobei die übergebene `handler`-Referenz identisch sein muss.
2. **Lebenszyklus**: Entfernen Sie Listener, bevor die Komponente unmountet oder der Kontext zerstört wird, um Speicherlecks zu verhindern.
3. **Verfügbarkeit von Ereignissen**: Verschiedene Kontexttypen unterstützen unterschiedliche Ereignisse. Weitere Informationen finden Sie in der jeweiligen Komponentendokumentation.

## Verwandte Dokumentation

- [ctx.off](./off.md) – Ereignis-Listener entfernen
- [ctx.element](./element.md) – Rendering-Container und DOM-Ereignisse
- [ctx.resource](./resource.md) – Ressourcen-Instanz und deren `on`/`off`
- [ctx.setValue](./set-value.md) – Feldwert setzen (löst `js-field:value-change` aus)