
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Översikt över kontextsystemet

NocoBase FlowEngines kontextsystem är uppdelat i tre lager, där varje lager motsvarar ett specifikt omfång. Genom att använda dem på rätt sätt kan ni uppnå flexibel delning och isolering av tjänster, konfigurationer och data, vilket förbättrar verksamhetens underhållbarhet och skalbarhet.

- **FlowEngineContext (global kontext)**: Globalt unikt, tillgängligt för alla modeller och flöden. Lämpligt för att registrera globala tjänster, konfigurationer med mera.
- **FlowModelContext (modellkontext)**: Används för att dela kontext inom ett modellträd. Undermodeller delegerar automatiskt till föräldermodellens kontext och stöder överskrivning av namn. Lämpligt för logik och datainsolering på modellnivå.
- **FlowRuntimeContext (flödeskörningskontext)**: Skapas varje gång ett flöde körs och kvarstår under hela flödets exekveringscykel. Lämpligt för dataöverföring, variabelhantering och registrering av körstatus inom flödet. Stöder två lägen: `mode: 'runtime' | 'settings'`, som motsvarar körningsläge respektive inställningsläge.

Alla `FlowEngineContext` (global kontext), `FlowModelContext` (modellkontext), `FlowRuntimeContext` (flödeskörningskontext) med mera, är underklasser eller instanser av `FlowContext`.

---

## 🗂️ Hierarkidiagram

```text
FlowEngineContext (global kontext)
│
├── FlowModelContext (modellkontext)
│     ├── Sub FlowModelContext (undermodell)
│     │     ├── FlowRuntimeContext (flödeskörningskontext)
│     │     └── FlowRuntimeContext (flödeskörningskontext)
│     └── FlowRuntimeContext (flödeskörningskontext)
│
├── FlowModelContext (modellkontext)
│     └── FlowRuntimeContext (flödeskörningskontext)
│
└── FlowModelContext (modellkontext)
      ├── Sub FlowModelContext (undermodell)
      │     └── FlowRuntimeContext (flödeskörningskontext)
      └── FlowRuntimeContext (flödeskörningskontext)
```

- `FlowModelContext` kan komma åt `FlowEngineContexts` egenskaper och metoder via en delegeringsmekanism, vilket möjliggör delning av globala funktioner.
- En undermodells `FlowModelContext` kan komma åt föräldermodellens kontext (synkron relation) via en delegeringsmekanism, vilket stöder överskrivning av namn.
- Asynkrona förälder-barn-modeller upprättar inte en delegeringsrelation för att undvika tillståndsförorening.
- `FlowRuntimeContext` kommer alltid åt sin motsvarande `FlowModelContext` via en delegeringsmekanism, men propagerar inte ändringar uppåt.

## 🧭 Körnings- och inställningsläge (mode)

`FlowRuntimeContext` stöder två lägen, som skiljs åt av parametern `mode`:

- `mode: 'runtime'` (Körningsläge): Används under flödets faktiska exekveringsfas. Egenskaper och metoder returnerar verklig data. Till exempel:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Inställningsläge): Används under flödets design- och konfigurationsfas. Egenskapsåtkomst returnerar en variabelmallsträng, vilket underlättar val av uttryck och variabler. Till exempel:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Denna design med dubbla lägen säkerställer datatillgänglighet vid körning och underlättar variabelreferenser och uttrycksgenerering under konfiguration, vilket förbättrar FlowEngines flexibilitet och användbarhet.