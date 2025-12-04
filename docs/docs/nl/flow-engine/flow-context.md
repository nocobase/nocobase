
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Overzicht van het Contextsysteem

Het contextsysteem van de NocoBase FlowEngine is verdeeld in drie lagen, elk met een eigen bereik. Door deze lagen correct te gebruiken, kunt u services, configuraties en gegevens flexibel delen en isoleren, wat de onderhoudbaarheid en schaalbaarheid van uw bedrijfsprocessen verbetert.

- **FlowEngineContext (Globale Context)**: Globaal uniek en toegankelijk voor alle modellen en flows. Geschikt voor het registreren van globale services, configuraties, enzovoort.
- **FlowModelContext (Model Context)**: Wordt gebruikt voor het delen van context binnen een modelboom. Submodellen delegeren automatisch naar de context van het bovenliggende model, waarbij overschrijven met dezelfde naam wordt ondersteund. Geschikt voor logica- en data-isolatie op modelniveau.
- **FlowRuntimeContext (Flow Runtime Context)**: Wordt aangemaakt telkens wanneer een flow wordt uitgevoerd en blijft bestaan gedurende de gehele uitvoeringscyclus van de flow. Geschikt voor het doorgeven van gegevens, het opslaan van variabelen en het vastleggen van de uitvoeringsstatus binnen de flow. Ondersteunt twee modi: `mode: 'runtime' | 'settings'`, die respectievelijk overeenkomen met de runtime-modus en de configuratiemodus.

Alle `FlowEngineContext` (Globale Context), `FlowModelContext` (Model Context), `FlowRuntimeContext` (Flow Runtime Context), enzovoort, zijn subklassen of instanties van `FlowContext`.

---

## 🗂️ Hiërarchiediagram

```text
FlowEngineContext (Globale Context)
│
├── FlowModelContext (Model Context)
│     ├── Sub FlowModelContext (Submodel)
│     │     ├── FlowRuntimeContext (Flow Runtime Context)
│     │     └── FlowRuntimeContext (Flow Runtime Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
├── FlowModelContext (Model Context)
│     └── FlowRuntimeContext (Flow Runtime Context)
│
└── FlowModelContext (Model Context)
      ├── Sub FlowModelContext (Submodel)
      │     └── FlowRuntimeContext (Flow Runtime Context)
      └── FlowRuntimeContext (Flow Runtime Context)
```

- `FlowModelContext` heeft via een delegatiemechanisme toegang tot de eigenschappen en methoden van `FlowEngineContext`, waardoor globale functionaliteiten kunnen worden gedeeld.
- De `FlowModelContext` van een submodel heeft via een delegatiemechanisme toegang tot de context van het bovenliggende model (synchrone relatie), waarbij overschrijven met dezelfde naam wordt ondersteund.
- Asynchrone bovenliggende en onderliggende modellen leggen geen delegatierelatie vast om statusvervuiling te voorkomen.
- `FlowRuntimeContext` heeft altijd via een delegatiemechanisme toegang tot de bijbehorende `FlowModelContext`, maar geeft wijzigingen niet door naar boven.

## 🧭 Runtime- en Configuratiemodus (mode)

`FlowRuntimeContext` ondersteunt twee modi, die worden onderscheiden door de `mode`-parameter:

- `mode: 'runtime'` (Runtime-modus): Wordt gebruikt tijdens de daadwerkelijke uitvoeringsfase van de flow. Eigenschappen en methoden retourneren echte gegevens. Bijvoorbeeld:
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Configuratiemodus): Wordt gebruikt tijdens de ontwerpfase en configuratiefase van de flow. Toegang tot eigenschappen retourneert een variabele sjabloonstring, wat de selectie van expressies en variabelen vergemakkelijkt. Bijvoorbeeld:
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Dit dual-mode ontwerp zorgt voor de beschikbaarheid van gegevens tijdens runtime en vergemakkelijkt het verwijzen naar variabelen en het genereren van expressies tijdens de configuratie, wat de flexibiliteit en bruikbaarheid van de FlowEngine verbetert.