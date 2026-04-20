:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/form).
:::

# ctx.form

Die Ant Design Form-Instanz innerhalb des aktuellen Blocks, die zum Lesen und Schreiben von Formularfeldern sowie zum Auslösen von Validierungen und Übermittlungen verwendet wird. Sie entspricht `ctx.blockModel?.form` und kann direkt in Formular-Blöcken (Formular, Bearbeitungsformular, Unterformular usw.) verwendet werden.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSField** | Lesen/Schreiben anderer Formularfelder zur Implementierung von Verknüpfungen oder zur Durchführung von Berechnungen und Validierungen basierend auf anderen Feldwerten. |
| **JSItem** | Lesen/Schreiben von Feldern in derselben Zeile oder anderen Feldern innerhalb von Untertabellen-Elementen, um Verknüpfungen innerhalb der Tabelle zu realisieren. |
| **JSColumn** | Lesen der aktuellen Zeile oder von assoziierten Feldwerten in einer Tabellenspalte für das Rendering. |
| **Formular-Aktionen / Workflow** | Validierung vor dem Absenden, Stapelaktualisierung von Feldern, Zurücksetzen von Formularen usw. |

> Hinweis: `ctx.form` ist nur in RunJS-Kontexten verfügbar, die mit Formular-Blöcken (Formular, Bearbeitungsformular, Unterformular usw.) zusammenhängen. In Nicht-Formular-Szenarien (wie unabhängigen JS-Blöcken oder Tabellen-Blöcken) existiert es möglicherweise nicht. Es wird empfohlen, vor der Verwendung eine Null-Prüfung durchzuführen: `ctx.form?.getFieldsValue()`.

## Typdefinition

```ts
form: FormInstance<any>;
```

`FormInstance` ist der Instanztyp von Ant Design Form. Häufig verwendete Methoden sind wie folgt aufgeführt.

## Häufig verwendete Methoden

### Formularwerte lesen

```ts
// Werte der aktuell registrierten Felder lesen (standardmäßig nur gerenderte Felder)
const values = ctx.form.getFieldsValue();

// Werte aller Felder lesen (einschließlich registrierter, aber nicht gerenderter Felder, z. B. versteckte oder in eingeklappten Bereichen)
const allValues = ctx.form.getFieldsValue(true);

// Ein einzelnes Feld lesen
const email = ctx.form.getFieldValue('email');

// Verschachtelte Felder lesen (z. B. in einer Untertabelle)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Formularwerte schreiben

```ts
// Stapelaktualisierung (häufig für Verknüpfungen verwendet)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Ein einzelnes Feld aktualisieren
ctx.form.setFieldValue('remark', 'Hinweis aktualisiert');
```

### Validierung und Übermittlung

```ts
// Formularvalidierung auslösen
await ctx.form.validateFields();

// Formularübermittlung auslösen
ctx.form.submit();
```

### Zurücksetzen

```ts
// Alle Felder zurücksetzen
ctx.form.resetFields();

// Nur bestimmte Felder zurücksetzen
ctx.form.resetFields(['status', 'remark']);
```

## Beziehung zu verwandten Kontexten

### ctx.getValue / ctx.setValue

| Szenario | Empfohlene Verwendung |
|------|----------|
| **Aktuelles Feld lesen/schreiben** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Andere Felder lesen/schreiben** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Innerhalb des aktuellen JS-Feldes sollten Sie vorrangig `getValue`/`setValue` verwenden, um das Feld selbst zu lesen oder zu schreiben. Verwenden Sie `ctx.form`, wenn Sie auf andere Felder zugreifen müssen.

### ctx.blockModel

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Formularfelder lesen/schreiben** | `ctx.form` (Entspricht `ctx.blockModel?.form`, ist jedoch bequemer) |
| **Zugriff auf den übergeordneten Block** | `ctx.blockModel` (Enthält `Sammlung`, `Ressource` usw.) |

### ctx.getVar('ctx.formValues')

Formularwerte müssen über `await ctx.getVar('ctx.formValues')` abgerufen werden und werden nicht direkt als `ctx.formValues` bereitgestellt. In einem Formular-Kontext ist es vorzuziehen, `ctx.form.getFieldsValue()` zu verwenden, um die neuesten Werte in Echtzeit zu lesen.

## Hinweise

- `getFieldsValue()` gibt standardmäßig nur gerenderte Felder zurück. Um nicht gerenderte Felder einzubeziehen (z. B. in eingeklappten Bereichen oder durch bedingte Regeln ausgeblendet), übergeben Sie `true`: `getFieldsValue(true)`.
- Pfade für verschachtelte Felder wie Untertabellen sind Arrays, z. B. `['orders', 0, 'amount']`. Sie können `ctx.namePath` verwenden, um den Pfad des aktuellen Feldes zu erhalten und Pfade für andere Spalten in derselben Zeile zu konstruieren.
- `validateFields()` wirft ein Fehlerobjekt aus, das `errorFields` und andere Informationen enthält. Wenn die Validierung vor dem Absenden fehlschlägt, können Sie `ctx.exit()` verwenden, um nachfolgende Schritte abzubrechen.
- In asynchronen Szenarien wie Workflows oder Verknüpfungsregeln ist `ctx.form` möglicherweise noch nicht bereit. Es wird empfohlen, Optional Chaining oder Null-Prüfungen zu verwenden.

## Beispiele

### Feldverknüpfung: Unterschiedliche Inhalte basierend auf dem Typ anzeigen

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Aktuelles Feld basierend auf anderen Feldern berechnen

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Andere Spalten in derselben Zeile innerhalb einer Untertabelle lesen/schreiben

```ts
// ctx.namePath ist der Pfad des aktuellen Feldes im Formular, z. B. ['orders', 0, 'amount']
// 'status' in derselben Zeile lesen: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validierung vor dem Absenden

```ts
try {
  await ctx.form.validateFields();
  // Validierung erfolgreich, mit der Übermittlungslogik fortfahren
} catch (e) {
  ctx.message.error('Bitte überprüfen Sie die Formularfelder');
  ctx.exit();
}
```

### Absenden nach Bestätigung

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Übermittlung bestätigen',
  content: 'Nach dem Absenden können keine Änderungen mehr vorgenommen werden. Fortfahren?',
  okText: 'Bestätigen',
  cancelText: 'Abbrechen',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Beenden, wenn der Benutzer abbricht
}
```

## Verwandte Themen

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Aktuellen Feldwert lesen und schreiben.
- [ctx.blockModel](./block-model.md): Übergeordnetes Block-Modell; `ctx.form` entspricht `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Bestätigungsdialoge, oft zusammen mit `ctx.form.validateFields()` und `ctx.form.submit()` verwendet.
- [ctx.exit()](./exit.md): Beendet den Prozess bei Validierungsfehlern oder Benutzerabbruch.
- `ctx.namePath`: Der Pfad (Array) des aktuellen Feldes im Formular, der zur Konstruktion von Namen für `getFieldValue` / `setFieldValue` in verschachtelten Feldern verwendet wird.