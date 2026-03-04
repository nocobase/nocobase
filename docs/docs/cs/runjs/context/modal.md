:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/modal).
:::

# ctx.modal

Zkratka API založená na Ant Design Modal, která se používá k aktivnímu otevírání modálních oken (informační výzvy, potvrzovací vyskakovací okna atd.) v RunJS. Je implementována prostřednictvím `ctx.viewer` / systému zobrazení.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField** | Zobrazení výsledků operací, chybových hlášení nebo sekundárních potvrzení po interakci uživatele. |
| **Pracovní postup / Události akcí** | Vyskakovací potvrzení před odesláním; ukončení následných kroků pomocí `ctx.exit()`, pokud uživatel akci zruší. |
| **Pravidla propojení** | Vyskakovací výzvy pro uživatele při selhání validace. |

> Poznámka: `ctx.modal` je k dispozici v prostředích RunJS s kontextem zobrazení (např. JSBlock v rámci stránky, pracovní postupy atd.); v backendu nebo v kontextech bez UI nemusí existovat. Při volání doporučujeme použít volitelné řetězení (`ctx.modal?.confirm?.()`).

## Definice typů

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Vrátí true, pokud uživatel klikne na OK, false, pokud akci zruší
};
```

`ModalConfig` odpovídá konfiguraci statických metod `Modal` v Ant Design.

## Běžné metody

| Metoda | Návratová hodnota | Popis |
|------|--------|------|
| `info(config)` | `Promise<void>` | Informační modální okno |
| `success(config)` | `Promise<void>` | Modální okno s potvrzením úspěchu |
| `error(config)` | `Promise<void>` | Chybové modální okno |
| `warning(config)` | `Promise<void>` | Varovné modální okno |
| `confirm(config)` | `Promise<boolean>` | Potvrzovací modální okno; vrátí `true`, pokud uživatel klikne na OK, a `false`, pokud akci zruší |

## Konfigurační parametry

V souladu s Ant Design `Modal` mezi běžná pole patří:

| Parametr | Typ | Popis |
|------|------|------|
| `title` | `ReactNode` | Titulek |
| `content` | `ReactNode` | Obsah |
| `okText` | `string` | Text tlačítka OK |
| `cancelText` | `string` | Text tlačítka Zrušit (pouze pro `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Provede se při kliknutí na OK |
| `onCancel` | `() => void` | Provede se při kliknutí na Zrušit |

## Vztah k ctx.message a ctx.openView

| Účel | Doporučené použití |
|------|----------|
| **Lehká dočasná výzva** | `ctx.message`, zmizí automaticky |
| **Informační/Úspěch/Chyba/Varování modální okno** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Sekundární potvrzení (vyžaduje volbu uživatele)** | `ctx.modal.confirm`, používá se s `ctx.exit()` pro řízení toku |
| **Komplexní interakce jako formuláře nebo seznamy** | `ctx.openView` pro otevření vlastního zobrazení (stránka/šuplík/modál) |

## Příklady

### Jednoduché informační modální okno

```ts
ctx.modal.info({
  title: 'Upozornění',
  content: 'Operace byla dokončena',
});
```

### Potvrzovací modální okno a řízení toku

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Potvrdit smazání',
  content: 'Opravdu chcete tento záznam smazat?',
  okText: 'Potvrdit',
  cancelText: 'Zrušit',
});
if (!confirmed) {
  ctx.exit();  // Ukončí následné kroky, pokud uživatel akci zruší
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Potvrzovací modální okno s onOk

```ts
await ctx.modal.confirm({
  title: 'Potvrdit odeslání',
  content: 'Po odeslání již nebude možné provádět změny. Chcete pokračovat?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Chybová výzva

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Úspěch', content: 'Operace byla dokončena' });
} catch (e) {
  ctx.modal.error({ title: 'Chyba', content: e.message });
}
```

## Související

- [ctx.message](./message.md): Lehká dočasná výzva, zmizí automaticky
- [ctx.exit()](./exit.md): Často se používá jako `if (!confirmed) ctx.exit()` k ukončení toku, když uživatel zruší potvrzení
- [ctx.openView()](./open-view.md): Otevře vlastní zobrazení, vhodné pro komplexní interakce