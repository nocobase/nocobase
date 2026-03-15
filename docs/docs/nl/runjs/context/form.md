:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/form) voor nauwkeurige informatie.
:::

# ctx.form

De Ant Design Form-instantie binnen het huidige blok, gebruikt voor het lezen/schrijven van formuliervelden, het triggeren van validatie en indiening. Het is gelijk aan `ctx.blockModel?.form` en kan direct worden gebruikt in formuliergerelateerde blokken (Formulier, Bewerkingsformulier, Subformulier, enz.).

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField** | Andere formuliervelden lezen/schrijven om koppelingen te implementeren, of berekeningen en validaties uitvoeren op basis van andere veldwaarden. |
| **JSItem** | Velden op dezelfde rij of andere velden binnen sub-tabelitems lezen/schrijven om koppelingen binnen de tabel te realiseren. |
| **JSColumn** | De huidige rij of geassocieerde veldwaarden in een tabelkolom lezen voor weergave (rendering). |
| **Formulieracties / Workflow** | Validatie vóór indiening, batchgewijs bijwerken van velden, formulieren resetten, enz. |

> **Let op:** `ctx.form` is alleen beschikbaar in RunJS-contexten die gerelateerd zijn aan formulierblokken (Formulier, Bewerkingsformulier, Subformulier, enz.). In niet-formulierscenario's (zoals onafhankelijke JSBlocks of tabelblokken) is deze mogelijk niet aanwezig. Het wordt aanbevolen om een null-check uit te voeren voor gebruik: `ctx.form?.getFieldsValue()`.

## Type-definitie

```ts
form: FormInstance<any>;
```

`FormInstance` is het instantietype van Ant Design Form. Veelgebruikte methoden zijn als volgt.

## Veelgebruikte methoden

### Formulierwaarden lezen

```ts
// Waarden van momenteel geregistreerde velden lezen (standaard alleen gerenderde velden)
const values = ctx.form.getFieldsValue();

// Waarden van alle velden lezen (inclusief geregistreerde maar niet-gerenderde velden, bijv. verborgen of binnen ingeklapte secties)
const allValues = ctx.form.getFieldsValue(true);

// Een enkel veld lezen
const email = ctx.form.getFieldValue('email');

// Geneste velden lezen (bijv. in een sub-tabel)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Formulierwaarden schrijven

```ts
// Batchgewijs bijwerken (vaak gebruikt voor koppelingen)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Een enkel veld bijwerken
ctx.form.setFieldValue('remark', 'Opmerking bijgewerkt');
```

### Validatie en indiening

```ts
// Formuliervalidatie triggeren
await ctx.form.validateFields();

// Formulierindiening triggeren
ctx.form.submit();
```

### Resetten

```ts
// Alle velden resetten
ctx.form.resetFields();

// Alleen specifieke velden resetten
ctx.form.resetFields(['status', 'remark']);
```

## Relatie met gerelateerde contexten

### ctx.getValue / ctx.setValue

| Scenario | Aanbevolen gebruik |
|------|----------|
| **Huidig veld lezen/schrijven** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Andere velden lezen/schrijven** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Gebruik binnen het huidige JS-veld bij voorkeur `getValue`/`setValue` om het veld zelf te lezen of te schrijven; gebruik `ctx.form` wanneer u toegang nodig heeft tot andere velden.

### ctx.blockModel

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Formuliervelden lezen/schrijven** | `ctx.form` (Gelijk aan `ctx.blockModel?.form`, maar handiger) |
| **Toegang tot bovenliggend blok** | `ctx.blockModel` (Bevat `collectie`, `resource`, enz.) |

### ctx.getVar('ctx.formValues')

Formulierwaarden moeten worden verkregen via `await ctx.getVar('ctx.formValues')` en worden niet direct blootgesteld als `ctx.formValues`. In een formuliercontext heeft het de voorkeur om `ctx.form.getFieldsValue()` te gebruiken om de nieuwste waarden in realtime te lezen.

## Aandachtspunten

- `getFieldsValue()` retourneert standaard alleen gerenderde velden. Om niet-gerenderde velden op te nemen (bijv. in ingeklapte secties of velden die verborgen zijn door voorwaardelijke regels), geeft u `true` mee: `getFieldsValue(true)`.
- Paden voor geneste velden zoals sub-tabellen zijn arrays, bijv. `['orders', 0, 'amount']`. U kunt `ctx.namePath` gebruiken om het pad van het huidige veld op te halen en paden voor andere kolommen in dezelfde rij te construeren.
- `validateFields()` gooit een foutobject met `errorFields` en andere informatie. Als de validatie mislukt vóór indiening, kunt u `ctx.exit()` gebruiken om vervolgstappen te beëindigen.
- In asynchrone scenario's zoals workflows of koppelingsregels is `ctx.form` mogelijk nog niet gereed. Het wordt aanbevolen om optional chaining of null-checks te gebruiken.

## Voorbeelden

### Veldkoppeling: Verschillende inhoud weergeven op basis van type

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Huidig veld berekenen op basis van andere velden

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Andere kolommen in dezelfde rij lezen/schrijven binnen een sub-tabel

```ts
// ctx.namePath is het pad van het huidige veld in het formulier, bijv. ['orders', 0, 'amount']
// Lees 'status' in dezelfde rij: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validatie vóór indiening

```ts
try {
  await ctx.form.validateFields();
  // Validatie geslaagd, ga verder met de indieningslogica
} catch (e) {
  ctx.message.error('Controleer de formuliervelden');
  ctx.exit();
}
```

### Indienen na bevestiging

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Bevestig indiening',
  content: 'U kunt dit na indiening niet meer wijzigen. Doorgaan?',
  okText: 'Bevestigen',
  cancelText: 'Annuleren',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Beëindigen als de gebruiker annuleert
}
```

## Gerelateerd

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Huidige veldwaarde lezen en schrijven.
- [ctx.blockModel](./block-model.md): Bovenliggend blokmodel; `ctx.form` is gelijk aan `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Bevestigingsvensters, vaak gebruikt in combinatie met `ctx.form.validateFields()` en `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Het proces beëindigen bij een validatiefout of annulering door de gebruiker.
- `ctx.namePath`: Het pad (array) van het huidige veld in het formulier, gebruikt om namen te construeren voor `getFieldValue` / `setFieldValue` in geneste velden.