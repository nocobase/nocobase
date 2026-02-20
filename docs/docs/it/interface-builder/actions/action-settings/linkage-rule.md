:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Regole di Interconnessione delle Azioni

## Introduzione

Le regole di interconnessione delle azioni Le consentono di controllare dinamicamente lo stato di un'azione (come mostrare, abilitare, nascondere, disabilitare, ecc.) in base a condizioni specifiche. Configurando queste regole, può collegare il comportamento dei pulsanti d'azione al record corrente, al ruolo utente o ai dati contestuali.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Come si usa

Quando la condizione è soddisfatta (se non è impostata alcuna condizione, viene superata per impostazione predefinita), si attiva l'esecuzione delle impostazioni delle proprietà o di JavaScript. La valutazione delle condizioni supporta l'uso di costanti e variabili.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

La regola permette di modificare le proprietà dei pulsanti.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Costanti

Esempio: Gli ordini pagati non possono essere modificati.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variabili

### Variabili di sistema

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Esempio 1: Controllare la visibilità di un pulsante in base al tipo di dispositivo corrente.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Esempio 2: Il pulsante di aggiornamento massivo nell'intestazione della tabella del blocco ordini è disponibile solo per il ruolo Amministratore; altri ruoli non possono eseguire questa azione.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variabili contestuali

Esempio: Il pulsante "Aggiungi" sulle opportunità d'ordine (blocco di associazione) è abilitato solo quando lo stato dell'ordine è "In attesa di pagamento" o "Bozza". In altri stati, il pulsante sarà disabilitato.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Per maggiori informazioni sulle variabili, consulti [Variabili](/interface-builder/variables).