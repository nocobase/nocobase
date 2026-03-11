:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/notification).
:::

# ctx.notification

Globální API pro oznámení založené na Ant Design Notification, které se používá k zobrazení panelů oznámení v **pravém horním rohu** stránky. Ve srovnání s `ctx.message` mohou oznámení obsahovat nadpis a popis, což je činí vhodnými pro obsah, který má být zobrazen delší dobu nebo vyžaduje pozornost uživatele.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / Události akcí** | Oznámení o dokončení úkolu, výsledky hromadných operací, dokončení exportu atd. |
| **Pracovní postupy (Workflow)** | Systémová upozornění po ukončení asynchronních procesů. |
| **Obsah vyžadující delší zobrazení** | Kompletní oznámení s nadpisy, popisy a ovládacími tlačítky. |

## Definice typu

```ts
notification: NotificationInstance;
```

`NotificationInstance` je rozhraní pro oznámení Ant Design, které poskytuje následující metody.

## Časté metody

| Metoda | Popis |
|------|------|
| `open(config)` | Otevře oznámení s vlastním nastavením |
| `success(config)` | Zobrazí oznámení typu úspěch |
| `info(config)` | Zobrazí informační oznámení |
| `warning(config)` | Zobrazí varovné oznámení |
| `error(config)` | Zobrazí chybové oznámení |
| `destroy(key?)` | Zavře oznámení se zadaným klíčem; pokud klíč není zadán, zavře všechna oznámení |

**Konfigurační parametry** (shodné s [Ant Design notification](https://ant.design/components/notification)):

| Parametr | Typ | Popis |
|------|------|------|
| `message` | `ReactNode` | Nadpis oznámení |
| `description` | `ReactNode` | Popis oznámení |
| `duration` | `number` | Prodleva automatického zavření (sekundy). Výchozí hodnota je 4,5 sekundy; nastavením na 0 automatické zavírání vypnete |
| `key` | `string` | Jedinečný identifikátor oznámení, používá se pro `destroy(key)` k zavření konkrétního oznámení |
| `onClose` | `() => void` | Funkce zpětného volání při zavření oznámení |
| `placement` | `string` | Umístění: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Příklady

### Základní použití

```ts
ctx.notification.open({
  message: 'Operace byla úspěšná',
  description: 'Data byla uložena na server.',
});
```

### Rychlé volání podle typu

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Vlastní doba trvání a klíč

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Nezavírat automaticky
});

// Ruční zavření po dokončení úkolu
ctx.notification.destroy('task-123');
```

### Zavření všech oznámení

```ts
ctx.notification.destroy();
```

## Rozdíl oproti ctx.message

| Vlastnost | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Pozice** | Horní část stránky uprostřed | Pravý horní roh (nastavitelné) |
| **Struktura** | Jednořádkový rychlý tip | Obsahuje nadpis + popis |
| **Účel** | Dočasná zpětná vazba, automaticky zmizí | Kompletní oznámení, může být zobrazeno dlouho |
| **Typické scénáře** | Úspěch operace, selhání validace, úspěšné kopírování | Dokončení úkolu, systémové zprávy, delší obsah vyžadující pozornost |

## Související

- [ctx.message](./message.md) - Rychlý tip v horní části, vhodný pro rychlou zpětnou vazbu
- [ctx.modal](./modal.md) - Potvrzení v modálním okně, blokující interakce
- [ctx.t()](./t.md) - Internacionalizace, často používaná ve spojení s oznámeními