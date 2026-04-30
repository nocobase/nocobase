---
title: "UI Schema"
description: "Referenz zur NocoBase UI Schema-Syntax: ein Komponentenbeschreibungsprotokoll auf Basis von Formily Schema, mit Erläuterungen zu type, x-component, x-decorator, x-pattern und weiteren Attributen."
keywords: "UI Schema,uiSchema,Formily,x-component,x-decorator,x-pattern,x-display,NocoBase"
---

# UI Schema

UI Schema ist das Protokoll, mit dem NocoBase Frontend-Komponenten beschreibt. Es basiert auf [Formily Schema 2.0](https://react.formilyjs.org/api/shared/schema) und folgt einem JSON-Schema-ähnlichen Stil. In FlowEngine wird das Feld `uiSchema` von `registerFlow` mit dieser Syntax verwendet, um die UI des Konfigurationspanels zu definieren.

```ts
interface ISchema {
  type: 'void' | 'string' | 'number' | 'object' | 'array';
  name?: string;
  title?: any;
  // Wrapper-Komponente
  ['x-decorator']?: string;
  // Eigenschaften der Wrapper-Komponente
  ['x-decorator-props']?: any;
  // Komponente
  ['x-component']?: string;
  // Komponenten-Eigenschaften
  ['x-component-props']?: any;
  // Anzeigestatus, Standard ist 'visible'
  ['x-display']?: 'none' | 'hidden' | 'visible';
  // Kindknoten der Komponente
  ['x-content']?: any;
  // Schema der children-Knoten
  properties?: Record<string, ISchema>;

  // Folgende Felder gelten nur für Field-Komponenten

  // Field-Reaktionen
  ['x-reactions']?: SchemaReactions;
  // UI-Interaktionsmodus des Fields, Standard ist 'editable'
  ['x-pattern']?: 'editable' | 'disabled' | 'readPretty';
  // Field-Validierung
  ['x-validator']?: Validator;
  // Standardwert
  default?: any;
}
```

## Grundlegende Verwendung

### Die einfachste Komponente

Alle nativen HTML-Tags lassen sich in eine Schema-Schreibweise überführen:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

Entspricht in JSX:

```tsx
<h1>Hello, world!</h1>
```

### Untergeordnete Komponenten

children-Komponenten werden in `properties` geschrieben:

```ts
{
  type: 'void',
  'x-component': 'div',
  'x-component-props': { className: 'form-item' },
  properties: {
    title: {
      type: 'string',
      'x-component': 'input',
    },
  },
}
```

Entspricht in JSX:

```tsx
<div className={'form-item'}>
  <input name={'title'} />
</div>
```

## Attribut-Erläuterungen

### type

Der Typ des Knotens:

```ts
type SchemaTypes = 'string' | 'object' | 'array' | 'number' | 'boolean' | 'void';
```

### name

Der Name des Schemas. Der name eines Kindknotens ist der Schlüssel in `properties`:

```ts
{
  name: 'root',
  properties: {
    child1: {
      // Hier wird kein eigener name benötigt
    },
  },
}
```

### title

Der Titel des Knotens, üblicherweise als Beschriftung für Formularfelder verwendet.

### x-component

Der Name der Komponente. Kann ein natives HTML-Tag oder eine registrierte React-Komponente sein:

```ts
{
  type: 'void',
  'x-component': 'h1',
  'x-content': 'Hello, world!',
}
```

### x-component-props

Die Eigenschaften der Komponente:

```ts
{
  type: 'void',
  'x-component': 'Table',
  'x-component-props': {
    loading: true,
  },
}
```

### x-decorator

Wrapper-Komponente. Die Kombination aus `x-decorator` + `x-component` erlaubt es, zwei Komponenten in einem einzigen Schema-Knoten zu platzieren – das senkt die strukturelle Komplexität und erhöht die Wiederverwendbarkeit.

In Formularen ist beispielsweise `FormItem` der decorator:

```ts
{
  type: 'void',
  'x-component': 'div',
  properties: {
    title: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
  },
}
```

Entspricht in JSX:

```tsx
<div>
  <FormItem>
    <Input name={'title'} />
  </FormItem>
  <FormItem>
    <Input.TextArea name={'content'} />
  </FormItem>
</div>
```

### x-display

Der Anzeigestatus der Komponente:

| Wert | Beschreibung |
|----|------|
| `'visible'` | Komponente anzeigen (Standard) |
| `'hidden'` | Komponente ausblenden, Daten bleiben jedoch erhalten |
| `'none'` | Komponente ausblenden, Daten ebenfalls ausgeblendet |

### x-pattern

Interaktionsmodus einer Field-Komponente:

| Wert | Beschreibung |
|----|------|
| `'editable'` | Bearbeitbar (Standard) |
| `'disabled'` | Nicht bearbeitbar |
| `'readPretty'` | Lesefreundlicher Modus – z. B. ist eine einzeilige Textkomponente im Bearbeitungsmodus ein `<input />`, im lesefreundlichen Modus ein `<div />` |

## Verwendung in registerFlow

In der Plugin-Entwicklung wird uiSchema vor allem im Konfigurationspanel von `registerFlow` eingesetzt. Jedes Field wird in der Regel mit `'x-decorator': 'FormItem'` umschlossen:

```ts
MyModel.registerFlow({
  key: 'flow1',
  on: 'beforeRender',
  steps: {
    editTitle: {
      title: 'Titel bearbeiten',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Titel',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
        showBorder: {
          type: 'boolean',
          title: 'Rahmen anzeigen',
          'x-decorator': 'FormItem',
          'x-component': 'Switch',
        },
        color: {
          type: 'string',
          title: 'Farbe',
          'x-decorator': 'FormItem',
          'x-component': 'Select',
          enum: [
            { label: 'Rot', value: 'red' },
            { label: 'Blau', value: 'blue' },
            { label: 'Grün', value: 'green' },
          ],
        },
      },
      handler(ctx, params) {
        ctx.model.props.title = params.title;
        ctx.model.props.showBorder = params.showBorder;
        ctx.model.props.color = params.color;
      },
    },
  },
});
```

:::tip Tipp

v2 ist mit der uiSchema-Syntax kompatibel, allerdings ist der Anwendungsbereich begrenzt – sie wird im Wesentlichen im Konfigurationspanel von Flow zur Beschreibung der Formular-UI verwendet. Für das Rendern von Komponenten zur Laufzeit empfiehlt sich überwiegend die direkte Implementierung mit [Antd-Komponenten](https://5x.ant.design/components/overview).

:::

## Häufig verwendete Komponenten – Schnellübersicht

| Komponente | x-component | type | Beschreibung |
|------|-------------|------|------|
| Einzeiliger Text | `Input` | `string` | Grundlegende Texteingabe |
| Mehrzeiliger Text | `Input.TextArea` | `string` | Mehrzeiliges Textfeld |
| Zahl | `InputNumber` | `number` | Zahleneingabe |
| Schalter | `Switch` | `boolean` | Boolescher Schalter |
| Dropdown-Auswahl | `Select` | `string` | Erfordert `enum` für Optionen |
| Einzelauswahl | `Radio.Group` | `string` | Erfordert `enum` für Optionen |
| Mehrfachauswahl | `Checkbox.Group` | `string` | Erfordert `enum` für Optionen |
| Datum | `DatePicker` | `string` | Datumsauswahl |

## Verwandte Links

- [FlowEngine Übersicht (Plugin-Entwicklung)](../plugin-development/client/flow-engine/index.md) – tatsächliche Verwendung von uiSchema in registerFlow
- [FlowDefinition](./definitions/flow-definition.md) – vollständige Parameterbeschreibung von registerFlow
- [Formily Schema-Dokumentation](https://react.formilyjs.org/api/shared/schema) – das Formily-Protokoll, auf dem uiSchema basiert
