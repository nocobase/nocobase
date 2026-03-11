:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/exit).
:::

# ctx.exit()

Ukončí provádění aktuálního toku událostí (event flow); následné kroky se nespustí. Často se používá v případech, kdy nejsou splněny obchodní podmínky, uživatel akci zruší nebo dojde k neopravitelné chybě.

## Scénáře použití

`ctx.exit()` se obecně používá v následujících kontextech, kde lze spouštět JavaScript:

| Scénář | Popis |
|------|------|
| **Tok událostí** | V tocích událostí vyvolaných odesláním formuláře, kliknutím na tlačítko atd. ukončí následné kroky, pokud nejsou splněny podmínky. |
| **Pravidla propojení** | V propojení polí, filtrů atd. ukončí aktuální tok událostí při selhání validace nebo při potřebě přeskočit provedení. |
| **Události akcí** | V uživatelských akcích (např. potvrzení smazání, validace před uložením) ukončí proces, pokud uživatel akci zruší nebo validace neprojde. |

> Rozdíl oproti `ctx.exitAll()`: `ctx.exit()` ukončí pouze aktuální tok událostí; ostatní toky událostí v rámci stejné události nejsou ovlivněny. `ctx.exitAll()` ukončí aktuální tok událostí i všechny dosud neprovedené následné toky událostí v rámci stejné události.

## Definice typu

```ts
exit(): never;
```

Volání `ctx.exit()` vyvolá interní výjimku `FlowExitException`, kterou zachytí engine toku událostí a zastaví provádění aktuálního toku. Po zavolání se zbývající příkazy v aktuálním JS kódu neprovedou.

## Porovnání s ctx.exitAll()

| Metoda | Rozsah účinku |
|------|----------|
| `ctx.exit()` | Ukončí pouze aktuální tok událostí; následné toky událostí nejsou ovlivněny. |
| `ctx.exitAll()` | Ukončí aktuální tok událostí a přeruší následné toky událostí v rámci stejné události, které jsou nastaveny na **sekvenční provádění**. |

## Příklady

### Ukončení při zrušení uživatelem

```ts
// V potvrzovacím okně: pokud uživatel klikne na zrušit, ukončí se tok událostí
if (!confirmed) {
  ctx.message.info('Operace byla zrušena');
  ctx.exit();
}
```

### Ukončení při selhání validace parametrů

```ts
// Zobrazení upozornění a ukončení při selhání validace
if (!params.value || params.value.length < 3) {
  ctx.message.error('Neplatné parametry, délka musí být alespoň 3');
  ctx.exit();
}
```

### Ukončení, když nejsou splněny obchodní podmínky

```ts
// Ukončení, pokud nejsou splněny podmínky; následné kroky se neprovedou
const record = ctx.model?.getValue?.();
if (!record || record.status !== 'draft') {
  ctx.notification.warning({ message: 'Lze odeslat pouze koncepty' });
  ctx.exit();
}
```

### Volba mezi ctx.exit() a ctx.exitAll()

```ts
// Má se ukončit pouze aktuální tok událostí → Použijte ctx.exit()
if (!params.valid) {
  ctx.message.error('Neplatné parametry');
  ctx.exit();  // Ostatní toky událostí nejsou ovlivněny
}

// Je třeba ukončit všechny následné toky událostí v rámci aktuální události → Použijte ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Nedostatečná oprávnění' });
  ctx.exitAll();  // Ukončí se jak aktuální tok událostí, tak i následné toky v rámci stejné události
}
```

### Ukončení na základě volby uživatele po potvrzení v modálním okně

```ts
const ok = await ctx.modal?.confirm?.({
  title: 'Potvrdit smazání',
  content: 'Tuto akci nelze vrátit zpět. Chcete pokračovat?',
});
if (!ok) {
  ctx.message.info('Zrušeno');
  ctx.exit();
}
```

## Poznámky

- Po volání `ctx.exit()` se následný kód v aktuálním JS neprovede; doporučujeme před voláním vysvětlit uživateli důvod pomocí `ctx.message`, `ctx.notification` nebo modálního okna.
- V obchodním kódu obvykle není třeba zachytávat `FlowExitException`; nechte to na enginu toku událostí.
- Pokud potřebujete ukončit všechny následné toky událostí v rámci aktuální události, použijte `ctx.exitAll()`.

## Související

- [ctx.exitAll()](./exit-all.md): Ukončí aktuální tok událostí a následné toky událostí v rámci stejné události.
- [ctx.message](./message.md): Zprávy (notifikace).
- [ctx.modal](./modal.md): Potvrzovací modální okna.