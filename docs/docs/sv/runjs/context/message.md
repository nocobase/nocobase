:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/message).
:::

# ctx.message

Ant Designs globala message-API, som används för att visa tillfälliga lätta meddelanden i mitten längst upp på sidan. Meddelanden stängs automatiskt efter en viss tid eller kan stängas manuellt av användaren.

## Tillämpningsscenarier

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback på åtgärder, valideringsmeddelanden, kopiering lyckades och andra lätta meddelanden |
| **Formuläråtgärder / Arbetsflöde** | Feedback för lyckad inskickning, misslyckad sparning, valideringsfel etc. |
| **Åtgärdshändelser (JSAction)** | Omedelbar feedback för klick, slutförande av batchåtgärder etc. |

## Typdefinition

```ts
message: MessageInstance;
```

`MessageInstance` är Ant Designs message-gränssnitt, som tillhandahåller följande metoder.

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `success(content, duration?)` | Visa ett framgångsmeddelande |
| `error(content, duration?)` | Visa ett felmeddelande |
| `warning(content, duration?)` | Visa ett varningsmeddelande |
| `info(content, duration?)` | Visa ett informationsmeddelande |
| `loading(content, duration?)` | Visa ett laddningsmeddelande (måste stängas manuellt) |
| `open(config)` | Öppna ett meddelande med anpassad konfiguration |
| `destroy()` | Stäng alla meddelanden som visas för tillfället |

**Parametrar:**

- `content` (`string` \| `ConfigOptions`): Meddelandets innehåll eller konfigurationsobjekt
- `duration` (`number`, valfritt): Fördröjning för automatisk stängning (sekunder), standard är 3 sekunder; ställ in till 0 för att inaktivera automatisk stängning

**ConfigOptions** (när `content` är ett objekt):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Meddelandets innehåll
  duration?: number;        // Fördröjning för automatisk stängning (sekunder)
  onClose?: () => void;    // Callback när meddelandet stängs
  icon?: React.ReactNode;  // Anpassad ikon
}
```

## Exempel

### Grundläggande användning

```ts
ctx.message.success('Åtgärden lyckades');
ctx.message.error('Åtgärden misslyckades');
ctx.message.warning('Vänligen välj data först');
ctx.message.info('Bearbetar...');
```

### Internationalisering med ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading och manuell stängning

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Utför asynkron åtgärd
await saveData();
hide();  // Stäng laddningsmeddelandet manuellt
ctx.message.success(ctx.t('Saved'));
```

### Anpassad konfiguration med open

```ts
ctx.message.open({
  type: 'success',
  content: 'Anpassat framgångsmeddelande',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Stäng alla meddelanden

```ts
ctx.message.destroy();
```

## Skillnad mellan ctx.message och ctx.notification

| Egenskap | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Mitten längst upp på sidan | Översta högra hörnet |
| **Syfte** | Tillfälligt lätt meddelande, försvinner automatiskt | Meddelandepanel, kan innehålla rubrik och beskrivning, lämplig för längre visning |
| **Typiska scenarier** | Feedback på åtgärder, valideringsmeddelanden, kopiering lyckades | Aviseringar om slutförda uppgifter, systemmeddelanden, längre innehåll som kräver användarens uppmärksamhet |

## Relaterat

- [ctx.notification](./notification.md) - Aviseringar i övre högra hörnet, lämpliga för längre visningstider
- [ctx.modal](./modal.md) - Modalfönster för bekräftelse, blockerande interaktion
- [ctx.t()](./t.md) - Internationalisering, används ofta tillsammans med message