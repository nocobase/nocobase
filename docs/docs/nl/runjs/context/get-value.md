:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/get-value) voor nauwkeurige informatie.
:::

# ctx.getValue()

In scenario's met bewerkbare velden, zoals JSField en JSItem, gebruikt u dit om de meest recente waarde van het huidige veld op te halen. In combinatie met `ctx.setValue(v)` maakt dit tweerichtingsbinding (two-way binding) met het formulier mogelijk.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField** | Lees gebruikersinvoer of de huidige formulierwaarde in bewerkbare aangepaste velden. |
| **JSItem** | Lees de huidige celwaarde in bewerkbare items van tabellen/subtabellen. |
| **JSColumn** | Lees de veldwaarde van de bijbehorende rij tijdens het renderen van tabelkolommen. |

> **Let op**: `ctx.getValue()` is alleen beschikbaar in RunJS-contexten met formulierbinding; deze methode bestaat niet in scenario's zonder veldbinding, zoals workflows of koppelingsregels (linkage rules).

## Type-definitie

```ts
getValue<T = any>(): T | undefined;
```

- **Retourwaarde**: De huidige veldwaarde, waarvan het type wordt bepaald door het type formulieritem van het veld; het kan `undefined` zijn als het veld niet is geregistreerd of niet is ingevuld.

## Volgorde van ophalen

`ctx.getValue()` haalt waarden op in de volgende volgorde:

1. **Formulierstatus**: Leest bij voorkeur uit de huidige status van het Ant Design Form.
2. **Fallback-waarde**: Als het veld niet in het formulier voorkomt, valt het terug op de beginwaarde of de props van het veld.

> Als het formulier nog niet volledig is gerenderd of het veld niet is geregistreerd, kan dit `undefined` retourneren.

## Voorbeelden

### Renderen op basis van de huidige waarde

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Voer eerst inhoud in</span>);
} else {
  ctx.render(<span>Huidige waarde: {current}</span>);
}
```

### Tweerichtingsbinding met setValue

```tsx
const { Input } = ctx.libs.antd;

// Lees de huidige waarde als standaardwaarde
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Gerelateerd

- [ctx.setValue()](./set-value.md) - Stelt de huidige veldwaarde in, gebruikt in combinatie met `getValue` voor tweerichtingsbinding.
- [ctx.form](./form.md) - Ant Design Form-instantie, voor het lezen/schrijven van andere velden.
- `js-field:value-change` - Container-event dat wordt geactiveerd wanneer externe waarden veranderen, gebruikt om de weergave bij te werken.