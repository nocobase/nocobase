:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/notification).
:::

# ctx.notification

Baserat på Ant Design Notification, detta globala API för aviseringar används för att visa aviseringspaneler i det **övre högra hörnet** på sidan. Jämfört med `ctx.message` kan aviseringar innehålla en rubrik och beskrivning, vilket gör dem lämpliga för innehåll som behöver visas under en längre tid eller kräver användarens uppmärksamhet.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / Händelseåtgärder** | Aviseringar om slutförda uppgifter, resultat av batchåtgärder, slutförd export etc. |
| **Arbetsflöden (FlowEngine)** | Systemvarningar efter att asynkrona processer avslutats. |
| **Innehåll som kräver längre visning** | Fullständiga aviseringar med rubriker, beskrivningar och åtgärdsknappar. |

## Typdefinition

```ts
notification: NotificationInstance;
```

`NotificationInstance` är gränssnittet för Ant Design notification och tillhandahåller följande metoder.

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `open(config)` | Öppnar en avisering med anpassad konfiguration |
| `success(config)` | Visar en avisering av typen framgång |
| `info(config)` | Visar en avisering av typen information |
| `warning(config)` | Visar en avisering av typen varning |
| `error(config)` | Visar en avisering av typen fel |
| `destroy(key?)` | Stänger aviseringen med angiven nyckel (key); om ingen nyckel anges stängs alla aviseringar |

**Konfigurationsparametrar** (Överensstämmer med [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Typ | Beskrivning |
|------|------|------|
| `message` | `ReactNode` | Aviseringens rubrik |
| `description` | `ReactNode` | Aviseringens beskrivning |
| `duration` | `number` | Fördröjning för automatisk stängning (sekunder). Standard är 4,5 sekunder; ställ in till 0 för att inaktivera automatisk stängning |
| `key` | `string` | Unik identifierare för aviseringen, används för `destroy(key)` för att stänga en specifik avisering |
| `onClose` | `() => void` | Callback-funktion som anropas när aviseringen stängs |
| `placement` | `string` | Position: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Exempel

### Grundläggande användning

```ts
ctx.notification.open({
  message: 'Åtgärden lyckades',
  description: 'Data har sparats på servern.',
});
```

### Snabbval efter typ

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

### Anpassad varaktighet och nyckel (key)

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Stängs inte automatiskt
});

// Stäng manuellt när uppgiften är slutförd
ctx.notification.destroy('task-123');
```

### Stäng alla aviseringar

```ts
ctx.notification.destroy();
```

## Skillnad från ctx.message

| Egenskap | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Överst i mitten av sidan | Övre högra hörnet (konfigurerbart) |
| **Struktur** | Enradig lättviktig ledtråd | Inkluderar rubrik + beskrivning |
| **Syfte** | Tillfällig feedback, försvinner automatiskt | Fullständig avisering, kan visas under lång tid |
| **Typiska scenarier** | Lyckad åtgärd, valideringsfel, kopiering lyckades | Slutförd uppgift, systemmeddelanden, längre innehåll som kräver användarens uppmärksamhet |

## Relaterat

- [ctx.message](./message.md) - Lättviktig ledtråd högst upp, lämplig för snabb feedback
- [ctx.modal](./modal.md) - Modalfönster för bekräftelse, blockerande interaktion
- [ctx.t()](./t.md) - Internationalisering, används ofta tillsammans med aviseringar