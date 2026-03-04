:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/flow-engine/flow-context).
:::

# Översikt över kontextsystemet

NocoBase flödesmotors kontextsystem är uppdelat i tre lager, som motsvarar olika omfång. Genom att använda dem på ett rimligt sätt kan ni uppnå flexibel delning och isolering av tjänster, konfigurationer och data, vilket förbättrar verksamhetens underhållbarhet och skalbarhet.

- **FlowEngineContext (global kontext)**: Globalt unik, tillgänglig för alla modeller och flöden, lämplig för att registrera globala tjänster, konfigurationer etc.
- **FlowModelContext (modellkontext)**: Används för att dela kontext inom ett modellträd, där undermodeller automatiskt delegerar till föräldramodellens kontext, stöder överskrivning med samma namn, lämplig för logik och dataisolering på modellnivå.
- **FlowRuntimeContext (flödeskörningskontext)**: Skapas vid varje flödeskörning och genomlöper hela flödets körningscykel, lämplig för dataöverföring, variabelagring, registrering av körstatus etc. i flödet. Stöder två lägen `mode: 'runtime' | 'settings'`, som motsvarar körningsläge respektive inställningsläge.

Alla `FlowEngineContext` (global kontext), `FlowModelContext` (modellkontext), `FlowRuntimeContext` (flödeskörningskontext) etc. är underklasser eller instanser av `FlowContext`.

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

- `FlowModelContext` kan via en delegeringsmekanism (delegate) komma åt egenskaper och metoder i `FlowEngineContext` för att uppnå delning av global förmåga.
- Undermodellers `FlowModelContext` kan via en delegeringsmekanism (delegate) komma åt föräldramodellens kontext (synkront förhållande), vilket stöder överskrivning med samma namn.
- Asynkrona föräldra-barn-modeller upprättar inte en delegeringsrelation (delegate) för att undvika tillståndsförorening.
- `FlowRuntimeContext` använder alltid en delegeringsmekanism (delegate) för att komma åt sin motsvarande `FlowModelContext`, men skickar inte tillbaka information uppåt.

---

## 🧭 Körningsläge och inställningsläge (mode)

`FlowRuntimeContext` stöder två lägen, som skiljs åt via parametern `mode`:

- `mode: 'runtime'` (körningsläge): Används under flödets faktiska exekveringsfas, där egenskaper och metoder returnerar verkliga data. Till exempel:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (inställningsläge): Används under flödets design- och konfigurationsfas, där åtkomst till egenskaper returnerar variabelmallsträngar, vilket underlättar val av uttryck och variabler. Till exempel:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Denna dubbellägesdesign säkerställer både datatillgänglighet vid körning och underlättar variabelreferenser och uttrycksgenerering vid konfiguration, vilket förbättrar flödesmotorns flexibilitet och användarvänlighet.

---

## 🤖 Kontextinformation för verktyg/stora språkmodeller

I vissa scenarier (till exempel RunJS-kodredigering i JS*Model, AI-kodning) behöver "anroparen" förstå följande utan att köra koden:

- Vilka **statiska förmågor** som finns under nuvarande `ctx` (API-dokumentation, parametrar, exempel, dokumentationslänkar etc.)
- Vilka **valbara variabler** som finns i nuvarande gränssnitt/körningsläge (till exempel dynamiska strukturer som "aktuell post", "aktuell popup-post" etc.)
- En **liten ögonblicksbild** av den aktuella körningsmiljön (för prompt-användning)

### 1) `await ctx.getApiInfos(options?)` (Statisk API-information)

### 2) `await ctx.getVarInfos(options?)` (Information om variabelstruktur)

- Bygger variabelstruktur baserat på `defineProperty(...).meta` (inklusive meta factory)
- Stöder beskärning med `path` och djupkontroll med `maxDepth`
- Expanderar nedåt endast vid behov

Vanliga parametrar:

- `maxDepth`: Maximal expansionsnivå (standard 3)
- `path: string | string[]`: Beskärning, matar endast ut underträd för angiven sökväg

### 3) `await ctx.getEnvInfos()` (Ögonblicksbild av körningsmiljö)

Nodstruktur (förenklad):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Kan användas direkt för await ctx.getVar(getVar), börjar med "ctx."
  value?: any; // Upplöst/serialiserbart statiskt värde
  properties?: Record<string, EnvNode>;
};
```