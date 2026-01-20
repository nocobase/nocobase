
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Přehled systému kontextů

Systém kontextů enginu pracovních postupů NocoBase je rozdělen do tří vrstev, z nichž každá má svůj vlastní rozsah působnosti (scope). Správné použití umožňuje flexibilní sdílení a izolaci služeb, konfigurací a dat, čímž se zlepšuje udržovatelnost a škálovatelnost vašich obchodních procesů.

- **FlowEngineContext (globální kontext)**: Globálně unikátní, dostupný pro všechny modely a pracovní postupy, vhodný pro registraci globálních služeb, konfigurací apod.
- **FlowModelContext (kontext modelu)**: Používá se pro sdílení kontextu v rámci stromu modelů. Podmodely automaticky delegují na kontext rodičovského modelu, s podporou přepsání se stejným názvem. Vhodný pro izolaci logiky a dat na úrovni modelu.
- **FlowRuntimeContext (kontext běhu pracovního postupu)**: Vytváří se při každém spuštění pracovního postupu a přetrvává po celý cyklus jeho provádění. Vhodný pro předávání dat, ukládání proměnných a záznam stavu běhu v rámci pracovního postupu. Podporuje dva režimy: `mode: 'runtime' | 'settings'`, které odpovídají režimu běhu a režimu nastavení.

Všechny `FlowEngineContext` (globální kontext), `FlowModelContext` (kontext modelu), `FlowRuntimeContext` (kontext běhu pracovního postupu) atd. jsou podtřídami nebo instancemi `FlowContext`.

---

## 🗂️ Diagram hierarchie

```text
FlowEngineContext (globální kontext)
│
├── FlowModelContext (kontext modelu)
│     ├── Sub FlowModelContext (podmodel)
│     │     ├── FlowRuntimeContext (kontext běhu pracovního postupu)
│     │     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│
├── FlowModelContext (kontext modelu)
│     └── FlowRuntimeContext (kontext běhu pracovního postupu)
│
└── FlowModelContext (kontext modelu)
      ├── Sub FlowModelContext (podmodel)
      │     └── FlowRuntimeContext (kontext běhu pracovního postupu)
      └── FlowRuntimeContext (kontext běhu pracovního postupu)
```

- `FlowModelContext` může přistupovat k vlastnostem a metodám `FlowEngineContext` prostřednictvím mechanismu delegování, což umožňuje sdílení globálních funkcí.
- `FlowModelContext` podmodelu může přistupovat ke kontextu rodičovského modelu (synchronní vztah) prostřednictvím mechanismu delegování, s podporou přepsání se stejným názvem.
- Asynchronní rodičovské a podřízené modely nevytvářejí vztah delegování, aby se zabránilo znečištění stavu.
- `FlowRuntimeContext` vždy přistupuje ke svému odpovídajícímu `FlowModelContext` prostřednictvím mechanismu delegování, ale nešíří změny nahoru.

## 🧭 Režim běhu a nastavení (mode)

`FlowRuntimeContext` podporuje dva režimy, které se rozlišují parametrem `mode`:

- `mode: 'runtime'` (režim běhu): Používá se během skutečné fáze provádění pracovního postupu. Vlastnosti a metody vracejí reálná data. Například:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (režim nastavení): Používá se během fáze návrhu a konfigurace pracovního postupu. Přístup k vlastnostem vrací řetězec šablony proměnné, což usnadňuje výběr výrazů a proměnných. Například:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Tento dvourežimový design zajišťuje dostupnost dat za běhu a zároveň usnadňuje odkazování na proměnné a generování výrazů během konfigurace, čímž zvyšuje flexibilitu a použitelnost enginu pracovních postupů.