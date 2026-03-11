:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/form).
:::

# ctx.form

Instance Ant Design Form v aktuálním bloku, která se používá pro čtení a zápis polí formuláře, spouštění validace a odesílání. Je ekvivalentní k `ctx.blockModel?.form` a lze ji přímo použít v blocích souvisejících s formuláři (Formulář, Editační formulář, Podformulář atd.).

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSField** | Čtení/zápis jiných polí formuláře pro realizaci vazeb (linkage), výpočty nebo validaci na základě hodnot jiných polí. |
| **JSItem** | Čtení/zápis polí ve stejném řádku nebo jiných polí v položkách podtabulky pro realizaci vazeb v rámci tabulky. |
| **JSColumn** | Čtení hodnot aktuálního řádku nebo asociovaných polí ve sloupci tabulky pro účely vykreslování. |
| **Formulářové akce / Události** | Validace před odesláním, hromadná aktualizace polí, resetování formuláře atd. |

> **Poznámka:** `ctx.form` je k dispozici pouze v kontextech RunJS souvisejících s bloky formulářů (Formulář, Editační formulář, Podformulář atd.). V neformulářových scénářích (jako jsou nezávislé JSBlocky nebo tabulkové bloky) nemusí existovat. Před použitím doporučujeme provést kontrolu na prázdnou hodnotu: `ctx.form?.getFieldsValue()`.

## Definice typu

```ts
form: FormInstance<any>;
```

`FormInstance` je typ instance Ant Design Form. Mezi běžně používané metody patří:

## Časté metody

### Čtení hodnot formuláře

```ts
// Čtení hodnot aktuálně registrovaných polí (ve výchozím nastavení pouze vykreslená pole)
const values = ctx.form.getFieldsValue();

// Čtení hodnot všech polí (včetně registrovaných, ale nevykreslených, např. skrytých nebo v sbalených sekcích)
const allValues = ctx.form.getFieldsValue(true);

// Čtení jednoho pole
const email = ctx.form.getFieldValue('email');

// Čtení vnořených polí (např. v podtabulce)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Zápis hodnot formuláře

```ts
// Hromadná aktualizace (často používaná pro vazby)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Aktualizace jednoho pole
ctx.form.setFieldValue('remark', 'Poznámka aktualizována');
```

### Validace a odeslání

```ts
// Spuštění validace formuláře
await ctx.form.validateFields();

// Spuštění odeslání formuláře
ctx.form.submit();
```

### Resetování

```ts
// Resetování všech polí
ctx.form.resetFields();

// Resetování pouze konkrétních polí
ctx.form.resetFields(['status', 'remark']);
```

## Vztah k souvisejícím kontextům

### ctx.getValue / ctx.setValue

| Scénář | Doporučené použití |
|------|----------|
| **Čtení/zápis aktuálního pole** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Čtení/zápis jiných polí** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

V rámci aktuálního JS pole upřednostňujte pro čtení a zápis vlastního pole metody `getValue`/`setValue`. Pokud potřebujete přistupovat k jiným polím, použijte `ctx.form`.

### ctx.blockModel

| Požadavek | Doporučené použití |
|------|----------|
| **Čtení/zápis polí formuláře** | `ctx.form` (Ekvivalent k `ctx.blockModel?.form`, pohodlnější) |
| **Přístup k nadřazenému bloku** | `ctx.blockModel` (Obsahuje `collection`, `resource` atd.) |

### ctx.getVar('ctx.formValues')

Hodnoty formuláře je nutné získat pomocí `await ctx.getVar('ctx.formValues')`, nejsou přímo vystaveny jako `ctx.formValues`. V kontextu formuláře je vhodnější použít `ctx.form.getFieldsValue()` pro čtení nejnovějších hodnot v reálném čase.

## Poznámky

- `getFieldsValue()` ve výchozím nastavení vrací pouze vykreslená pole. Pro zahrnutí nevykreslených polí (např. v sbalených sekcích nebo skrytých podmíněnými pravidly) předejte `true`: `getFieldsValue(true)`.
- Cesty pro vnořená pole, jako jsou podtabulky, jsou pole (array), např. `['orders', 0, 'amount']`. Můžete použít `ctx.namePath` pro získání cesty aktuálního pole a sestavení cest pro ostatní sloupce ve stejném řádku.
- `validateFields()` vyhazuje objekt chyby obsahující `errorFields` a další informace. Pokud validace před odesláním selže, můžete použít `ctx.exit()` k ukončení následných kroků.
- V asynchronních scénářích, jako jsou pracovní postupy nebo pravidla vazeb, nemusí být `ctx.form` ještě připraven. Doporučuje se používat volitelné řetězení (optional chaining) nebo kontrolu na prázdnou hodnotu.

## Příklady

### Vazba polí: Zobrazení různého obsahu podle typu

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Výpočet aktuálního pole na základě jiných polí

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Čtení/zápis jiných sloupců ve stejném řádku v rámci podtabulky

```ts
// ctx.namePath je cesta aktuálního pole ve formuláři, např. ['orders', 0, 'amount']
// Čtení 'status' ve stejném řádku: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validace před odesláním

```ts
try {
  await ctx.form.validateFields();
  // Validace proběhla úspěšně, pokračujte v logice odesílání
} catch (e) {
  ctx.message.error('Zkontrolujte prosím pole formuláře');
  ctx.exit();
}
```

### Odeslání po potvrzení

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Potvrdit odeslání',
  content: 'Po odeslání již nebude možné údaje měnit. Pokračovat?',
  okText: 'Potvrdit',
  cancelText: 'Zrušit',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Ukončit, pokud uživatel zruší akci
}
```

## Související

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Čtení a zápis hodnoty aktuálního pole.
- [ctx.blockModel](./block-model.md): Model nadřazeného bloku; `ctx.form` je ekvivalentní k `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Potvrzovací dialogy, často používané s `ctx.form.validateFields()` a `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Ukončení procesu při selhání validace nebo zrušení uživatelem.
- `ctx.namePath`: Cesta (pole) aktuálního pole ve formuláři, používaná k sestavení názvů pro `getFieldValue` / `setFieldValue` ve vnořených polích.