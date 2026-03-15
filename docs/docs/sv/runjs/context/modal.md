:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/modal).
:::

# ctx.modal

Ett genvägs-API baserat på Ant Design Modal, som används för att aktivt öppna modalfönster (informationsmeddelanden, bekräftelserutor etc.) i RunJS. Det implementeras av `ctx.viewer` / visningssystemet.

## Tillämpningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSField** | Visa operationsresultat, felmeddelanden eller sekundära bekräftelser efter användarinteraktion. |
| **Arbetsflöde / Händelseförlopp** | Pop-up-bekräftelse före inskickning; avbryt efterföljande steg via `ctx.exit()` om användaren avbryter. |
| **Länkregler** | Pop-up-meddelanden till användaren när validering misslyckas. |

> Observera: `ctx.modal` är tillgänglig i RunJS-miljöer med en visningskontext (som JSBlocks på en sida, arbetsflöden etc.); den kanske inte existerar i backend eller kontexter utan UI. Det rekommenderas att använda valfri kedja (`ctx.modal?.confirm?.()`) vid anrop.

## Typdefinition

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // Returnerar true om användaren klickar på OK, false om de avbryter
};
```

`ModalConfig` överensstämmer med konfigurationen för Ant Design `Modal` statiska metoder.

## Vanliga metoder

| Metod | Returvärde | Beskrivning |
|------|--------|------|
| `info(config)` | `Promise<void>` | Informationsmodal |
| `success(config)` | `Promise<void>` | Framgångsmodal |
| `error(config)` | `Promise<void>` | Felmodal |
| `warning(config)` | `Promise<void>` | Varningsmodal |
| `confirm(config)` | `Promise<boolean>` | Bekräftelsemodal; returnerar `true` om användaren klickar på OK, och `false` om de avbryter |

## Konfigurationsparametrar

I enlighet med Ant Design `Modal`, inkluderar vanliga fält:

| Parameter | Typ | Beskrivning |
|------|------|------|
| `title` | `ReactNode` | Rubrik |
| `content` | `ReactNode` | Innehåll |
| `okText` | `string` | Text för OK-knapp |
| `cancelText` | `string` | Text för Avbryt-knapp (endast för `confirm`) |
| `onOk` | `() => void \| Promise<void>` | Körs vid klick på OK |
| `onCancel` | `() => void` | Körs vid klick på Avbryt |

## Relation till ctx.message och ctx.openView

| Syfte | Rekommenderad användning |
|------|----------|
| **Lättviktig tillfällig avisering** | `ctx.message`, försvinner automatiskt |
| **Informations-/framgångs-/fel-/varningsmodal** | `ctx.modal.info` / `success` / `error` / `warning` |
| **Sekundär bekräftelse (kräver användarval)** | `ctx.modal.confirm`, används med `ctx.exit()` för att styra flödet |
| **Komplexa interaktioner som formulär eller listor** | `ctx.openView` för att öppna en anpassad vy (sida/låda/modal) |

## Exempel

### Enkel informationsmodal

```ts
ctx.modal.info({
  title: 'Information',
  content: 'Åtgärden är slutförd',
});
```

### Bekräftelsemodal och flödesstyrning

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Bekräfta radering',
  content: 'Är ni säker på att ni vill radera denna post?',
  okText: 'Bekräfta',
  cancelText: 'Avbryt',
});
if (!confirmed) {
  ctx.exit();  // Avbryt efterföljande steg om användaren avbryter
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### Bekräftelsemodal med onOk

```ts
await ctx.modal.confirm({
  title: 'Bekräfta inskickning',
  content: 'Ändringar kan inte redigeras efter inskickning. Vill ni fortsätta?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### Felmeddelande

```ts
try {
  await someOperation();
  ctx.modal.success({ title: 'Framgång', content: 'Åtgärden är slutförd' });
} catch (e) {
  ctx.modal.error({ title: 'Fel', content: e.message });
}
```

## Relaterat

- [ctx.message](./message.md): Lättviktig tillfällig avisering, försvinner automatiskt
- [ctx.exit()](./exit.md): Används ofta som `if (!confirmed) ctx.exit()` för att avbryta flödet när en användare avbryter en bekräftelse
- [ctx.openView()](./open-view.md): Öppnar en anpassad vy, lämplig för komplexa interaktioner