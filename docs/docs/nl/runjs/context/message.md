:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/message) voor nauwkeurige informatie.
:::

# ctx.message

Ant Design globale message API, gebruikt om tijdelijke lichte meldingen in het midden bovenaan de pagina weer te geven. Berichten sluiten automatisch na een bepaalde tijd of kunnen handmatig door de gebruiker worden gesloten.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback op acties, validatiemeldingen, succesvol gekopieerd en andere lichte meldingen |
| **Formulierbewerkingen / Workflow** | Feedback voor succesvolle indiening, mislukte opslag, validatiefouten, enz. |
| **Actie-gebeurtenissen (JSAction)** | Onmiddellijke feedback voor klikken, voltooiing van batchbewerkingen, enz. |

## Type-definitie

```ts
message: MessageInstance;
```

`MessageInstance` is de Ant Design message-interface en biedt de volgende methoden.

## Veelgebruikte methoden

| Methode | Beschrijving |
|------|------|
| `success(content, duration?)` | Toont een succesmelding |
| `error(content, duration?)` | Toont een foutmelding |
| `warning(content, duration?)` | Toont een waarschuwing |
| `info(content, duration?)` | Toont een informatiemelding |
| `loading(content, duration?)` | Toont een laadmelding (moet handmatig worden gesloten) |
| `open(config)` | Opent een bericht met een aangepaste configuratie |
| `destroy()` | Sluit alle momenteel weergegeven berichten |

**Parameters:**

- `content` (`string` | `ConfigOptions`): Berichtinhoud of configuratie-object
- `duration` (`number`, optioneel): Vertraging voor automatisch sluiten (seconden), standaard 3 seconden; stel in op 0 om automatisch sluiten uit te schakelen

**ConfigOptions** (wanneer `content` een object is):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Berichtinhoud
  duration?: number;        // Vertraging voor automatisch sluiten (seconden)
  onClose?: () => void;    // Callback bij sluiten
  icon?: React.ReactNode;  // Aangepast icoon
}
```

## Voorbeelden

### Basisgebruik

```ts
ctx.message.success('Bewerking geslaagd');
ctx.message.error('Bewerking mislukt');
ctx.message.warning('Selecteer eerst gegevens');
ctx.message.info('Verwerken...');
```

### Internationalisering met ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading en handmatig sluiten

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Voer asynchrone bewerking uit
await saveData();
hide();  // Handmatig sluiten van loading
ctx.message.success(ctx.t('Saved'));
```

### Aangepaste configuratie met open

```ts
ctx.message.open({
  type: 'success',
  content: 'Aangepaste succesmelding',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Alle berichten sluiten

```ts
ctx.message.destroy();
```

## Verschil tussen ctx.message en ctx.notification

| Kenmerk | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Positie** | Midden bovenaan de pagina | Rechtsboven |
| **Doel** | Tijdelijke lichte melding, verdwijnt automatisch | Meldingenpaneel, kan titel en beschrijving bevatten, geschikt voor langere weergave |
| **Typische scenario's** | Feedback op acties, validatiemeldingen, succesvol gekopieerd | Meldingen over voltooiing van taken, systeemberichten, langere inhoud die de aandacht van de gebruiker vereist |

## Gerelateerd

- [ctx.notification](./notification.md) - Meldingen rechtsboven, geschikt voor langere weergaveduur
- [ctx.modal](./modal.md) - Modal bevestiging, blokkerende interactie
- [ctx.t()](./t.md) - Internationalisering, wordt vaak samen met message gebruikt