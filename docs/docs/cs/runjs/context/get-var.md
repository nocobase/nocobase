:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/get-var).
:::

# ctx.getVar()

**Asynchronně** načítá hodnoty proměnných z aktuálního kontextu běhu (runtime context). Rozlišení proměnných je shodné s `{{ctx.xxx}}` v SQL a šablonách, obvykle pochází od aktuálního uživatele, aktuálního záznamu, parametrů zobrazení, kontextu vyskakovacího okna (popup) atd.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField** | Získání informací o aktuálním záznamu, uživateli, zdroji atd. pro vykreslování nebo logiku. |
| **Pravidla propojení / FlowEngine** | Čtení `ctx.record`, `ctx.formValues` atd. pro podmíněnou logiku. |
| **Vzorce / Šablony** | Používá stejná pravidla pro rozlišení proměnných jako `{{ctx.xxx}}`. |

## Definice typu

```ts
getVar(path: string): Promise<any>;
```

| Parametr | Typ | Popis |
|------|------|------|
| `path` | `string` | Cesta k proměnné; **musí začínat na `ctx.`**. Podporuje tečkovou notaci a indexy polí. |

**Návratová hodnota**: `Promise<any>`. Pro získání výsledné hodnoty použijte `await`; pokud proměnná neexistuje, vrací `undefined`.

> Pokud je předána cesta, která nezačíná na `ctx.`, bude vyhozena chyba: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Časté cesty k proměnným

| Cesta | Popis |
|------|------|
| `ctx.record` | Aktuální záznam (dostupné, pokud je blok formuláře/detailu vázán na záznam) |
| `ctx.record.id` | Primární klíč aktuálního záznamu |
| `ctx.formValues` | Aktuální hodnoty formuláře (často používané v pravidlech propojení a FlowEngine; v kontextu formuláře preferujte `ctx.form.getFieldsValue()` pro čtení v reálném čase) |
| `ctx.user` | Aktuálně přihlášený uživatel |
| `ctx.user.id` | ID aktuálního uživatele |
| `ctx.user.nickname` | Přezdívka aktuálního uživatele |
| `ctx.user.roles.name` | Názvy rolí aktuálního uživatele (pole) |
| `ctx.popup.record` | Záznam v rámci vyskakovacího okna |
| `ctx.popup.record.id` | Primární klíč záznamu ve vyskakovacím okně |
| `ctx.urlSearchParams` | Parametry dotazu URL (parsované z `?key=value`) |
| `ctx.token` | Aktuální API Token |
| `ctx.role` | Aktuální role |

## ctx.getVarInfos()

Získává **strukturální informace** (typ, název, podvlastnosti atd.) o rozlišitelných proměnných v aktuálním kontextu, což usnadňuje prozkoumávání dostupných cest. Návratová hodnota je statický popis založený na `meta` a neobsahuje skutečné hodnoty z běhu.

### Definice typu

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

V návratové hodnotě je každý klíč cestou k proměnné a hodnota je strukturální informace pro danou cestu (včetně `type`, `title`, `properties` atd.).

### Parametry

| Parametr | Typ | Popis |
|------|------|------|
| `path` | `string \| string[]` | Cesta pro oříznutí; shromažďuje pouze strukturu proměnných pod touto cestou. Podporuje `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; pole představuje sloučení více cest. |
| `maxDepth` | `number` | Maximální hloubka rozbalení, výchozí je `3`. Pokud není `path` zadána, vlastnosti nejvyšší úrovně mají `depth=1`. Pokud je `path` zadána, uzel odpovídající cestě má `depth=1`. |

### Příklad

```ts
// Získání struktury proměnných pod record (rozbaleno až do 3 úrovní)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Získání struktury popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Získání kompletní struktury proměnných nejvyšší úrovně (výchozí maxDepth=3)
const vars = await ctx.getVarInfos();
```

## Rozdíl oproti ctx.getValue

| Metoda | Scénář | Popis |
|------|----------|------|
| `ctx.getValue()` | Upravitelná pole jako JSField nebo JSItem | Synchronně získá hodnotu **aktuálního pole**; vyžaduje vazbu na formulář. |
| `ctx.getVar(path)` | Jakýkoliv kontext RunJS | Asynchronně získá **libovolnou proměnnou ctx**; cesta musí začínat na `ctx.`. |

V rámci JSField použijte `getValue`/`setValue` pro čtení/zápis aktuálního pole; použijte `getVar` pro přístup k ostatním proměnným kontextu (jako `record`, `user`, `formValues`).

## Poznámky

- **Cesta musí začínat na `ctx.`**: např. `ctx.record.id`, jinak bude vyhozena chyba.
- **Asynchronní metoda**: Pro získání výsledku musíte použít `await`, např. `const id = await ctx.getVar('ctx.record.id')`.
- **Proměnná neexistuje**: Vrací `undefined`. Pro nastavení výchozí hodnoty můžete za výsledek použít `??`: `(await ctx.getVar('ctx.user.nickname')) ?? 'Host'`.
- **Hodnoty formuláře**: `ctx.formValues` musí být získány přes `await ctx.getVar('ctx.formValues')`; nejsou přímo vystaveny jako `ctx.formValues`. V kontextu formuláře preferujte použití `ctx.form.getFieldsValue()` pro čtení nejnovějších hodnot v reálném čase.

## Příklady

### Získání ID aktuálního záznamu

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Aktuální záznam: ${recordId}`);
}
```

### Získání záznamu ve vyskakovacím okně

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Aktuální záznam v popupu: ${recordId}`);
}
```

### Čtení podpoložek pole (array)

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Vrací pole názvů rolí, např. ['admin', 'member']
```

### Nastavení výchozí hodnoty

```ts
// getVar nemá parametr defaultValue; použijte ?? za výsledkem
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Host';
```

### Čtení hodnot polí formuláře

```ts
// Jak ctx.formValues, tak ctx.form jsou pro scénáře formulářů; použijte getVar pro čtení vnořených polí
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Čtení parametrů dotazu URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Odpovídá ?id=xxx
```

### Prozkoumání dostupných proměnných

```ts
// Získání struktury proměnných pod record (rozbaleno až do 3 úrovní)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars vypadá jako { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Související

- [ctx.getValue()](./get-value.md) - Synchronní získání hodnoty aktuálního pole (pouze JSField/JSItem atd.)
- [ctx.form](./form.md) - Instance formuláře; `ctx.form.getFieldsValue()` může číst hodnoty formuláře v reálném čase
- [ctx.model](./model.md) - Model, ve kterém se nachází aktuální kontext provádění
- [ctx.blockModel](./block-model.md) - Nadřazený blok, ve kterém je umístěn aktuální JS
- [ctx.resource](./resource.md) - Instance prostředku (resource) v aktuálním kontextu
- `{{ctx.xxx}}` v SQL / šablonách - Používá stejná pravidla rozlišení jako `ctx.getVar('ctx.xxx')`