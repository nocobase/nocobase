:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/notification) voor nauwkeurige informatie.
:::

# ctx.notification

Gebaseerd op Ant Design Notification, wordt deze globale notificatie-API gebruikt om notificatiepanelen in de **rechterbovenhoek** van de pagina weer te geven. Vergeleken met `ctx.message` kunnen notificaties een titel en beschrijving bevatten, waardoor ze geschikt zijn voor inhoud die gedurende een langere periode moet worden weergegeven of de aandacht van de gebruiker vereist.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / Actie-gebeurtenissen** | Meldingen over voltooiing van taken, resultaten van batchbewerkingen, voltooiing van export, enz. |
| **Gebeurtenisstroom (Event stream)** | Systeemmeldingen na afloop van asynchrone processen. |
| **Inhoud die een langere weergave vereist** | Volledige notificaties met titels, beschrijvingen en actieknoppen. |

## Type-definitie

```ts
notification: NotificationInstance;
```

`NotificationInstance` is de Ant Design notificatie-interface, die de volgende methoden biedt.

## Veelvoorkomende methoden

| Methode | Beschrijving |
|------|------|
| `open(config)` | Opent een notificatie met een aangepaste configuratie |
| `success(config)` | Toont een succes-notificatie |
| `info(config)` | Toont een informatie-notificatie |
| `warning(config)` | Toont een waarschuwingsnotificatie |
| `error(config)` | Toont een foutmelding-notificatie |
| `destroy(key?)` | Sluit de notificatie met de opgegeven key; als er geen key wordt opgegeven, worden alle notificaties gesloten |

**Configuratieparameters** (overeenkomstig met [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Type | Beschrijving |
|------|------|------|
| `message` | `ReactNode` | Notificatietitel |
| `description` | `ReactNode` | Notificatiebeschrijving |
| `duration` | `number` | Vertraging voor automatisch sluiten (seconden). Standaard is 4,5 seconden; stel in op 0 om automatisch sluiten uit te schakelen |
| `key` | `string` | Unieke identificatie voor de notificatie, gebruikt voor `destroy(key)` om een specifieke notificatie te sluiten |
| `onClose` | `() => void` | Callback-functie die wordt aangeroepen wanneer de notificatie wordt gesloten |
| `placement` | `string` | Positie: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Voorbeelden

### Basisgebruik

```ts
ctx.notification.open({
  message: 'Bewerking geslaagd',
  description: 'Gegevens zijn opgeslagen op de server.',
});
```

### Snelkoppelingen per type

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

### Aangepaste duur en key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Niet automatisch sluiten
});

// Handmatig sluiten na voltooiing van de taak
ctx.notification.destroy('task-123');
```

### Alle notificaties sluiten

```ts
ctx.notification.destroy();
```

## Verschil met ctx.message

| Kenmerk | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Positie** | Midden bovenaan de pagina | Rechterbovenhoek (configureerbaar) |
| **Structuur** | Enkelregelige lichte hint | Bevat titel + beschrijving |
| **Doel** | Tijdelijke feedback, verdwijnt automatisch | Volledige notificatie, kan gedurende lange tijd worden weergegeven |
| **Typische scenario's** | Succesvolle bewerking, validatiefout, kopiëren geslaagd | Voltooiing van taken, systeemberichten, langere inhoud die de aandacht van de gebruiker vereist |

## Gerelateerd

- [ctx.message](./message.md) - Lichte hint bovenaan, geschikt voor snelle feedback
- [ctx.modal](./modal.md) - Modale bevestiging, blokkerende interactie
- [ctx.t()](./t.md) - Internationalisering, vaak gebruikt in combinatie met notificaties