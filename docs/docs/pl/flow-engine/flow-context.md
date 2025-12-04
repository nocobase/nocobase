
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::


# Przegląd systemu kontekstowego

System kontekstowy silnika przepływów pracy NocoBase podzielony jest na trzy warstwy, z których każda odpowiada innemu zakresowi. Odpowiednie wykorzystanie pozwala na elastyczne współdzielenie i izolację usług, konfiguracji i danych, co zwiększa łatwość utrzymania i skalowalność biznesową.

- **FlowEngineContext (Kontekst globalny)**: Globalnie unikalny, dostępny dla wszystkich modeli i przepływów pracy. Nadaje się do rejestrowania globalnych usług, konfiguracji itp.
- **FlowModelContext (Kontekst modelu)**: Służy do współdzielenia kontekstu w obrębie drzewa modeli. Modele podrzędne automatycznie delegują do kontekstu modelu nadrzędnego, obsługując nadpisywanie nazw. Nadaje się do izolacji logiki i danych na poziomie modelu.
- **FlowRuntimeContext (Kontekst wykonania przepływu pracy)**: Tworzony przy każdym wykonaniu przepływu pracy, istnieje przez cały cykl jego działania. Nadaje się do przekazywania danych, przechowywania zmiennych i rejestrowania stanu wykonania w ramach przepływu pracy. Obsługuje dwa tryby: `mode: 'runtime' | 'settings'`, odpowiadające odpowiednio trybowi wykonania i trybowi konfiguracji.

Wszystkie `FlowEngineContext` (kontekst globalny), `FlowModelContext` (kontekst modelu), `FlowRuntimeContext` (kontekst wykonania przepływu pracy) itp. są podklasami lub instancjami `FlowContext`.

---

## 🗂️ Diagram hierarchii

```text
FlowEngineContext (Kontekst globalny)
│
├── FlowModelContext (Kontekst modelu)
│     ├── Sub FlowModelContext (Model podrzędny)
│     │     ├── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
│     │     └── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
│     └── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
│
├── FlowModelContext (Kontekst modelu)
│     └── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
│
└── FlowModelContext (Kontekst modelu)
      ├── Sub FlowModelContext (Model podrzędny)
      │     └── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
      └── FlowRuntimeContext (Kontekst wykonania przepływu pracy)
```

- `FlowModelContext` może uzyskać dostęp do właściwości i metod `FlowEngineContext` za pomocą mechanizmu delegowania, umożliwiając współdzielenie globalnych możliwości.
- `FlowModelContext` modelu podrzędnego może uzyskać dostęp do kontekstu modelu nadrzędnego (relacja synchroniczna) za pomocą mechanizmu delegowania, obsługując nadpisywanie nazw.
- Asynchroniczne modele nadrzędne-podrzędne nie ustanawiają relacji delegowania, aby uniknąć zanieczyszczenia stanu.
- `FlowRuntimeContext` zawsze uzyskuje dostęp do odpowiadającego mu `FlowModelContext` za pomocą mechanizmu delegowania, ale nie propaguje zmian w górę.

## 🧭 Tryb wykonania i tryb konfiguracji (mode)

`FlowRuntimeContext` obsługuje dwa tryby, rozróżniane za pomocą parametru `mode`:

- `mode: 'runtime'` (Tryb wykonania): Używany podczas faktycznego etapu wykonania przepływu pracy. Właściwości i metody zwracają rzeczywiste dane. Na przykład:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Tryb konfiguracji): Używany podczas etapu projektowania i konfiguracji przepływu pracy. Dostęp do właściwości zwraca ciąg szablonu zmiennej, ułatwiając wybór wyrażeń i zmiennych. Na przykład:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Ta dwutrybowa konstrukcja zapewnia dostępność danych w czasie wykonania oraz ułatwia odwoływanie się do zmiennych i generowanie wyrażeń podczas konfiguracji, zwiększając elastyczność i łatwość użycia silnika przepływów pracy.