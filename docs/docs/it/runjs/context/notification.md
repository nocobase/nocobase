:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/notification).
:::

# ctx.notification

Basata su Ant Design Notification, questa API di notifica globale viene utilizzata per visualizzare pannelli di notifica nell'**angolo in alto a destra** della pagina. Rispetto a `ctx.message`, le notifiche possono includere un titolo e una descrizione, rendendole adatte a contenuti che devono essere visualizzati per un periodo più lungo o che richiedono l'attenzione dell'utente.

## Scenari d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock / Eventi di azione** | Notifiche di completamento attività, risultati di operazioni batch, completamento esportazione, ecc. |
| **Flusso di eventi** | Avvisi a livello di sistema al termine di processi asincroni. |
| **Contenuti che richiedono una visualizzazione prolungata** | Notifiche complete con titoli, descrizioni e pulsanti di azione. |

## Definizione del tipo

```ts
notification: NotificationInstance;
```

`NotificationInstance` è l'interfaccia di notifica di Ant Design, che fornisce i seguenti metodi.

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `open(config)` | Apre una notifica con configurazione personalizzata |
| `success(config)` | Visualizza una notifica di tipo successo |
| `info(config)` | Visualizza una notifica di tipo informativo |
| `warning(config)` | Visualizza una notifica di tipo avviso |
| `error(config)` | Visualizza una notifica di tipo errore |
| `destroy(key?)` | Chiude la notifica con la chiave (`key`) specificata; se non viene fornita alcuna chiave, chiude tutte le notifiche |

**Parametri di configurazione** (coerenti con [Ant Design notification](https://ant.design/components/notification)):

| Parametro | Tipo | Descrizione |
|------|------|------|
| `message` | `ReactNode` | Titolo della notifica |
| `description` | `ReactNode` | Descrizione della notifica |
| `duration` | `number` | Ritardo di chiusura automatica (secondi). Il valore predefinito è 4,5 secondi; impostare a 0 per disabilitare la chiusura automatica |
| `key` | `string` | Identificatore univoco della notifica, utilizzato per `destroy(key)` per chiudere una notifica specifica |
| `onClose` | `() => void` | Funzione di callback attivata alla chiusura della notifica |
| `placement` | `string` | Posizione: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Esempi

### Utilizzo di base

```ts
ctx.notification.open({
  message: 'Operazione riuscita',
  description: 'I dati sono stati salvati sul server.',
});
```

### Chiamate rapide per tipo

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

### Durata personalizzata e chiave (key)

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Non chiudere automaticamente
});

// Chiusura manuale al completamento dell'attività
ctx.notification.destroy('task-123');
```

### Chiudere tutte le notifiche

```ts
ctx.notification.destroy();
```

## Differenze con ctx.message

| Caratteristica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posizione** | Centro in alto nella pagina | Angolo in alto a destra (configurabile) |
| **Struttura** | Suggerimento leggero su riga singola | Include titolo + descrizione |
| **Scopo** | Feedback temporaneo, scompare automaticamente | Notifica completa, può essere visualizzata a lungo |
| **Scenari tipici** | Successo operazione, errore di validazione, copia riuscita | Completamento attività, messaggi di sistema, contenuti lunghi che richiedono attenzione |

## Correlati

- [ctx.message](./message.md) - Suggerimento leggero in alto, adatto per feedback rapidi
- [ctx.modal](./modal.md) - Finestra modale di conferma, interazione bloccante
- [ctx.t()](./t.md) - Internazionalizzazione, spesso usata in combinazione con le notifiche