:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/flow-engine/flow-context).
:::

# Przegląd systemu kontekstowego

System kontekstowy silnika przepływów pracy NocoBase podzielony jest na trzy warstwy, z których każda odpowiada innemu zakresowi. Rozsądne użycie pozwala na elastyczne współdzielenie i izolację usług, konfiguracji i danych, poprawiając łatwość utrzymania i rozszerzalność biznesową.

- **FlowEngineContext (kontekst globalny)**: Globalnie unikalny, dostępny dla wszystkich modeli i przepływów pracy, odpowiedni do rejestrowania globalnych usług, konfiguracji itp.
- **FlowModelContext (kontekst modelu)**: Służy do współdzielenia kontekstu wewnątrz drzewa modeli. Modele podrzędne automatycznie delegują do kontekstu modelu nadrzędnego, obsługując nadpisywanie nazw. Odpowiedni do izolacji logiki i danych na poziomie modelu.
- **FlowRuntimeContext (kontekst wykonania przepływu pracy)**: Tworzony przy każdym wykonaniu przepływu pracy, trwa przez cały cykl wykonania przepływu. Odpowiedni do przekazywania danych, przechowywania zmiennych, rejestrowania stanu wykonania itp. Obsługuje dwa tryby `mode: 'runtime' | 'settings'`, odpowiadające odpowiednio trybowi wykonania i trybowi konfiguracji.

Wszystkie `FlowEngineContext` (kontekst globalny), `FlowModelContext` (kontekst modelu), `FlowRuntimeContext` (kontekst wykonania przepływu pracy) itp. są podklasami lub instancjami `FlowContext`.

---

## 🗂️ Diagram hierarchii

```text
FlowEngineContext (kontekst globalny)
│
├── FlowModelContext (kontekst modelu)
│     ├── 子 FlowModelContext (model podrzędny)
│     │     ├── FlowRuntimeContext (kontekst wykonania przepływu pracy)
│     │     └── FlowRuntimeContext (kontekst wykonania przepływu pracy)
│     └── FlowRuntimeContext (kontekst wykonania przepływu pracy)
│
├── FlowModelContext (kontekst modelu)
│     └── FlowRuntimeContext (kontekst wykonania przepływu pracy)
│
└── FlowModelContext (kontekst modelu)
      ├── 子 FlowModelContext (model podrzędny)
      │     └── FlowRuntimeContext (kontekst wykonania przepływu pracy)
      └── FlowRuntimeContext (kontekst wykonania przepływu pracy)
```

- `FlowModelContext` poprzez mechanizm delegowania (delegate) może uzyskiwać dostęp do właściwości i metod `FlowEngineContext`, realizując współdzielenie globalnych możliwości.
- `FlowModelContext` modelu podrzędnego poprzez mechanizm delegowania (delegate) może uzyskiwać dostęp do kontekstu modelu nadrzędnego (relacja synchroniczna), obsługując nadpisywanie nazw.
- Asynchroniczne modele nadrzędne-podrzędne nie ustanawiają relacji delegowania (delegate), aby uniknąć zanieczyszczenia stanu.
- `FlowRuntimeContext` zawsze uzyskuje dostęp do odpowiadającego mu `FlowModelContext` poprzez mechanizm delegowania (delegate), ale nie przekazuje zmian w górę.

---

## 🧭 Tryb wykonania i tryb konfiguracji (mode)

`FlowRuntimeContext` obsługuje dwa tryby, rozróżniane za pomocą parametru `mode`:

- `mode: 'runtime'` (tryb wykonania): Używany w fazie faktycznego wykonania przepływu pracy, właściwości i metody zwracają rzeczywiste dane. Na przykład:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (tryb konfiguracji): Używany w fazie projektowania i konfiguracji przepływu pracy, dostęp do właściwości zwraca ciąg szablonu zmiennej, co ułatwia wybór wyrażeń i zmiennych. Na przykład:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Ta dwutrybowa konstrukcja zapewnia dostępność danych w czasie wykonania, a także ułatwia odwoływanie się do zmiennych i generowanie wyrażeń podczas konfiguracji, zwiększając elastyczność i łatwość użycia silnika przepływów pracy.

---

## 🤖 Informacje kontekstowe dla narzędzi/dużych modeli

W niektórych scenariuszach (np. edycja kodu RunJS w JS*Model, AI coding), konieczne jest umożliwienie „stronie wywołującej” zrozumienie następujących kwestii bez wykonywania kodu:

- Jakie **statyczne możliwości** (dokumentacja API, parametry, przykłady, linki do dokumentacji itp.) są dostępne w bieżącym `ctx`.
- Jakie **opcjonalne zmienne** (np. dynamiczne struktury takie jak „bieżący rekord”, „bieżący rekord okna podręcznego” itp.) istnieją w bieżącym interfejsie/trybie wykonania.
- **Migawka o małym rozmiarze** bieżącego środowiska wykonawczego (używana do promptów).

### 1) `await ctx.getApiInfos(options?)` (Statyczne informacje API)

### 2) `await ctx.getVarInfos(options?)` (Informacje o strukturze zmiennych)

- Budowane w oparciu o `defineProperty(...).meta` (w tym meta factory).
- Obsługuje przycinanie `path` i kontrolę głębokości `maxDepth`.
- Rozwijane w dół tylko wtedy, gdy jest to potrzebne.

Często używane parametry:

- `maxDepth`: Maksymalny poziom rozwinięcia (domyślnie 3).
- `path: string | string[]`: Przycinanie, wyprowadza tylko poddrzewo określonej ścieżki.

### 3) `await ctx.getEnvInfos()` (Migawka środowiska wykonawczego)

Struktura węzła (uproszczona):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Może być użyte bezpośrednio w await ctx.getVar(getVar), zaczyna się od "ctx."
  value?: any; // Rozwiązana/serializowalna wartość statyczna
  properties?: Record<string, EnvNode>;
};
```