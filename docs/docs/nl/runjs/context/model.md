:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/model) voor nauwkeurige informatie.
:::

# ctx.model

De `FlowModel`-instantie waar de huidige RunJS-uitvoeringscontext zich bevindt. Het dient als het standaard toegangspunt voor scenario's zoals JSBlock, JSField en JSAction. Het specifieke type varieert afhankelijk van de context: het kan een subklasse zijn zoals `BlockModel`, `ActionModel` of `JSEditableFieldModel`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | `ctx.model` is het huidige blokmodel. U heeft toegang tot `resource`, `collectie`, `setProps`, enz. |
| **JSField / JSItem / JSColumn** | `ctx.model` is het veldmodel. U heeft toegang tot `setProps`, `dispatchEvent`, enz. |
| **Actie-gebeurtenissen / ActionModel** | `ctx.model` is het actiemodel. U kunt stapparameters lezen/schrijven, gebeurtenissen verzenden, enz. |

> Tip: Als u toegang wilt tot het **bovenliggende blok dat de huidige JS bevat** (bijv. een formulier- of tabelblok), gebruik dan `ctx.blockModel`. Gebruik `ctx.getModel(uid)` om toegang te krijgen tot **andere modellen**.

## Type-definitie

```ts
model: FlowModel;
```

`FlowModel` is de basisklasse. Tijdens runtime is het een instantie van verschillende subklassen (zoals `BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel`, enz.). De beschikbare eigenschappen en methoden zijn afhankelijk van het specifieke type.

## Veelvoorkomende eigenschappen

| Eigenschap | Type | Beschrijving |
|------|------|------|
| `uid` | `string` | Unieke identificatie van het model. Kan worden gebruikt voor `ctx.getModel(uid)` of UID-binding voor pop-ups. |
| `collectie` | `Collection` | De collectie die aan het huidige model is gekoppeld (bestaat wanneer het blok/veld aan gegevens is gekoppeld). |
| `resource` | `Resource` | Geassocieerde resource-instantie, gebruikt voor het vernieuwen, ophalen van geselecteerde rijen, enz. |
| `props` | `object` | UI/gedragsconfiguratie van het model. Kan worden bijgewerkt met `setProps`. |
| `subModels` | `Record<string, FlowModel>` | Verzameling van submodellen (bijv. velden in een formulier, kolommen in een tabel). |
| `parent` | `FlowModel` | Bovenliggend model (indien aanwezig). |

## Veelvoorkomende methoden

| Methode | Beschrijving |
|------|------|
| `setProps(partialProps: any): void` | Werkt de modelconfiguratie bij en activeert opnieuw renderen (bijv. `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | Verzendt een gebeurtenis naar het model, waardoor workflows worden geactiveerd die op dat model zijn geconfigureerd en naar de gebeurtenisnaam luisteren. Optionele `payload` wordt doorgegeven aan de workflow-handler; `options.debounce` kan debouncing inschakelen. |
| `getStepParams?.(flowKey, stepKey)` | Leest stapparameters van de configuratie-workflow (gebruikt in instellingenpanelen, aangepaste acties, enz.). |
| `setStepParams?.(flowKey, stepKey, params)` | Schrijft stapparameters van de configuratie-workflow. |

## Relatie met ctx.blockModel en ctx.getModel

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Model van de huidige uitvoeringscontext** | `ctx.model` |
| **Bovenliggend blok van de huidige JS** | `ctx.blockModel`. Vaak gebruikt voor toegang tot `resource`, `form` of `collectie`. |
| **Haal een willekeurig model op via UID** | `ctx.getModel(uid)` of `ctx.getModel(uid, true)` (zoeken over weergavestacks heen). |

In een JSField is `ctx.model` het veldmodel, terwijl `ctx.blockModel` het formulier- of tabelblok is dat dat veld bevat.

## Voorbeelden

### Blok-/actiestatus bijwerken

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### Modelevents verzenden

```ts
// Verzend een event om een workflow te activeren die op dit model is geconfigureerd en naar deze eventnaam luistert
await ctx.model.dispatchEvent('remove');

// Wanneer een payload wordt meegegeven, wordt deze doorgegeven aan de ctx.inputArgs van de workflow-handler
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### UID gebruiken voor pop-upbinding of toegang tussen modellen

```ts
const myUid = ctx.model.uid;
// In de pop-upconfiguratie kunt u openerUid: myUid doorgeven voor associatie
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## Gerelateerd

- [ctx.blockModel](./block-model.md): Het bovenliggende blokmodel waar de huidige JS zich bevindt.
- [ctx.getModel()](./get-model.md): Andere modellen ophalen via UID.