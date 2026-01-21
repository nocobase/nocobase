:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Plugin

V NocoBase je **Klientský plugin** hlavním způsobem, jak rozšířit a přizpůsobit frontendové funkce. Děděním základní třídy `Plugin`, kterou poskytuje `@nocobase/client`, mohou vývojáři registrovat logiku, přidávat komponenty stránek, rozšiřovat menu nebo integrovat funkce třetích stran v různých fázích životního cyklu.

## Struktura třídy pluginu

Základní struktura klientského pluginu vypadá následovně:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Spustí se po přidání pluginu
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Spustí se před načtením pluginu
    console.log('Before plugin load');
  }

  async load() {
    // Spustí se při načítání pluginu, registruje routy, UI komponenty atd.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Popis životního cyklu

Každý plugin prochází při obnovení prohlížeče nebo inicializaci aplikace postupně následujícími fázemi životního cyklu:

| Metoda životního cyklu | Čas spuštění | Popis |
|------------------------|--------------|-------|
| **afterAdd()**         | Spustí se ihned poté, co je plugin přidán do správce pluginů | Instance pluginu je v tomto okamžiku již vytvořena, ale ne všechny pluginy jsou plně inicializovány. Vhodné pro lehkou inicializaci, například čtení konfigurace nebo navázání základních událostí. |
| **beforeLoad()**       | Spustí se před metodou `load()` všech pluginů | Má přístup ke všem povoleným instancím pluginů (`this.app.pm.get()`). Vhodné pro přípravnou logiku, která závisí na jiných pluginech. |
| **load()**             | Spustí se při načítání pluginu | Tato metoda se spustí po dokončení metody `beforeLoad()` všech pluginů. Vhodné pro registraci frontendových rout, UI komponent a další klíčové logiky. |

## Pořadí spuštění

Při každém obnovení prohlížeče se spustí `afterAdd()` → `beforeLoad()` → `load()`.

## Kontext pluginu a FlowEngine

Od NocoBase 2.0 se API pro rozšíření na straně klienta soustředí především v **FlowEngine**. V rámci třídy pluginu můžete získat instanci enginu prostřednictvím `this.engine`.

```ts
// Přístup ke kontextu enginu v metodě load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Aktuální aplikace:', app);
}
```

Více obsahu naleznete zde:  
- [FlowEngine](/flow-engine)  
- [Kontext](./context.md)