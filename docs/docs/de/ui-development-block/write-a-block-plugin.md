:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erstellen Sie Ihr erstes Block-Plugin

Bevor Sie beginnen, empfehlen wir Ihnen, zuerst „[Erstellen Sie Ihr erstes Plugin](../plugin-development/write-your-first-plugin.md)“ zu lesen. Dort erfahren Sie, wie Sie schnell ein grundlegendes Plugin erstellen können. Anschließend erweitern wir dieses um eine einfache Block-Funktion.

## Schritt 1: Erstellen der Block-Modelldatei

Erstellen Sie im Plugin-Verzeichnis die Datei: `client/models/SimpleBlockModel.tsx`

## Schritt 2: Schreiben des Modellinhalts

Definieren und implementieren Sie in der Datei ein grundlegendes Block-Modell, einschließlich seiner Rendering-Logik:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Schritt 3: Registrieren des Block-Modells

Exportieren Sie das neu erstellte Modell in der Datei `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Schritt 4: Aktivieren und Ausprobieren des Blocks

Nachdem Sie das Plugin aktiviert haben, sehen Sie im Dropdown-Menü „Block hinzufügen“ die neue Block-Option **Hello block**.

Effekt-Demonstration:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Schritt 5: Hinzufügen von Konfigurationsmöglichkeiten zum Block

Als Nächstes fügen wir dem Block über **Flow** konfigurierbare Funktionen hinzu, damit Benutzer den Blockinhalt in der Oberfläche bearbeiten können.

Bearbeiten Sie die Datei `SimpleBlockModel.tsx` weiter:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Effekt-Demonstration:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Zusammenfassung

Dieser Artikel hat Ihnen gezeigt, wie Sie ein einfaches Block-Plugin erstellen. Dazu gehören:

- Wie Sie ein Block-Modell definieren und implementieren
- Wie Sie ein Block-Modell registrieren
- Wie Sie über Flow konfigurierbare Funktionen zu einem Block hinzufügen

Den vollständigen Quellcode finden Sie hier: [Simple Block Beispiel](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)