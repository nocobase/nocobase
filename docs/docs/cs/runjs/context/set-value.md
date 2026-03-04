:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/set-value).
:::

# ctx.setValue()

Nastavuje hodnotu aktuálního pole v situacích s editovatelnými poli, jako jsou JSField a JSItem. V kombinaci s `ctx.getValue()` umožňuje obousměrnou vazbu (two-way binding) s formulářem.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSField** | Zápis hodnot vybraných uživatelem nebo vypočítaných hodnot do editovatelných vlastních polí. |
| **JSItem** | Aktualizace hodnoty aktuální buňky v editovatelných položkách tabulek nebo podtabulek. |
| **JSColumn** | Aktualizace hodnoty pole v odpovídajícím řádku na základě logiky během vykreslování sloupce tabulky. |

> **Poznámka**: `ctx.setValue(v)` je k dispozici pouze v kontextech RunJS s vazbou na formulář. Tato metoda není dostupná v situacích bez vazby na pole, jako jsou pracovní postupy (FlowEngine), pravidla propojení nebo JSBlock. Před použitím doporučujeme použít volitelné řetězení (optional chaining): `ctx.setValue?.(value)`.

## Definice typu

```ts
setValue<T = any>(value: T): void;
```

- **Parametry**: `value` je hodnota pole, která má být zapsána. Typ je určen typem položky formuláře daného pole.

## Chování

- `ctx.setValue(v)` aktualizuje hodnotu aktuálního pole ve formuláři Ant Design a spouští související logiku propojení formulářů a validace.
- Pokud formulář ještě není kompletně vykreslen nebo pole není zaregistrováno, volání nemusí být účinné. Doporučujeme použít `ctx.getValue()` pro potvrzení výsledku zápisu.

## Příklady

### Obousměrná vazba s getValue

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

### Nastavení výchozích hodnot na základě podmínek

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Zpětný zápis do aktuálního pole při propojení s jinými poli

```ts
// Synchronní aktualizace aktuálního pole při změně jiného pole
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Vlastní', value: 'custom' });
}
```

## Upozornění

- V needitovatelných polích (např. JSField v režimu podrobností, JSBlock) může být `ctx.setValue` rovno `undefined`. Doporučujeme použít `ctx.setValue?.(value)`, abyste předešli chybám.
- Při nastavování hodnot pro asociační pole (M2O, O2M atd.) je nutné předat strukturu odpovídající typu pole (např. `{ id, [titleField]: label }`), v závislosti na konkrétní konfiguraci pole.

## Související

- [ctx.getValue()](./get-value.md) - Získání aktuální hodnoty pole, používá se se setValue pro obousměrnou vazbu.
- [ctx.form](./form.md) - Instance formuláře Ant Design, slouží ke čtení nebo zápisu jiných polí.
- `js-field:value-change` - Událost kontejneru spuštěná při změně externí hodnoty, používá se k aktualizaci zobrazení.