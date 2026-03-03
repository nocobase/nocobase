:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/set-value).
:::

# ctx.setValue()

Imposta il valore del campo corrente in scenari di campi modificabili come JSField e JSItem. In combinazione con `ctx.getValue()`, consente il binding bidirezionale con il modulo.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **JSField** | Scrive i valori selezionati dall'utente o calcolati nei campi personalizzati modificabili. |
| **JSItem** | Aggiorna il valore della cella corrente negli elementi modificabili di tabelle o sotto-tabelle. |
| **JSColumn** | Aggiorna il valore del campo della riga corrispondente in base alla logica durante il rendering della colonna della tabella. |

> **Nota**: `ctx.setValue(v)` è disponibile solo nei contesti RunJS con binding al modulo. Non è disponibile in scenari senza binding di campo, come i flussi di lavoro, le regole di collegamento o JSBlock. Si consiglia di utilizzare l'optional chaining prima dell'uso: `ctx.setValue?.(value)`.

## Definizione del tipo

```ts
setValue<T = any>(value: T): void;
```

- **Parametri**: `value` è il valore del campo da scrivere. Il tipo è determinato dal tipo di elemento del modulo del campo.

## Comportamento

- `ctx.setValue(v)` aggiorna il valore del campo corrente nell'Ant Design Form e attiva la logica di collegamento del modulo e la validazione correlate.
- Se il modulo non ha terminato il rendering o il campo non è registrato, la chiamata potrebbe non avere effetto. Si consiglia di utilizzare `ctx.getValue()` per confermare l'esito della scrittura.

## Esempi

### Binding bidirezionale con getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Impostazione di valori predefiniti in base alle condizioni

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Scrittura nel campo corrente quando collegato ad altri campi

```ts
// Aggiorna in modo sincrono il campo corrente quando un altro campo cambia
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Personalizzato', value: 'custom' });
}
```

## Note importanti

- Nei campi non modificabili (ad esempio, JSField in modalità sola lettura, JSBlock), `ctx.setValue` potrebbe essere `undefined`. Si consiglia di utilizzare `ctx.setValue?.(value)` per evitare errori.
- Quando si impostano i valori per i campi di associazione (M2O, O2M, ecc.), è necessario passare una struttura corrispondente al tipo di campo (ad esempio, `{ id, [titleField]: label }`), a seconda della configurazione specifica del campo.

## Correlati

- [ctx.getValue()](./get-value.md) - Ottiene il valore del campo corrente, usato con setValue per il binding bidirezionale.
- [ctx.form](./form.md) - Istanza di Ant Design Form, utilizzata per leggere o scrivere altri campi.
- `js-field:value-change` - Un evento del contenitore attivato quando un valore esterno cambia, utilizzato per aggiornare la visualizzazione.