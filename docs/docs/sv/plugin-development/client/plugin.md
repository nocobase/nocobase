:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Plugin

I NocoBase är **klient-plugin** det huvudsakliga sättet att utöka och anpassa frontend-funktionalitet. Genom att ärva basklassen `Plugin` från `@nocobase/client` kan utvecklare registrera logik, lägga till sidkomponenter, utöka menyer eller integrera tredjepartsfunktionalitet i olika livscykelfaser.

## Plugin-klassens struktur

En grundläggande struktur för ett klient-plugin ser ut så här:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Utförs efter att pluginet har lagts till
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Utförs innan pluginet laddas
    console.log('Before plugin load');
  }

  async load() {
    // Utförs när pluginet laddas; registrera rutter, UI-komponenter, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Livscykelbeskrivning

Varje plugin genomgår följande livscykel i sekvens när webbläsaren uppdateras eller applikationen initieras:

| Livscykelmetod | Utförandetidpunkt | Beskrivning |
| -------------- | ----------------- | ----------- |
| **afterAdd()** | Utförs omedelbart efter att pluginet har lagts till i plugin-hanteraren | Plugin-instansen har skapats vid denna tidpunkt, men alla plugin har inte slutfört sin initialisering. Lämpligt för lättviktig initialisering, som att läsa konfiguration eller binda grundläggande händelser. |
| **beforeLoad()** | Utförs innan alla pluginens `load()`-metoder | Ni kan komma åt alla aktiverade plugin-instanser (`this.app.pm.get()`). Lämpligt för förberedande logik som är beroende av andra plugin. |
| **load()** | Utförs när pluginet laddas | Denna metod utförs efter att alla pluginens `beforeLoad()`-metoder har slutförts. Lämpligt för att registrera frontend-rutter, UI-komponenter och annan kärnlogik. |

## Utförandeordning

Varje gång webbläsaren uppdateras kommer `afterAdd()` → `beforeLoad()` → `load()` att utföras.

## Plugin-kontext och FlowEngine

Från och med NocoBase 2.0 är klientens utöknings-API:er huvudsakligen koncentrerade till **FlowEngine**. I plugin-klassen kan ni hämta motorinstansen via `this.engine`.

```ts
// Åtkomst till motorkontexten i load()-metoden
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

För mer information, se:
- [FlowEngine](/flow-engine)
- [Context](./context.md)