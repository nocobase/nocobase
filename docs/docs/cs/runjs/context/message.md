:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/message).
:::

# ctx.message

Globální API pro zprávy (message) z Ant Design, které slouží k zobrazování dočasných lehkých upozornění v horní části uprostřed stránky. Zprávy se po určité době automaticky zavřou, nebo je může uživatel zavřít ručně.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Zpětná vazba k operacím, validační upozornění, potvrzení o úspěšném zkopírování a další lehká oznámení. |
| **Operace s formuláři / Pracovní postup** | Zpětná vazba pro úspěšné odeslání, selhání uložení, neúspěšnou validaci atd. |
| **Události akcí (JSAction)** | Okamžitá zpětná vazba pro kliknutí, dokončení hromadných operací atd. |

## Definice typu

```ts
message: MessageInstance;
```

`MessageInstance` je rozhraní zpráv Ant Design, které poskytuje následující metody.

## Běžné metody

| Metoda | Popis |
|------|------|
| `success(content, duration?)` | Zobrazí upozornění na úspěch |
| `error(content, duration?)` | Zobrazí upozornění na chybu |
| `warning(content, duration?)` | Zobrazí varovné upozornění |
| `info(content, duration?)` | Zobrazí informační upozornění |
| `loading(content, duration?)` | Zobrazí upozornění na načítání (musí být zavřeno ručně) |
| `open(config)` | Otevře zprávu s vlastním nastavením |
| `destroy()` | Zavře všechny aktuálně zobrazené zprávy |

**Parametry:**

- `content` (`string` \| `ConfigOptions`): Obsah zprávy nebo objekt konfigurace.
- `duration` (`number`, volitelné): Prodleva automatického zavření (v sekundách), výchozí jsou 3 sekundy; nastavením na 0 automatické zavírání vypnete.

**ConfigOptions** (pokud je `content` objekt):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Obsah zprávy
  duration?: number;        // Prodleva automatického zavření (sekundy)
  onClose?: () => void;    // Zpětné volání po zavření
  icon?: React.ReactNode;  // Vlastní ikona
}
```

## Příklady

### Základní použití

```ts
ctx.message.success('Operace byla úspěšná');
ctx.message.error('Operace selhala');
ctx.message.warning('Nejprve prosím vyberte data');
ctx.message.info('Zpracovává se...');
```

### Internacionalizace s ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading a ruční zavření

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Provedení asynchronní operace
await saveData();
hide();  // Ruční zavření loading
ctx.message.success(ctx.t('Saved'));
```

### Použití open pro vlastní konfiguraci

```ts
ctx.message.open({
  type: 'success',
  content: 'Vlastní upozornění na úspěch',
  duration: 5,
  onClose: () => console.log('zpráva zavřena'),
});
```

### Zavření všech zpráv

```ts
ctx.message.destroy();
```

## Rozdíl mezi ctx.message a ctx.notification

| Vlastnost | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Pozice** | Horní část uprostřed stránky | Pravý horní roh |
| **Účel** | Dočasné lehké upozornění, zmizí automaticky | Notifikační panel, může obsahovat nadpis a popis, vhodné pro delší zobrazení |
| **Typické scénáře** | Zpětná vazba k operacím, validační upozornění, úspěšné zkopírování | Oznámení o dokončení úkolu, systémové zprávy, delší obsah vyžadující pozornost uživatele |

## Související

- [ctx.notification](./notification.md) - Notifikace v pravém horním rohu, vhodné pro delší dobu zobrazení
- [ctx.modal](./modal.md) - Modální potvrzení, blokující interakce
- [ctx.t()](./t.md) - Internacionalizace, často používaná společně s message