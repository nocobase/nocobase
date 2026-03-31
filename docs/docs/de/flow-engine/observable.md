:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Reaktionsmechanismus: Observable

:::info
Der Observable-Reaktionsmechanismus von NocoBase entspricht im Grunde dem von [MobX](https://mobx.js.org/README.html). Die aktuelle zugrunde liegende Implementierung verwendet [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), dessen Syntax und Konzepte hochgradig kompatibel mit [MobX](https://mobx.js.org/README.html) sind. Es wurde aus historischen Gründen nicht direkt verwendet.
:::

In NocoBase 2.0 sind reaktive Objekte vom Typ `Observable` allgegenwärtig. Es bildet den Kern des zugrunde liegenden Datenflusses und der UI-Reaktionsfähigkeit und wird in Komponenten wie FlowContext, FlowModel und FlowStep umfassend eingesetzt.

## Warum Observable?

NocoBase hat sich für Observable gegenüber anderen State-Management-Lösungen wie Redux, Recoil, Zustand und Jotai aus den folgenden Hauptgründen entschieden:

- **Extrem flexibel**: Observable kann jedes Objekt, Array, jede Map, jedes Set usw. reaktiv machen. Es unterstützt von Natur aus tiefe Verschachtelungen und dynamische Strukturen, was es sehr gut für komplexe Geschäftsmodelle geeignet macht.
- **Nicht-invasiv**: Sie können das ursprüngliche Objekt direkt manipulieren, ohne Aktionen, Reducer oder zusätzliche Stores definieren zu müssen, was ein hervorragendes Entwicklungserlebnis bietet.
- **Automatische Abhängigkeitsverfolgung**: Indem Sie eine Komponente mit `observer` umschließen, verfolgt die Komponente automatisch die von ihr verwendeten Observable-Eigenschaften. Wenn sich die Daten ändern, wird die Benutzeroberfläche automatisch aktualisiert, ohne dass eine manuelle Abhängigkeitsverwaltung erforderlich ist.
- **Geeignet für Nicht-React-Szenarien**: Der Observable-Reaktionsmechanismus ist nicht nur auf React anwendbar, sondern kann auch mit anderen Frameworks kombiniert werden, um ein breiteres Spektrum an reaktiven Datenanforderungen zu erfüllen.

## Warum `observer` verwenden?

`observer` lauscht auf Änderungen in Observable-Objekten und löst automatisch Aktualisierungen von React-Komponenten aus, wenn sich die Daten ändern. Dadurch bleibt Ihre Benutzeroberfläche mit Ihren Daten synchron, ohne dass Sie `setState` oder andere Aktualisierungsmethoden manuell aufrufen müssen.

## Grundlegende Verwendung

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Für weitere Informationen zur reaktiven Nutzung lesen Sie bitte die Dokumentation von [@formily/reactive](https://reactive.formilyjs.org/).