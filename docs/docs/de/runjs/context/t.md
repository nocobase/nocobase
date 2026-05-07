:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/t).
:::

# ctx.t()

Eine i18n-Kurzfunktion in RunJS zur Übersetzung von Texten basierend auf den Spracheinstellungen des aktuellen Kontexts. Sie eignet sich für die Internationalisierung von Inline-Texten wie Schaltflächen, Titeln und Hinweisen.

## Anwendungsbereiche

`ctx.t()` kann in allen RunJS-Ausführungsumgebungen verwendet werden.

## Typdefinition

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameter

| Parameter | Typ | Beschreibung |
|-----------|------|-------------|
| `key` | `string` | Übersetzungsschlüssel oder Vorlage mit Platzhaltern (z. B. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Optional. Interpolationsvariablen (z. B. `{ name: 'Max', count: 5 }`) oder i18n-Optionen (z. B. `defaultValue`, `ns`). |

## Rückgabewert

- Gibt die übersetzte Zeichenfolge zurück. Wenn für den Schlüssel keine Übersetzung existiert und kein `defaultValue` angegeben wurde, wird möglicherweise der Schlüssel selbst oder die interpolierte Zeichenfolge zurückgegeben.

## Namensraum (ns)

Der **Standard-Namensraum für die RunJS-Umgebung ist `runjs`**. Wenn `ns` nicht angegeben ist, sucht `ctx.t(key)` den Schlüssel im Namensraum `runjs`.

```ts
// Sucht standardmäßig im Namensraum 'runjs' nach dem Schlüssel
ctx.t('Submit'); // Entspricht ctx.t('Submit', { ns: 'runjs' })

// Sucht den Schlüssel in einem bestimmten Namensraum
ctx.t('Submit', { ns: 'myModule' });

// Durchsucht mehrere Namensräume nacheinander (zuerst 'runjs', dann 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Beispiele

### Einfacher Schlüssel

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Mit Interpolationsvariablen

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamische Texte (z. B. relative Zeit)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Angabe eines Namensraums

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Hinweise

- **Lokalisierungs-Plugin**: Um Texte zu übersetzen, muss das Lokalisierungs-Plugin aktiviert sein. Fehlende Übersetzungsschlüssel werden automatisch in die Liste der Lokalisierungsverwaltung extrahiert, um eine zentrale Wartung und Übersetzung zu ermöglichen.
- Unterstützt Interpolation im i18next-Stil: Verwenden Sie `{{variablenName}}` im Schlüssel und übergeben Sie die entsprechende Variable in den `options`, um sie zu ersetzen.
- Die Sprache wird durch den aktuellen Kontext bestimmt (z. B. `ctx.i18n.language`, Benutzer-Locale).

## Verwandte Themen

- [ctx.i18n](./i18n.md): Sprachen lesen oder wechseln