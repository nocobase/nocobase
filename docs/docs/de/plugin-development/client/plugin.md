:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Plugin

In NocoBase ist das **Client-Plugin** die wichtigste Methode, um die Frontend-Funktionalität zu erweitern und anzupassen. Indem Sie die von `@nocobase/client` bereitgestellte `Plugin`-Basisklasse erweitern, können Entwickler Logik registrieren, Seitenkomponenten hinzufügen, Menüs erweitern oder Drittanbieter-Funktionen in verschiedenen Lebenszyklusphasen integrieren.

## Plugin-Klassenstruktur

Eine grundlegende Struktur für ein Client-Plugin sieht wie folgt aus:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Wird ausgeführt, nachdem das Plugin hinzugefügt wurde
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Wird vor dem Laden des Plugins ausgeführt
    console.log('Before plugin load');
  }

  async load() {
    // Wird beim Laden des Plugins ausgeführt, registriert Routen, UI-Komponenten usw.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Beschreibung des Lebenszyklus

Jedes Plugin durchläuft nacheinander den folgenden Lebenszyklus, wenn der Browser aktualisiert oder die Anwendung initialisiert wird:

| Lebenszyklus-Methode | Ausführungszeitpunkt | Beschreibung |
|--------------------|--------------------|--------------|
| **afterAdd()**     | Wird sofort ausgeführt, nachdem das Plugin zum Plugin-Manager hinzugefügt wurde | Zu diesem Zeitpunkt ist die Plugin-Instanz bereits erstellt, aber nicht alle Plugins sind vollständig initialisiert. Geeignet für eine leichte Initialisierung, z. B. das Lesen von Konfigurationen oder das Binden grundlegender Ereignisse. |
| **beforeLoad()**   | Wird vor der `load()`-Methode aller Plugins ausgeführt | Sie können auf alle aktivierten Plugin-Instanzen (`this.app.pm.get()`) zugreifen. Geeignet für Vorbereitungslogik, die von anderen Plugins abhängt. |
| **load()**         | Wird beim Laden des Plugins ausgeführt | Diese Methode wird ausgeführt, nachdem die `beforeLoad()`-Methoden aller Plugins abgeschlossen sind. Geeignet für die Registrierung von Frontend-Routen, UI-Komponenten und anderer Kernlogik. |

## Ausführungsreihenfolge

Bei jeder Browseraktualisierung wird die Reihenfolge `afterAdd()` → `beforeLoad()` → `load()` ausgeführt.

## Plugin-Kontext und FlowEngine

Ab NocoBase 2.0 konzentrieren sich die clientseitigen Erweiterungs-APIs hauptsächlich in der **FlowEngine**. Innerhalb der Plugin-Klasse können Sie die Engine-Instanz über `this.engine` abrufen.

```ts
// Zugriff auf den Engine-Kontext in der load()-Methode
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Weitere Informationen finden Sie unter:
- [FlowEngine](/flow-engine)
- [Kontext](./context.md)