:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Eventi della Collezione

## Introduzione

I trigger di tipo "evento della `collezione`" ascoltano gli eventi di creazione, aggiornamento ed eliminazione su una `collezione`. Quando si verifica un'operazione sui dati di quella `collezione` e vengono soddisfatte le condizioni configurate, attivano il `flusso di lavoro` corrispondente. Ad esempio, può usarli in scenari come la deduzione dell'inventario di un prodotto dopo la creazione di un nuovo ordine, o l'attesa di una revisione manuale dopo l'aggiunta di un nuovo commento.

## Utilizzo di Base

Esistono diversi tipi di modifiche alla `collezione`:

1. Dopo aver creato dati.
2. Dopo aver aggiornato dati.
3. Dopo aver creato o aggiornato dati.
4. Dopo aver eliminato dati.

![Eventi della Collezione_Selezione del Momento di Attivazione](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Può scegliere il momento di attivazione in base alle diverse esigenze aziendali. Quando la modifica selezionata include l'aggiornamento della `collezione`, può anche specificare i campi che sono stati modificati. La condizione di attivazione viene soddisfatta solo quando i campi selezionati cambiano. Se non seleziona alcun campo, significa che una modifica in qualsiasi campo può attivare il `flusso di lavoro`.

![Eventi della Collezione_Selezione dei Campi Modificati](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Più nello specifico, può configurare regole di condizione per ogni campo della riga di dati che attiva l'evento. Il trigger si attiverà solo quando i campi soddisfano le condizioni corrispondenti.

![Eventi della Collezione_Configurazione delle Condizioni dei Dati](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Dopo l'attivazione di un evento della `collezione`, la riga di dati che ha generato l'evento verrà iniettata nel piano di esecuzione come dati di contesto del trigger, per essere utilizzata come variabile dai nodi successivi nel `flusso di lavoro`. Tuttavia, quando i nodi successivi desiderano utilizzare i campi di relazione di questi dati, è necessario prima configurare il precaricamento dei dati di relazione. I dati di relazione selezionati verranno iniettati nel contesto insieme al trigger e potranno essere selezionati e utilizzati gerarchicamente.

## Suggerimenti Correlati

### Attivazione tramite Operazioni Dati di Massa Non Attualmente Supportata

Gli eventi della `collezione` non supportano attualmente l'attivazione tramite operazioni dati di massa. Ad esempio, quando crea un articolo e aggiunge contemporaneamente più tag per quell'articolo (dati di relazione uno-a-molti), verrà attivato solo il `flusso di lavoro` per la creazione dell'articolo. I molteplici tag aggiunti contemporaneamente non attiveranno il `flusso di lavoro` per la creazione dei tag. Quando associa o aggiunge dati di relazione molti-a-molti, non verrà attivato nemmeno il `flusso di lavoro` per la `collezione` intermedia.

### Le Operazioni sui Dati Eseguite al di Fuori dell'Applicazione Non Attiveranno Eventi

Le operazioni sulle `collezioni` tramite chiamate API HTTP all'interfaccia dell'applicazione possono anche attivare eventi corrispondenti. Tuttavia, se le modifiche ai dati vengono effettuate direttamente tramite operazioni sul database anziché tramite l'applicazione NocoBase, gli eventi corrispondenti non possono essere attivati. Ad esempio, i trigger nativi del database non saranno associati ai `flussi di lavoro` nell'applicazione.

Inoltre, l'utilizzo del nodo di azione SQL per operare sul database equivale a operazioni dirette sul database e non attiverà eventi della `collezione`.

### Fonti Dati Esterne

I `flussi di lavoro` supportano le `fonti dati` esterne dalla versione `0.20`. Se utilizza un `plugin` per `fonte dati` esterna e l'evento della `collezione` è configurato per una `fonte dati` esterna, purché le operazioni sui dati di quella `fonte dati` siano eseguite all'interno dell'applicazione (come creazione utente, aggiornamenti e operazioni sui dati del `flusso di lavoro`), gli eventi della `collezione` corrispondenti possono essere attivati. Tuttavia, se le modifiche ai dati vengono effettuate tramite altri sistemi o direttamente nel database esterno, gli eventi della `collezione` non possono essere attivati.

## Esempio

Prendiamo come esempio lo scenario del calcolo del prezzo totale e della deduzione dell'inventario dopo la creazione di un nuovo ordine.

Per prima cosa, creiamo una `collezione` di Prodotti e una `collezione` di Ordini con i seguenti modelli di dati:

| Nome Campo          | Tipo Campo            |
| ------------------- | --------------------- |
| Nome Prodotto       | Testo su Riga Singola |
| Prezzo              | Numero                |
| Inventario          | Intero                |

| Nome Campo      | Tipo Campo             |
| --------------- | ---------------------- |
| ID Ordine       | Sequenza               |
| Prodotto Ordine | Molti-a-Uno (Prodotti) |
| Totale Ordine   | Numero                 |

E aggiungiamo alcuni dati di prodotto di base:

| Nome Prodotto   | Prezzo | Inventario |
| --------------- | ------ | ---------- |
| iPhone 14 Pro   | 7999   | 10         |
| iPhone 13 Pro   | 5999   | 0          |

Quindi, creiamo un `flusso di lavoro` basato sull'evento della `collezione` Ordini:

![Eventi della Collezione_Esempio_Attivazione Nuovo Ordine](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Ecco alcune delle opzioni di configurazione:

- `Collezione`: Selezioni la `collezione` "Ordini".
- Momento di attivazione: Selezioni "Dopo aver creato dati".
- Condizioni di attivazione: Lasci vuoto.
- Precaricamento dati di relazione: Selezioni "Prodotti".

Quindi, configuri altri nodi secondo la logica del `flusso di lavoro`: verifichi se l'inventario del prodotto è maggiore di 0. Se lo è, deduca l'inventario; altrimenti, l'ordine non è valido e deve essere eliminato:

![Eventi della Collezione_Esempio_Orchestrazione Flusso di Lavoro Nuovo Ordine](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

La configurazione dei nodi sarà spiegata in dettaglio nella documentazione per i tipi di nodo specifici.

Abiliti questo `flusso di lavoro` e lo testi creando un nuovo ordine tramite l'interfaccia. Dopo aver effettuato un ordine per "iPhone 14 Pro", l'inventario del prodotto corrispondente sarà ridotto a 9. Se viene effettuato un ordine per "iPhone 13 Pro", l'ordine verrà eliminato a causa dell'inventario insufficiente.

![Eventi della Collezione_Esempio_Risultato Esecuzione Nuovo Ordine](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)