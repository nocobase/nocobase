:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/flow-engine/flow-context) voor nauwkeurige informatie.
:::

# Overzicht van het contextsysteem

Het contextsysteem van de NocoBase flow-engine is verdeeld in drie lagen, die elk overeenkomen met een ander bereik. Een correct gebruik maakt flexibele deling en isolatie van services, configuraties en gegevens mogelijk, wat de onderhoudbaarheid en uitbreidbaarheid van de business verbetert.

- **FlowEngineContext (globale context)**: Globaal uniek, toegankelijk voor alle modellen en flows, geschikt voor het registreren van globale services, configuraties, enz.
- **FlowModelContext (modelcontext)**: Wordt gebruikt voor het delen van context binnen een modelboom; submodellen delegeren automatisch naar de context van het bovenliggende model, ondersteunt overschrijven met dezelfde naam, geschikt voor logica- en gegevensisolatie op modelniveau.
- **FlowRuntimeContext (flow-runtimecontext)**: Wordt aangemaakt bij elke uitvoering van een flow en loopt door de gehele uitvoeringscyclus van de flow; geschikt voor gegevensoverdracht, opslag van variabelen, registratie van de uitvoeringsstatus, enz. in de flow. Ondersteunt twee modi: `mode: 'runtime' | 'settings'`, die respectievelijk overeenkomen met de runtime-status en de configuratiestatus.

Alle `FlowEngineContext` (globale context), `FlowModelContext` (modelcontext), `FlowRuntimeContext` (flow-runtimecontext), enz., zijn subklassen of instanties van `FlowContext`.

---

## 🗂️ Hiërarchiediagram

```text
FlowEngineContext (globale context)
│
├── FlowModelContext (modelcontext)
│     ├── Sub-FlowModelContext (submodel)
│     │     ├── FlowRuntimeContext (flow-runtimecontext)
│     │     └── FlowRuntimeContext (flow-runtimecontext)
│     └── FlowRuntimeContext (flow-runtimecontext)
│
├── FlowModelContext (modelcontext)
│     └── FlowRuntimeContext (flow-runtimecontext)
│
└── FlowModelContext (modelcontext)
      ├── Sub-FlowModelContext (submodel)
      │     └── FlowRuntimeContext (flow-runtimecontext)
      └── FlowRuntimeContext (flow-runtimecontext)
```

- `FlowModelContext` heeft via een delegatiemechanisme (delegate) toegang tot de eigenschappen en methoden van `FlowEngineContext`, waardoor globale mogelijkheden worden gedeeld.
- De `FlowModelContext` van een submodel heeft via een delegatiemechanisme (delegate) toegang tot de context van het bovenliggende model (synchrone relatie), ondersteunt overschrijven met dezelfde naam.
- Asynchrone bovenliggende en onderliggende modellen bouwen geen delegatierelatie (delegate) op om statusvervuiling te voorkomen.
- `FlowRuntimeContext` heeft altijd via een delegatiemechanisme (delegate) toegang tot de bijbehorende `FlowModelContext`, maar geeft dit niet naar boven door.

---

## 🧭 Runtime-status en configuratiestatus (mode)

`FlowRuntimeContext` ondersteunt twee modi, onderscheiden door de parameter `mode`:

- `mode: 'runtime'` (runtime-status): Wordt gebruikt voor de daadwerkelijke uitvoeringsfase van de flow, eigenschappen en methoden retourneren echte gegevens. Bijvoorbeeld:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (configuratiestatus): Wordt gebruikt voor de ontwerpfase en configuratiefase van de flow, toegang tot eigenschappen retourneert een variabele sjabloonstring, wat de selectie van expressies en variabelen vergemakkelijkt. Bijvoorbeeld:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Dit ontwerp met twee modi garandeert zowel de beschikbaarheid van gegevens tijdens runtime als het gemak van variabelereferenties en het genereren van expressies tijdens de configuratie, wat de flexibiliteit en het gebruiksgemak van de flow-engine verbetert.

---

## 🤖 Contextinformatie voor tools/LLM's

In bepaalde scenario's (zoals RunJS-codebewerking in JS*Model, AI-coding) moet de "aanroepende partij" het volgende begrijpen zonder de code uit te voeren:

- Welke **statische mogelijkheden** er zijn onder de huidige `ctx` (API-documentatie, parameters, voorbeelden, documentatielinks, enz.)
- Welke **selecteerbare variabelen** er zijn in de huidige interface/runtime-status (bijv. dynamische structuren zoals "huidig record", "huidig pop-uprecord", enz.)
- Een **kleine momentopname** van de huidige runtime-omgeving (voor prompts)

### 1) `await ctx.getApiInfos(options?)` (Statische API-informatie)

### 2) `await ctx.getVarInfos(options?)` (Informatie over variabelestructuur)

- Gebouwd op basis van `defineProperty(...).meta` (inclusief meta-factory)
- Ondersteunt `path`-bijsnijden en `maxDepth`-dieptecontrole
- Wordt alleen naar beneden uitgeklapt wanneer dat nodig is

Veelgebruikte parameters:

- `maxDepth`: maximaal uitklapniveau (standaard 3)
- `path: string | string[]`: bijsnijden, voert alleen de subboom van het opgegeven pad uit

### 3) `await ctx.getEnvInfos()` (Momentopname van runtime-omgeving)

Knooppuntstructuur (vereenvoudigd):

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Kan direct worden gebruikt voor await ctx.getVar(getVar), beginnend met "ctx."
  value?: any; // Reeds geparsede/serialiseerbare statische waarde
  properties?: Record<string, EnvNode>;
};
```