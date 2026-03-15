:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/t).
:::

# ctx.t()

Una funzione scorciatoia i18n utilizzata in RunJS per tradurre testi in base alle impostazioni della lingua del contesto corrente. È adatta per l'internazionalizzazione di testi inline come pulsanti, titoli e avvisi.

## Casi d'uso

`ctx.t()` può essere utilizzato in tutti gli ambienti di esecuzione di RunJS.

## Definizione del tipo

```ts
t(key: string, options?: Record<string, any>): string
```

## Parametri

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `key` | `string` | Chiave di traduzione o template con segnaposto (es. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Opzionale. Variabili di interpolazione (es. `{ name: 'Mario', count: 5 }`) o opzioni i18n (es. `defaultValue`, `ns`). |

## Valore di ritorno

- Restituisce la stringa tradotta. Se non esiste una traduzione per la chiave e non viene fornito un `defaultValue`, potrebbe restituire la chiave stessa o la stringa interpolata.

## Namespace (ns)

Il **namespace predefinito per l'ambiente RunJS è `runjs`**. Quando non viene specificato `ns`, `ctx.t(key)` cercherà la chiave nel namespace `runjs`.

```ts
// Cerca la chiave nel namespace 'runjs' per impostazione predefinita
ctx.t('Submit'); // Equivale a ctx.t('Submit', { ns: 'runjs' })

// Cerca la chiave in un namespace specifico
ctx.t('Submit', { ns: 'myModule' });

// Cerca in più namespace in sequenza (prima 'runjs', poi 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Esempi

### Chiave semplice

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Con variabili di interpolazione

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Testi dinamici (es. tempo relativo)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Specifica di un namespace

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Note

- **Plugin di localizzazione**: Per tradurre i testi, è necessario attivare il plugin di localizzazione. Le chiavi di traduzione mancanti verranno estratte automaticamente nell'elenco di gestione della localizzazione per una manutenzione e traduzione unificata.
- Supporta l'interpolazione in stile i18next: utilizzi `{{nomeVariabile}}` nella chiave e passi la variabile corrispondente in `options` per sostituirla.
- La lingua è determinata dal contesto corrente (es. `ctx.i18n.language`, locale dell'utente).

## Correlati

- [ctx.i18n](./i18n.md): Leggere o cambiare la lingua