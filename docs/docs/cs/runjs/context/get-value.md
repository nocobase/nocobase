:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/get-value).
:::

# ctx.getValue()

V situacích s editovatelnými poli, jako jsou JSField a JSItem, slouží tato metoda k získání nejnovější hodnoty aktuálního pole. V kombinaci s `ctx.setValue(v)` umožňuje obousměrnou vazbu (two-way binding) s formulářem.

## Použití

| Scénář | Popis |
|------|------|
| **JSField** | Čtení uživatelského vstupu nebo aktuální hodnoty formuláře v editovatelných vlastních polích. |
| **JSItem** | Čtení aktuální hodnoty buňky v editovatelných položkách tabulek nebo podtabulek. |
| **JSColumn** | Čtení hodnoty pole odpovídajícího řádku během vykreslování sloupce tabulky. |

> **Poznámka**: `ctx.getValue()` je k dispozici pouze v kontextech RunJS s vazbou na formulář; neexistuje v situacích bez vazby na pole, jako jsou pracovní postupy nebo pravidla propojení.

## Definice typu

```ts
getValue<T = any>(): T | undefined;
```

- **Návratová hodnota**: Aktuální hodnota pole, jejíž typ je určen typem formulářové položky pole; pokud pole není zaregistrováno nebo vyplněno, může být `undefined`.

## Pořadí získávání hodnoty

`ctx.getValue()` získává hodnoty v následujícím pořadí:

1. **Stav formuláře**: Přednostně čte z aktuálního stavu Ant Design Form.
2. **Záložní hodnota**: Pokud pole ve formuláři není, použije se výchozí hodnota pole nebo props.

> Pokud vykreslování formuláře ještě nebylo dokončeno nebo pole není zaregistrováno, může vrátit `undefined`.

## Příklady

### Vykreslení na základě aktuální hodnoty

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Nejprve zadejte obsah</span>);
} else {
  ctx.render(<span>Aktuální hodnota: {current}</span>);
}
```

### Obousměrná vazba pomocí setValue

```tsx
const { Input } = ctx.libs.antd;

// Načtení aktuální hodnoty jako výchozí hodnoty
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Související

- [ctx.setValue()](./set-value.md) – Nastavení aktuální hodnoty pole, používá se s `getValue` pro obousměrnou vazbu.
- [ctx.form](./form.md) – Instance Ant Design Form pro čtení/zápis ostatních polí.
- `js-field:value-change` – Událost kontejneru spuštěná při změně externích hodnot, slouží k aktualizaci zobrazení.