:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/message).
:::

# ctx.message

API globale message di Ant Design, utilizzata per visualizzare brevi avvisi temporanei nella parte superiore centrale della pagina. I messaggi si chiudono automaticamente dopo un certo periodo o possono essere chiusi manualmente dall'utente.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Feedback sulle operazioni, avvisi di validazione, copia riuscita e altri avvisi leggeri |
| **Operazioni sui moduli / Flusso di lavoro** | Feedback per invio riuscito, errore di salvataggio, errore di validazione, ecc. |
| **Eventi di azione (JSAction)** | Feedback immediato per clic, completamento di operazioni massive, ecc. |

## Definizione del tipo

```ts
message: MessageInstance;
```

`MessageInstance` è l'interfaccia message di Ant Design, che fornisce i seguenti metodi.

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `success(content, duration?)` | Visualizza un avviso di successo |
| `error(content, duration?)` | Visualizza un avviso di errore |
| `warning(content, duration?)` | Visualizza un avviso di avvertimento |
| `info(content, duration?)` | Visualizza un avviso informativo |
| `loading(content, duration?)` | Visualizza un avviso di caricamento (deve essere chiuso manualmente) |
| `open(config)` | Apre un messaggio utilizzando una configurazione personalizzata |
| `destroy()` | Chiude tutti i messaggi attualmente visualizzati |

**Parametri:**

- `content` (`string` \| `ConfigOptions`): Contenuto del messaggio o oggetto di configurazione
- `duration` (`number`, opzionale): Ritardo per la chiusura automatica (secondi), il valore predefinito è 3 secondi; impostare a 0 per disattivare la chiusura automatica

**ConfigOptions** (quando `content` è un oggetto):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Contenuto del messaggio
  duration?: number;        // Ritardo per la chiusura automatica (secondi)
  onClose?: () => void;    // Callback alla chiusura
  icon?: React.ReactNode;  // Icona personalizzata
}
```

## Esempi

### Utilizzo di base

```ts
ctx.message.success('Operazione riuscita');
ctx.message.error('Operazione fallita');
ctx.message.warning('Selezionare prima i dati');
ctx.message.info('In corso...');
```

### Internazionalizzazione con ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading e chiusura manuale

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Esecuzione dell'operazione asincrona
await saveData();
hide();  // Chiude manualmente il caricamento
ctx.message.success(ctx.t('Saved'));
```

### Configurazione personalizzata con open

```ts
ctx.message.open({
  type: 'success',
  content: 'Avviso di successo personalizzato',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Chiudere tutti i messaggi

```ts
ctx.message.destroy();
```

## Differenza tra ctx.message e ctx.notification

| Caratteristica | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Posizione** | Parte superiore centrale della pagina | Angolo in alto a destra |
| **Scopo** | Avviso leggero temporaneo, scompare automaticamente | Pannello di notifica, può includere titolo e descrizione, adatto per una visualizzazione prolungata |
| **Scenari tipici** | Feedback sulle operazioni, avvisi di validazione, copia riuscita | Notifiche di completamento attività, messaggi di sistema, contenuti lunghi che richiedono l'attenzione dell'utente |

## Correlati

- [ctx.notification](./notification.md) - Notifiche in alto a destra, adatte per durate di visualizzazione più lunghe
- [ctx.modal](./modal.md) - Conferma modale, interazione bloccante
- [ctx.t()](./t.md) - Internazionalizzazione, comunemente usata con message