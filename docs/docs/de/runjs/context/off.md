:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/off).
:::

# ctx.off()

Entfernt Ereignis-Listener, die über `ctx.on(eventName, handler)` registriert wurden. Es wird häufig in Verbindung mit [ctx.on](./on.md) verwendet, um Abonnements zum richtigen Zeitpunkt zu kündigen und so Speicherlecks oder mehrfache Auslösungen zu vermeiden.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **React useEffect Bereinigung** | Aufruf innerhalb der `useEffect`-Bereinigungsfunktion (Cleanup), um Listener zu entfernen, wenn die Komponente unmountet. |
| **JSField / JSEditableField** | Kündigen des Abonnements von `js-field:value-change` während der bidirektionalen Datenbindung für Felder. |
| **Ressourcenbezogen** | Kündigen von Abonnements für Listener wie `refresh` oder `saved`, die über `ctx.resource.on` registriert wurden. |

## Typdefinition

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Beispiele

### Paarweise Verwendung in React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Abbestellen von Ressourcen-Ereignissen

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Zum angemessenen Zeitpunkt
ctx.resource?.off('refresh', handler);
```

## Hinweise

1. **Konsistente Handler-Referenz**: Der an `ctx.off` übergebene `handler` muss dieselbe Referenz sein wie der in `ctx.on` verwendete; andernfalls kann er nicht korrekt entfernt werden.
2. **Rechtzeitige Bereinigung**: Rufen Sie `ctx.off` auf, bevor die Komponente unmountet oder der Kontext zerstört wird, um Speicherlecks zu vermeiden.

## Verwandte Dokumente

- [ctx.on](./on.md) – Ereignisse abonnieren
- [ctx.resource](./resource.md) – Ressourcen-Instanz und deren `on`/`off`-Methoden