:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Plugin

In NocoBase is een **client-side plugin** de belangrijkste manier om frontend-functionaliteit uit te breiden en aan te passen. Door de `Plugin` basisklasse van `@nocobase/client` te gebruiken, kunt u als ontwikkelaar logica registreren, paginaonderdelen toevoegen, menu's uitbreiden of functionaliteit van derden integreren in verschillende levenscyclusfasen.

## Structuur van een plugin-klasse

Een basisstructuur voor een client-side plugin ziet er als volgt uit:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Wordt uitgevoerd nadat de plugin is toegevoegd
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Wordt uitgevoerd voordat de plugin laadt
    console.log('Before plugin load');
  }

  async load() {
    // Wordt uitgevoerd wanneer de plugin laadt; registreer hier routes, UI-componenten, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Levenscyclusbeschrijving

Elke plugin doorloopt de volgende levenscyclus in volgorde wanneer de browser wordt vernieuwd of de applicatie wordt geïnitialiseerd:

| Levenscyclusmethode | Uitvoermoment | Beschrijving |
|--------------------|---------------|--------------|
| **afterAdd()**     | Wordt direct uitgevoerd nadat de plugin aan de plugin-manager is toegevoegd. | Het plugin-exemplaar is op dit punt al aangemaakt, maar niet alle plugins zijn volledig geïnitialiseerd. Geschikt voor lichte initialisatie, zoals het lezen van configuratie of het koppelen van basisevenementen. |
| **beforeLoad()**   | Wordt uitgevoerd vóór de `load()`-methode van alle plugins. | U hebt toegang tot alle ingeschakelde plugin-exemplaren (`this.app.pm.get()`). Geschikt voor voorbereidende logica die afhankelijk is van andere plugins. |
| **load()**         | Wordt uitgevoerd wanneer de plugin laadt. | Deze methode wordt uitgevoerd nadat de `beforeLoad()`-methode van alle plugins is voltooid. Geschikt voor het registreren van frontend-routes, UI-componenten en andere kernlogica. |

## Uitvoeringsvolgorde

Elke keer dat de browser wordt vernieuwd, worden `afterAdd()` → `beforeLoad()` → `load()` in deze volgorde uitgevoerd.

## Plugin-context en FlowEngine

Vanaf NocoBase 2.0 zijn de client-side uitbreidings-API's voornamelijk geconcentreerd in de **FlowEngine**. Binnen een plugin-klasse kunt u het engine-exemplaar verkrijgen via `this.engine`.

```ts
// Krijg toegang tot de engine-context in de load()-methode
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Voor meer informatie, zie:
- [FlowEngine](/flow-engine)
- [Context](./context.md)