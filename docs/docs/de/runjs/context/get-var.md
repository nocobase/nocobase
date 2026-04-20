:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/get-var).
:::

# ctx.getVar()

Liest Variablenwerte **asynchron** aus dem aktuellen Laufzeitkontext. Die Variablenauflösung entspricht `{{ctx.xxx}}` in SQL und Vorlagen und stammt normalerweise vom aktuellen Benutzer, dem aktuellen Datensatz, Ansichtsparametern, dem Popup-Kontext usw.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField** | Abrufen von Informationen über den aktuellen Datensatz, Benutzer, Ressourcen usw. für das Rendering oder die Logik. |
| **Verknüpfungsregeln / Workflow** | Lesen von `ctx.record`, `ctx.formValues` usw. für Bedingungsprüfungen. |
| **Formeln / Vorlagen** | Verwendet dieselben Regeln zur Variablenauflösung wie `{{ctx.xxx}}`. |

## Typdefinition

```ts
getVar(path: string): Promise<any>;
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `path` | `string` | Variablenpfad; **muss mit `ctx.` beginnen**. Unterstützt Punktnotation und Array-Indizes. |

**Rückgabewert**: `Promise<any>`. Verwenden Sie `await`, um den aufgelösten Wert zu erhalten; gibt `undefined` zurück, wenn die Variable nicht existiert.

> Wenn ein Pfad übergeben wird, der nicht mit `ctx.` beginnt, wird ein Fehler ausgelöst: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Häufige Variablenpfade

| Pfad | Beschreibung |
|------|------|
| `ctx.record` | Aktueller Datensatz (verfügbar, wenn ein Formular-/Detail-Block an einen Datensatz gebunden ist) |
| `ctx.record.id` | Primärschlüssel des aktuellen Datensatzes |
| `ctx.formValues` | Aktuelle Formularwerte (häufig in Verknüpfungsregeln und Workflows verwendet; in Formularszenarien wird `ctx.form.getFieldsValue()` für das Echtzeit-Lesen bevorzugt) |
| `ctx.user` | Aktuell angemeldeter Benutzer |
| `ctx.user.id` | ID des aktuellen Benutzers |
| `ctx.user.nickname` | Spitzname des aktuellen Benutzers |
| `ctx.user.roles.name` | Rollennamen des aktuellen Benutzers (Array) |
| `ctx.popup.record` | Datensatz innerhalb eines Popups |
| `ctx.popup.record.id` | Primärschlüssel des Datensatzes innerhalb eines Popups |
| `ctx.urlSearchParams` | URL-Abfrageparameter (aus `?key=value` analysiert) |
| `ctx.token` | Aktueller API-Token |
| `ctx.role` | Aktuelle Rolle |

## ctx.getVarInfos()

Ruft die **Strukturinformationen** (Typ, Titel, Untereigenschaften usw.) der auflösbaren Variablen im aktuellen Kontext ab, um das Erkunden verfügbarer Pfade zu erleichtern. Der Rückgabewert ist eine statische Beschreibung basierend auf `meta` und enthält keine tatsächlichen Laufzeitwerte.

### Typdefinition

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

Im Rückgabewert ist jeder Schlüssel ein Variablenpfad und der Wert die Strukturinformation für diesen Pfad (einschließlich `type`, `title`, `properties` usw.).

### Parameter

| Parameter | Typ | Beschreibung |
|------|------|------|
| `path` | `string \| string[]` | Pfad zum Zuschneiden; sammelt nur die Variablenstruktur unter diesem Pfad. Unterstützt `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; ein Array steht für das Zusammenführen mehrerer Pfade. |
| `maxDepth` | `number` | Maximale Erweiterungstiefe, Standardwert ist `3`. Wenn kein Pfad angegeben wird, haben Eigenschaften der obersten Ebene `depth=1`. Wenn ein Pfad angegeben wird, hat der entsprechende Knoten `depth=1`. |

### Beispiel

```ts
// Variablenstruktur unter record abrufen (bis zu 3 Ebenen erweitert)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Struktur von popup.record abrufen
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Vollständige Variablenstruktur der obersten Ebene abrufen (Standard maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Unterschied zu ctx.getValue

| Methode | Szenario | Beschreibung |
|------|----------|------|
| `ctx.getValue()` | Editierbare Felder wie JSField oder JSItem | Synchrones Abrufen des Wertes des **aktuellen Feldes**; erfordert eine Formularbindung. |
| `ctx.getVar(path)` | Beliebiger RunJS-Kontext | Asynchrones Abrufen **jeder ctx-Variable**; der Pfad muss mit `ctx.` beginnen. |

In einem JSField verwenden Sie `getValue`/`setValue`, um das aktuelle Feld zu lesen oder zu schreiben; verwenden Sie `getVar`, um auf andere Kontextvariablen zuzugreifen (wie `record`, `user`, `formValues`).

## Hinweise

- **Pfad muss mit `ctx.` beginnen**: z. B. `ctx.record.id`, andernfalls wird ein Fehler ausgelöst.
- **Asynchrone Methode**: Sie müssen `await` verwenden, um das Ergebnis zu erhalten, z. B. `const id = await ctx.getVar('ctx.record.id')`.
- **Variable existiert nicht**: Gibt `undefined` zurück. Sie können `??` nach dem Ergebnis verwenden, um einen Standardwert festzulegen: `(await ctx.getVar('ctx.user.nickname')) ?? 'Gast'`.
- **Formularwerte**: `ctx.formValues` muss über `await ctx.getVar('ctx.formValues')` abgerufen werden; es wird nicht direkt als `ctx.formValues` bereitgestellt. Verwenden Sie im Formularkontext vorzugsweise `ctx.form.getFieldsValue()`, um die neuesten Werte in Echtzeit zu lesen.

## Beispiele

### Aktuelle Datensatz-ID abrufen

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Aktueller Datensatz: ${recordId}`);
}
```

### Datensatz innerhalb eines Popups abrufen

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Aktueller Datensatz im Popup: ${recordId}`);
}
```

### Unterelemente eines Array-Feldes lesen

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Gibt ein Array von Rollennamen zurück, z. B. ['admin', 'member']
```

### Standardwert festlegen

```ts
// getVar hat keinen defaultValue-Parameter; verwenden Sie ?? nach dem Ergebnis
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Gast';
```

### Formularfeldwerte lesen

```ts
// Sowohl ctx.formValues als auch ctx.form sind für Formularszenarien; verwenden Sie getVar, um verschachtelte Felder zu lesen
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL-Abfrageparameter lesen

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Entspricht ?id=xxx
```

### Verfügbare Variablen erkunden

```ts
// Variablenstruktur unter record abrufen (bis zu 3 Ebenen erweitert)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars sieht etwa so aus: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Verwandte Themen

- [ctx.getValue()](./get-value.md) – Synchrones Abrufen des aktuellen Feldwerts (nur JSField/JSItem usw.)
- [ctx.form](./form.md) – Formularinstanz, `ctx.form.getFieldsValue()` kann Formularwerte in Echtzeit lesen
- [ctx.model](./model.md) – Das Modell, in dem sich der aktuelle Ausführungskontext befindet
- [ctx.blockModel](./block-model.md) – Der übergeordnete Block, in dem sich das aktuelle JS befindet
- [ctx.resource](./resource.md) – Die Ressourceninstanz im aktuellen Kontext
- `{{ctx.xxx}}` in SQL / Vorlagen – Verwendet dieselben Auflösungsregeln wie `ctx.getVar('ctx.xxx')`