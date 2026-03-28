:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/get-value).
:::

# ctx.getValue()

In Szenarien mit bearbeitbaren Feldern wie JSField und JSItem wird diese Methode verwendet, um den aktuellen Wert des Feldes abzurufen. In Kombination mit `ctx.setValue(v)` ermöglicht sie eine bidirektionale Bindung (Two-Way Binding) mit dem Formular.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSField** | Lesen von Benutzereingaben oder des aktuellen Formularwerts in bearbeitbaren benutzerdefinierten Feldern. |
| **JSItem** | Lesen des aktuellen Zellenwerts in bearbeitbaren Elementen von Tabellen oder Untertabellen. |
| **JSColumn** | Lesen des Feldwerts der entsprechenden Zeile während des Renderings der Tabellenspalte. |

> **Hinweis**: `ctx.getValue()` ist nur in RunJS-Kontexten mit Formularbindung verfügbar. In Szenarien ohne Feldbindung, wie Workflows oder Verknüpfungsregeln, existiert diese Methode nicht.

## Typdefinition

```ts
getValue<T = any>(): T | undefined;
```

- **Rückgabewert**: Der aktuelle Feldwert, dessen Typ vom Typ des Formularelements des Feldes bestimmt wird. Er kann `undefined` sein, wenn das Feld nicht registriert oder nicht ausgefüllt ist.

## Reihenfolge der Wertermittlung

`ctx.getValue()` ruft Werte in der folgenden Reihenfolge ab:

1. **Formularstatus**: Liest vorrangig aus dem aktuellen Status des Ant Design Formulars.
2. **Fallback-Wert**: Wenn das Feld nicht im Formular vorhanden ist, wird auf den Initialwert oder die Props des Feldes zurückgegriffen.

> Wenn das Formular noch nicht vollständig gerendert oder das Feld nicht registriert ist, wird möglicherweise `undefined` zurückgegeben.

## Beispiele

### Rendering basierend auf dem aktuellen Wert

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Bitte geben Sie zuerst einen Inhalt ein</span>);
} else {
  ctx.render(<span>Aktueller Wert: {current}</span>);
}
```

### Bidirektionale Bindung mit setValue

```tsx
const { Input } = ctx.libs.antd;

// Aktuellen Wert als Standardwert lesen
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Verwandte Themen

- [ctx.setValue()](./set-value.md) – Setzt den aktuellen Feldwert, wird zusammen mit `getValue` für die bidirektionale Bindung verwendet.
- [ctx.form](./form.md) – Ant Design Form-Instanz zum Lesen und Schreiben anderer Felder.
- `js-field:value-change` – Container-Ereignis, das bei externen Wertänderungen ausgelöst wird, um die Anzeige zu aktualisieren.