:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/block-model) voor nauwkeurige informatie.
:::

# ctx.blockModel

Het bovenliggende blokmodel (BlockModel-instantie) waarin het huidige JS-veld / JS-blok zich bevindt. In scenario's zoals JSField, JSItem en JSColumn verwijst `ctx.blockModel` naar het formulierblok of tabelblok dat de huidige JS-logica bevat. In een onafhankelijk JSBlock kan dit `null` zijn of hetzelfde als `ctx.model`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField** | Toegang tot de `form`, `collectie` en `resource` van het bovenliggende formulierblok binnen een formulierveld om koppelingen of validatie te implementeren. |
| **JSItem** | Toegang tot de resource- en collectie-informatie van het bovenliggende tabel-/formulierblok binnen een subtabel-item. |
| **JSColumn** | Toegang tot de `resource` (bijv. `getSelectedRows`) en `collectie` van het bovenliggende tabelblok binnen een tabelkolom. |
| **Formulieracties / FlowEngine** | Toegang tot `form` voor validatie vóór indiening, `resource` voor verversen, enz. |

> Let op: `ctx.blockModel` is alleen beschikbaar in RunJS-contexten waar een bovenliggend blok bestaat. In onafhankelijke JSBlocks (zonder bovenliggend formulier/tabel) kan dit `null` zijn. Het wordt aanbevolen om een controle op nulwaarden uit te voeren voor gebruik.

## Type-definitie

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Het specifieke type hangt af van het type bovenliggend blok: formulierblokken zijn meestal `FormBlockModel` of `EditFormModel`, terwijl tabelblokken meestal `TableBlockModel` zijn.

## Veelvoorkomende eigenschappen

| Eigenschap | Type | Beschrijving |
|------|------|------|
| `uid` | `string` | Unieke identificatie van het blokmodel. |
| `collection` | `Collection` | De collectie die aan het huidige blok is gekoppeld. |
| `resource` | `Resource` | De resource-instantie die door het blok wordt gebruikt (`SingleRecordResource` / `MultiRecordResource`, enz.). |
| `form` | `FormInstance` | Formulierblok: Ant Design Form-instantie, ondersteunt `getFieldsValue`, `validateFields`, `setFieldsValue`, enz. |
| `emitter` | `EventEmitter` | Event emitter, gebruikt om te luisteren naar `formValuesChange`, `onFieldReset`, enz. |

## Relatie met ctx.model en ctx.form

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Bovenliggend blok van de huidige JS** | `ctx.blockModel` |
| **Formuliervelden lezen/schrijven** | `ctx.form` (gelijk aan `ctx.blockModel?.form`, handiger in formulierblokken) |
| **Model van de huidige uitvoeringscontext** | `ctx.model` (veldmodel in JSField, blokmodel in JSBlock) |

In een JSField is `ctx.model` het veldmodel en `ctx.blockModel` het formulier- of tabelblok dat dat veld bevat; `ctx.form` is doorgaans `ctx.blockModel.form`.

## Voorbeelden

### Tabel: Geselecteerde rijen ophalen en verwerken

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Selecteer eerst gegevens');
  return;
}
```

### Formulierscenario: Valideren en verversen

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Luisteren naar formulierwijzigingen

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementeer koppelingen of opnieuw renderen op basis van de nieuwste formulierwaarden
});
```

### Opnieuw renderen van blok activeren

```ts
ctx.blockModel?.rerender?.();
```

## Opmerkingen

- In een **onafhankelijk JSBlock** (zonder bovenliggend formulier- of tabelblok) kan `ctx.blockModel` `null` zijn. Het wordt aanbevolen om optionele chaining te gebruiken bij toegang tot de eigenschappen: `ctx.blockModel?.resource?.refresh?.()`.
- In **JSField / JSItem / JSColumn** verwijst `ctx.blockModel` naar het formulier- of tabelblok dat het huidige veld bevat. In een **JSBlock** kan dit het blok zelf zijn of een blok op een hoger niveau, afhankelijk van de werkelijke hiërarchie.
- `resource` bestaat alleen in gegevensblokken; `form` bestaat alleen in formulierblokken. Tabelblokken hebben doorgaans geen `form`.

## Gerelateerd

- [ctx.model](./model.md): Het model van de huidige uitvoeringscontext.
- [ctx.form](./form.md): Formulier-instantie, veelgebruikt in formulierblokken.
- [ctx.resource](./resource.md): Resource-instantie (gelijk aan `ctx.blockModel?.resource`, direct gebruiken indien beschikbaar).
- [ctx.getModel()](./get-model.md): Andere blokmodellen ophalen via UID.