:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/get-value).
:::

# ctx.getValue()

Negli scenari di campi modificabili come JSField e JSItem, utilizzi questo metodo per ottenere il valore più recente del campo corrente. In combinazione con `ctx.setValue(v)`, consente il data binding bidirezionale con il modulo (form).

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSField** | Legge l'input dell'utente o il valore corrente del modulo nei campi personalizzati modificabili. |
| **JSItem** | Legge il valore della cella corrente negli elementi modificabili di tabelle o sotto-tabelle. |
| **JSColumn** | Legge il valore del campo della riga corrispondente durante il rendering della colonna della tabella. |

> **Nota**: `ctx.getValue()` è disponibile solo nei contesti RunJS con binding al modulo; non è presente in scenari senza binding di campo, come i flussi di lavoro o le regole di collegamento.

## Definizione del tipo

```ts
getValue<T = any>(): T | undefined;
```

- **Valore di ritorno**: Il valore corrente del campo, il cui tipo è determinato dal tipo di elemento del modulo del campo; può essere `undefined` se il campo non è registrato o non è compilato.

## Ordine di recupero

`ctx.getValue()` recupera i valori nel seguente ordine:

1. **Stato del modulo**: Priorità alla lettura dallo stato corrente dell'Ant Design Form.
2. **Valore di fallback**: Se il campo non è presente nel modulo, ricorre al valore iniziale del campo o alle props.

> Se il modulo non ha terminato il rendering o il campo non è registrato, potrebbe restituire `undefined`.

## Esempi

### Rendering basato sul valore corrente

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Inserire prima il contenuto</span>);
} else {
  ctx.render(<span>Valore corrente: {current}</span>);
}
```

### Binding bidirezionale con setValue

```tsx
const { Input } = ctx.libs.antd;

// Legge il valore corrente come valore predefinito
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Correlati

- [ctx.setValue()](./set-value.md) - Imposta il valore del campo corrente, usato con `getValue` per il binding bidirezionale.
- [ctx.form](./form.md) - Istanza di Ant Design Form, per leggere o scrivere altri campi.
- `js-field:value-change` - Evento del contenitore attivato quando i valori esterni cambiano, utilizzato per aggiornare la visualizzazione.