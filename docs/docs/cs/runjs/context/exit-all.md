:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/exit-all).
:::

# ctx.exitAll()

Ukončí aktuální tok událostí a všechny následné toky událostí spuštěné v rámci stejného odeslání události. Často se používá, když je potřeba okamžitě přerušit všechny toky událostí pod aktuální událostí kvůli globální chybě nebo selhání ověření oprávnění.

## Scénáře použití

`ctx.exitAll()` se obecně používá v kontextech, kde lze spouštět JS a kde je nutné **současně přerušit aktuální tok událostí i následné toky událostí vyvolané touto událostí**:

| Scénář | Popis |
|------|------|
| **Tok událostí** | Ověření hlavního toku událostí selhalo (např. nedostatečná oprávnění), což vyžaduje ukončení hlavního toku a všech následných toků pod stejnou událostí, které ještě nebyly provedeny. |
| **Pravidla propojení** | Pokud selže ověření propojení (linkage), musí být ukončeno aktuální propojení i následná propojení vyvolaná stejnou událostí. |
| **Akce událostí** | Selhání ověření před akcí (např. kontrola oprávnění před smazáním), vyžadující zabránění hlavní akci a následným krokům. |

> Rozdíl oproti `ctx.exit()`: `ctx.exit()` ukončí pouze aktuální tok událostí; `ctx.exitAll()` ukončí aktuální tok událostí a všechny **neprovedené** následné toky událostí v rámci stejného odeslání události.

## Definice typu

```ts
exitAll(): never;
```

Volání `ctx.exitAll()` vyvolá interní výjimku `FlowExitAllException`, kterou zachytí engine toku událostí, aby zastavil instanci aktuálního toku událostí a následné toky událostí pod stejnou událostí. Po zavolání se zbývající příkazy v aktuálním JS kódu neprovedou.

## Porovnání s ctx.exit()

| Metoda | Rozsah působnosti |
|------|----------|
| `ctx.exit()` | Ukončí pouze aktuální tok událostí; následné toky událostí nejsou ovlivněny. |
| `ctx.exitAll()` | Ukončí aktuální tok událostí a přeruší následné toky událostí prováděné **sekvenčně** pod stejnou událostí. |

## Režimy provádění

- **Sekvenční provádění (sequential)**: Toky událostí pod stejnou událostí se provádějí v pořadí. Poté, co jakýkoli tok událostí zavolá `ctx.exitAll()`, následné toky událostí se již neprovedou.
- **Paralelní provádění (parallel)**: Toky událostí pod stejnou událostí se provádějí paralelně. Zavolání `ctx.exitAll()` v jednom toku událostí nepřeruší ostatní souběžné toky událostí (protože jsou nezávislé).

## Příklady

### Ukončení všech toků událostí při selhání ověření oprávnění

```ts
// Přerušení hlavního toku událostí a následných toků při nedostatečných oprávněních
if (!hasPermission(ctx)) {
  ctx.notification.error({ message: 'Bez oprávnění k operaci' });
  ctx.exitAll();
}
```

### Ukončení při selhání globálního předběžného ověření

```ts
// Příklad: Pokud je před smazáním zjištěno, že související data nelze smazat, zabrání se hlavnímu toku a následným akcím
const canDelete = await checkDeletable(ctx.model?.getValue?.());
if (!canDelete) {
  ctx.message.error('Nelze smazat: existují související data');
  ctx.exitAll();
}
```

### Výběr mezi ctx.exit() a ctx.exitAll()

```ts
// Pouze aktuální tok událostí musí být ukončen -> Použijte ctx.exit()
if (!params.valid) {
  ctx.message.error('Neplatné parametry');
  ctx.exit();  // Následné toky událostí nejsou ovlivněny
}

// Je nutné ukončit všechny následné toky událostí pod aktuální událostí -> Použijte ctx.exitAll()
if (!ctx.model?.context?.getPermission?.()) {
  ctx.notification.warning({ message: 'Nedostatečná oprávnění' });
  ctx.exitAll();  // Hlavní tok událostí i následné toky pod stejnou událostí jsou ukončeny
}
```

### Upozornění před ukončením

```ts
if (!isValidInput(ctx.form?.getValues?.())) {
  ctx.message.warning('Nejprve opravte chyby ve formuláři');
  ctx.exitAll();
}
```

## Poznámky

- Po zavolání `ctx.exitAll()` se následný kód v aktuálním JS neprovede. Před voláním doporučujeme uživateli vysvětlit důvod pomocí `ctx.message`, `ctx.notification` nebo modálního okna.
- V aplikačním kódu obvykle není třeba zachytávat `FlowExitAllException`; nechte to na enginu toku událostí.
- Pokud potřebujete zastavit pouze aktuální tok událostí bez ovlivnění následných, použijte `ctx.exit()`.
- V paralelním režimu `ctx.exitAll()` ukončí pouze aktuální tok událostí a nepřeruší ostatní souběžné toky událostí.

## Související

- [ctx.exit()](./exit.md): Ukončí pouze aktuální tok událostí
- [ctx.message](./message.md): Zprávy a upozornění
- [ctx.modal](./modal.md): Potvrzovací modální okno