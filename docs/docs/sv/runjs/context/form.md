:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/form).
:::

# ctx.form

Ant Design Form-instansen i det aktuella blocket, som används för att läsa/skriva formulärfält, utlösa validering och inskickning. Den motsvarar `ctx.blockModel?.form` och kan användas direkt i formulärrelaterade block (Formulär, Redigeringsformulär, underformulär, etc.).

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSField** | Läsa/skriva andra formulärfält för att implementera kopplingar, eller utföra beräkningar och validering baserat på andra fältvärden. |
| **JSItem** | Läsa/skriva fält på samma rad eller andra fält i understabeller för att uppnå kopplingar inom tabellen. |
| **JSColumn** | Läsa värden från den aktuella raden eller associerade fält i en tabellkolumn för rendering. |
| **Formuläråtgärder / Arbetsflöden** | Validering före inskickning, massuppdatering av fält, återställning av formulär, etc. |

> Observera: `ctx.form` är endast tillgänglig i RunJS-kontexter relaterade till formulärblock (Formulär, Redigeringsformulär, underformulär, etc.). Den kanske inte finns i scenarier som inte rör formulär (som fristående JSBlocks eller tabellblock). Det rekommenderas att ni gör en kontroll för null-värden före användning: `ctx.form?.getFieldsValue()`.

## Typdefinition

```ts
form: FormInstance<any>;
```

`FormInstance` är instanstypen för Ant Design Form. Vanliga metoder följer nedan.

## Vanliga metoder

### Läsa formulärvärden

```ts
// Läser värden för aktuellt registrerade fält (standard är endast renderade fält)
const values = ctx.form.getFieldsValue();

// Läser värden för alla fält (inklusive registrerade men ej renderade fält, t.ex. dolda eller i hopfällda sektioner)
const allValues = ctx.form.getFieldsValue(true);

// Läser ett enskilt fält
const email = ctx.form.getFieldValue('email');

// Läser nästlade fält (t.ex. i en undertabell)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Skriva formulärvärden

```ts
// Massuppdatering (används ofta för kopplingar)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Uppdatera ett enskilt fält
ctx.form.setFieldValue('remark', 'Uppdaterad kommentar');
```

### Validering och inskickning

```ts
// Utlöser formulärvalidering
await ctx.form.validateFields();

// Utlöser inskickning av formulär
ctx.form.submit();
```

### Återställning

```ts
// Återställer alla fält
ctx.form.resetFields();

// Återställer endast specifika fält
ctx.form.resetFields(['status', 'remark']);
```

## Förhållande till relaterade kontexter

### ctx.getValue / ctx.setValue

| Scenario | Rekommenderad användning |
|------|----------|
| **Läsa/skriva aktuellt fält** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Läsa/skriva andra fält** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Inom det aktuella JS-fältet bör ni prioritera att använda `getValue`/`setValue` för att läsa/skriva till själva fältet; använd `ctx.form` när ni behöver komma åt andra fält.

### ctx.blockModel

| Behov | Rekommenderad användning |
|------|----------|
| **Läsa/skriva formulärfält** | `ctx.form` (Motsvarar `ctx.blockModel?.form`, smidigare) |
| **Komma åt föräldrablock** | `ctx.blockModel` (Innehåller `samling`, `resource`, etc.) |

### ctx.getVar('ctx.formValues')

Formulärvärden måste hämtas via `await ctx.getVar('ctx.formValues')` och exponeras inte direkt som `ctx.formValues`. I en formulärkontext är det att föredra att använda `ctx.form.getFieldsValue()` för att läsa de senaste värdena i realtid.

## Observera

- `getFieldsValue()` returnerar som standard endast renderade fält. För att inkludera icke-renderade fält (t.ex. i hopfällda sektioner eller dolda via villkorsstyrda regler), skicka med `true`: `getFieldsValue(true)`.
- Sökvägar för nästlade fält som undertabeller är arrayer, t.ex. `['orders', 0, 'amount']`. Ni kan använda `ctx.namePath` för att hämta det aktuella fältets sökväg och konstruera sökvägar för andra kolumner på samma rad.
- `validateFields()` kastar ett felobjekt som innehåller `errorFields` och annan information. Om valideringen misslyckas före inskickning kan ni använda `ctx.exit()` för att avbryta efterföljande steg.
- I asynkrona scenarier som arbetsflöden eller kopplingsregler kan det hända att `ctx.form` ännu inte är redo. Det rekommenderas att använda valfri kedjning (optional chaining) eller kontroller för null-värden.

## Exempel

### Fältkoppling: Visa olika innehåll baserat på typ

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Beräkna aktuellt fält baserat på andra fält

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Läsa/skriva andra kolumner på samma rad i en undertabell

```ts
// ctx.namePath är sökvägen för det aktuella fältet i formuläret, t.ex. ['orders', 0, 'amount']
// Läser 'status' på samma rad: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validering före inskickning

```ts
try {
  await ctx.form.validateFields();
  // Validering godkänd, fortsätt med logik för inskickning
} catch (e) {
  ctx.message.error('Vänligen kontrollera formulärfälten');
  ctx.exit();
}
```

### Skicka efter bekräftelse

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Bekräfta inskickning',
  content: 'Du kommer inte att kunna ändra detta efter inskickning. Fortsätta?',
  okText: 'Bekräfta',
  cancelText: 'Avbryt',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Avbryt om användaren avbryter
}
```

## Relaterat

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Läsa och skriva det aktuella fältvärdet.
- [ctx.blockModel](./block-model.md): Modell för föräldrablock; `ctx.form` motsvarar `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Bekräftelsedialoger, används ofta tillsammans med `ctx.form.validateFields()` och `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Avbryt processen vid valideringsfel eller om användaren avbryter.
- `ctx.namePath`: Sökvägen (array) för det aktuella fältet i formuläret, används för att konstruera namn för `getFieldValue` / `setFieldValue` i nästlade fält.