:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/flow-engine/flow-context).
:::

# Přehled systému kontextů

Systém kontextů enginu pracovních postupů NocoBase je rozdělen do tří vrstev, které odpovídají různým rozsahům působnosti. Rozumné použití umožňuje flexibilní sdílení a izolaci služeb, konfigurací a dat, čímž se zvyšuje udržovatelnost a rozšiřitelnost byznysu.

- **FlowEngineContext (globální kontext)**: Globálně unikátní, přístupný všem modelům a pracovním postupům, vhodný pro registraci globálních služeb, konfigurací atd.
- **FlowModelContext (kontext modelu)**: Slouží ke sdílení kontextu v rámci stromu modelů, podřízené modely automaticky delegují na kontext rodičovského modelu, podporuje přepsání se stejným názvem, vhodný pro izolaci logiky a dat na úrovni modelu.
- **FlowRuntimeContext (kontext běhu pracovního postupu)**: Vytváří se při každém spuštění pracovního postupu, prochází celým cyklem běhu pracovního postupu, vhodný pro předávání dat, ukládání proměnných, záznam stavu běhu atd. v rámci pracovního postupu. Podporuje dva režimy `mode: 'runtime' | 'settings'`, které odpovídají stavu běhu a stavu konfigurace.

Všechny `FlowEngineContext` (globální kontext), `FlowModelContext` (kontext modelu), `FlowRuntimeContext` (kontext běhu pracovního postupu) atd. jsou podtřídami nebo instancemi `FlowContext`.

---

## 🗂️ Diagram hierarchie

```text
FlowEngineContext (globální kontext)
│
├── FlowModelContext (kontext modelu)
│     ├── Podřízený FlowModelContext (podmodel)
│     │     ├── FlowRuntimeContext (kontext běhu pracovního postupu)
│     │     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│
├── FlowModelContext (kontext modelu)
│     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│
└── FlowModelContext (kontext modelu)
      ├── Podřízený FlowModelContext (podmodel)
      │     └── FlowRuntimeContext (kontext běhu pracovního postupu)
      └── FlowRuntimeContext (kontext běhu pracovního postupu)
```

- `FlowModelContext` může přistupovat k vlastnostem a metodám `FlowEngineContext` prostřednictvím mechanismu delegování (delegate), čímž realizuje sdílení globálních schopností.
- `FlowModelContext` podřízeného modelu může přistupovat ke kontextu rodičovského modelu (synchronní vztah) prostřednictvím mechanismu delegování (delegate), podporuje přepsání se stejným názvem.
- Asynchronní rodičovské a podřízené modely nevytvářejí vztah delegování (delegate), aby se zabránilo kontaminaci stavu.
- `FlowRuntimeContext` vždy přistupuje ke svému odpovídajícímu `FlowModelContext` prostřednictvím mechanismu delegování (delegate), ale nevrací se směrem nahoru.

---

## 🧭 Stav běhu a stav konfigurace (mode)

`FlowRuntimeContext` podporuje dva režimy, rozlišené parametrem `mode`:

- `mode: 'runtime'` (stav běhu): Používá se ve fázi skutečného provádění pracovního postupu, vlastnosti a metody vracejí skutečná data. Například:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (stav konfigurace): Používá se ve fázi návrhu a konfigurace pracovního postupu, přístup k vlastnostem vrací řetězec šablony proměnné, což usnadňuje výběr výrazů a proměnných. Například:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Tento dvourežimový design zajišťuje dostupnost dat za běhu a zároveň usnadňuje odkazování na proměnné a generování výrazů při konfiguraci, čímž zvyšuje flexibilitu a použitelnost enginu pracovních postupů.

---

## 🤖 Kontextové informace pro nástroje / velké jazykové modely

V určitých scénářích (například úprava kódu RunJS v JS*Model, AI kódování) je nutné, aby „volající strana“ bez spuštění kódu porozuměla:

- Jaké **statické schopnosti** jsou pod aktuálním `ctx` k dispozici (API dokumentace, parametry, příklady, odkazy na dokumentaci atd.)
- Jaké **volitelné proměnné** jsou v aktuálním rozhraní/stavu běhu (například dynamické struktury jako „aktuální záznam“, „aktuální záznam vyskakovacího okna“ atd.)
- **Malý snímek** aktuálního běhového prostředí (používaný pro prompt)

### 1) `await ctx.getApiInfos(options?)` (Statické API informace)

### 2) `await ctx.getVarInfos(options?)` (Informace o struktuře proměnných)

- Sestaveno na základě `defineProperty(...).meta` (včetně meta factory)
- Podporuje ořezávání `path` a řízení hloubky `maxDepth`
- Rozbaluje se směrem dolů pouze v případě potřeby

Časté parametry:

- `maxDepth`: Maximální úroveň rozbalení (výchozí 3)
- `path: string | string[]`: Ořezání, výstup pouze podstromu zadané cesty

### 3) `await ctx.getEnvInfos()` (Snímek běhového prostředí)

Struktura uzlu (zjednodušená):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Lze přímo použít pro await ctx.getVar(getVar), začíná na "ctx."
  value?: any; // Již analyzovaná/serializovatelná statická hodnota
  properties?: Record<string, EnvNode>;
};
```