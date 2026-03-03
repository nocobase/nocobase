:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/set-value) voor nauwkeurige informatie.
:::

# ctx.setValue()

Stelt de waarde van het huidige veld in bij scenario's met bewerkbare velden, zoals JSField en JSItem. In combinatie met `ctx.getValue()` maakt dit tweerichtingsbinding (two-way binding) met het formulier mogelijk.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField** | Schrijf door de gebruiker geselecteerde of berekende waarden in bewerkbare aangepaste velden. |
| **JSItem** | Werk de huidige celwaarde bij in bewerkbare items van tabellen/subtabellen. |
| **JSColumn** | Werk de veldwaarde van de bijbehorende rij bij op basis van logica tijdens het renderen van tabelkolommen. |

> **Let op**: `ctx.setValue(v)` is alleen beschikbaar in RunJS-contexten met formulierbinding. Het is niet beschikbaar in scenario's zonder veldbinding, zoals workflows, koppelingsregels of JSBlock. Het wordt aanbevolen om optionele chaining te gebruiken voor gebruik: `ctx.setValue?.(value)`.

## Type-definitie

```ts
setValue<T = any>(value: T): void;
```

- **Parameters**: `value` is de veldwaarde die moet worden geschreven. Het type wordt bepaald door het type formulieritem van het veld.

## Gedrag

- `ctx.setValue(v)` werkt de waarde van het huidige veld in het Ant Design Form bij en activeert de bijbehorende formulierkoppelingen en validatielogica.
- Als het formulier nog niet volledig is gerenderd of het veld niet is geregistreerd, kan de aanroep ineffectief zijn. Het wordt aanbevolen om `ctx.getValue()` te gebruiken om het resultaat van het schrijven te bevestigen.

## Voorbeelden

### Tweerichtingsbinding met getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Standaardwaarden instellen op basis van voorwaarden

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Terugschrijven naar het huidige veld bij koppeling met andere velden

```ts
// Werk het huidige veld synchroon bij wanneer een ander veld verandert
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Aangepast', value: 'custom' });
}
```

## Opmerkingen

- In niet-bewerkbare velden (bijv. JSField in detailmodus, JSBlock) kan `ctx.setValue` `undefined` zijn. Het wordt aanbevolen om `ctx.setValue?.(value)` te gebruiken om fouten te voorkomen.
- Bij het instellen van waarden voor relatievelden (M2O, O2M, enz.) moet u een structuur doorgeven die overeenkomt met het veldtype (bijv. `{ id, [titleField]: label }`), afhankelijk van de specifieke veldconfiguratie.

## Gerelateerd

- [ctx.getValue()](./get-value.md) - Haal de huidige veldwaarde op, gebruikt met setValue voor tweerichtingsbinding.
- [ctx.form](./form.md) - Ant Design Form-instantie, gebruikt om andere velden te lezen of te schrijven.
- `js-field:value-change` - Een container-event dat wordt geactiveerd wanneer een externe waarde verandert, gebruikt om de weergave bij te werken.