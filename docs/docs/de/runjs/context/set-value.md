:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/set-value).
:::

# ctx.setValue()

Setzt den Wert des aktuellen Feldes in Szenarien mit bearbeitbaren Feldern wie JSField und JSItem. In Kombination mit `ctx.getValue()` ermöglicht dies eine bidirektionale Bindung mit dem Formular.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSField** | Schreiben von benutzerdefinierten oder berechneten Werten in bearbeitbare benutzerdefinierte Felder. |
| **JSItem** | Aktualisieren des aktuellen Zellenwerts in bearbeitbaren Elementen von Tabellen oder Untertabellen. |
| **JSColumn** | Aktualisieren des Feldwerts der entsprechenden Zeile basierend auf Logik während des Renderns der Tabellenspalte. |

> **Hinweis**: `ctx.setValue(v)` ist nur in RunJS-Kontexten mit Formularbindung verfügbar. In Szenarien ohne Feldbindung, wie z. B. Workflows, Verknüpfungsregeln oder JSBlock, ist diese Methode nicht vorhanden. Es wird empfohlen, vor der Verwendung die optionale Verkettung (Optional Chaining) zu nutzen: `ctx.setValue?.(value)`.

## Typdefinition

```ts
setValue<T = any>(value: T): void;
```

- **Parameter**: `value` ist der zu schreibende Feldwert. Der Typ wird durch den Formularelement-Typ des Feldes bestimmt.

## Verhalten

- `ctx.setValue(v)` aktualisiert den Wert des aktuellen Feldes im Ant Design Formular und löst die zugehörige Formularverknüpfungs- und Validierungslogik aus.
- Wenn das Formular noch nicht vollständig gerendert oder das Feld nicht registriert ist, kann der Aufruf wirkungslos sein. Es wird empfohlen, `ctx.getValue()` zu verwenden, um das Ergebnis des Schreibvorgangs zu bestätigen.

## Beispiele

### Bidirektionale Bindung mit getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Standardwerte basierend auf Bedingungen setzen

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Rückschreiben in das aktuelle Feld bei Verknüpfung mit anderen Feldern

```ts
// Synchronisiertes Aktualisieren des aktuellen Feldes, wenn sich ein anderes Feld ändert
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Benutzerdefiniert', value: 'custom' });
}
```

## Hinweise

- In nicht bearbeitbaren Feldern (z. B. JSField im Detailmodus, JSBlock) kann `ctx.setValue` den Wert `undefined` haben. Verwenden Sie `ctx.setValue?.(value)`, um Fehler zu vermeiden.
- Beim Setzen von Werten für Verknüpfungsfelder (M2O, O2M usw.) müssen Sie eine Struktur übergeben, die dem Feldtyp entspricht (z. B. `{ id, [titleField]: label }`), abhängig von der spezifischen Feldkonfiguration.

## Verwandte Themen

- [ctx.getValue()](./get-value.md) – Holt den aktuellen Feldwert, wird zusammen mit setValue für die bidirektionale Bindung verwendet.
- [ctx.form](./form.md) – Ant Design Form Instanz, zum Lesen oder Schreiben anderer Felder.
- `js-field:value-change` – Ein Container-Ereignis, das ausgelöst wird, wenn sich ein externer Wert ändert, um die Anzeige zu aktualisieren.