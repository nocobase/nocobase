:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Wtyczka

W NocoBase **wtyczka kliencka** to główny sposób na rozszerzanie i dostosowywanie funkcjonalności frontendu. Dziedzicząc po klasie bazowej `Plugin` dostarczanej przez `@nocobase/client`, deweloperzy mogą rejestrować logikę, dodawać komponenty stron, rozszerzać menu lub integrować funkcje stron trzecich na różnych etapach cyklu życia.

## Struktura klasy wtyczki

Oto podstawowa struktura wtyczki klienckiej:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Wykonywane po dodaniu wtyczki
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Wykonywane przed załadowaniem wtyczki
    console.log('Before plugin load');
  }

  async load() {
    // Wykonywane podczas ładowania wtyczki, rejestruje trasy, komponenty UI itp.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Opis cyklu życia

Każda wtyczka przechodzi kolejno przez następujące etapy cyklu życia po odświeżeniu przeglądarki lub inicjalizacji aplikacji:

| Metoda cyklu życia | Czas wykonania | Opis |
|--------------------|----------------|------|
| **afterAdd()**     | Wykonywana natychmiast po dodaniu wtyczki do menedżera wtyczek | Instancja wtyczki jest już utworzona, ale nie wszystkie wtyczki zakończyły inicjalizację. Nadaje się do lekkiej inicjalizacji, np. odczytywania konfiguracji lub wiązania podstawowych zdarzeń. |
| **beforeLoad()**   | Wykonywana przed metodą `load()` wszystkich wtyczek | Ma dostęp do wszystkich włączonych instancji wtyczek (`this.app.pm.get()`). Nadaje się do logiki przygotowawczej, która zależy od innych wtyczek. |
| **load()**         | Wykonywana podczas ładowania wtyczki | Ta metoda jest wykonywana po zakończeniu `beforeLoad()` wszystkich wtyczek. Nadaje się do rejestrowania tras frontendu, komponentów UI i innej kluczowej logiki. |

## Kolejność wykonania

Za każdym odświeżeniem przeglądarki wykonywane są kolejno: `afterAdd()` → `beforeLoad()` → `load()`.

## Kontekst wtyczki i FlowEngine

Począwszy od NocoBase 2.0, interfejsy API rozszerzeń po stronie klienta są głównie skoncentrowane w **FlowEngine**. W klasie wtyczki mogą Państwo uzyskać instancję silnika za pomocą `this.engine`.

```ts
// Dostęp do kontekstu silnika w metodzie load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Więcej informacji znajdą Państwo tutaj:
- [FlowEngine](/flow-engine)
- [Kontekst](./context.md)