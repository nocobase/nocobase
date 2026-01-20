:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Regole di collegamento tra blocchi

## Introduzione

Le regole di collegamento tra blocchi consentono agli utenti di controllare dinamicamente la visualizzazione dei blocchi, gestendo la presentazione degli elementi a livello di blocco. Poiché i blocchi fungono da contenitori per campi e pulsanti di azione, queste regole permettono agli utenti di controllare in modo flessibile la visualizzazione dell'intera vista, agendo a livello di blocco.

![20251029112218](https://static-docs.nocobase.com/20251029112218.png)

![20251029112338](https://static-docs.nocobase.com/20251029112338.png)

> **Nota**: Prima dell'esecuzione delle regole di collegamento tra blocchi, la visualizzazione del blocco deve prima superare un **controllo dei permessi ACL**. Solo quando un utente dispone dei permessi di accesso corrispondenti, la logica delle regole di collegamento tra blocchi verrà valutata. In altre parole, le regole di collegamento tra blocchi entrano in vigore solo dopo che i requisiti di permesso di visualizzazione ACL sono stati soddisfatti. In assenza di regole di collegamento tra blocchi, il blocco viene visualizzato per impostazione predefinita.

### Controllo dei blocchi con variabili globali

Le **regole di collegamento tra blocchi** supportano l'uso di variabili globali per controllare dinamicamente il contenuto visualizzato nei blocchi, consentendo agli utenti con ruoli e permessi diversi di visualizzare e interagire con viste dati personalizzate. Ad esempio, in un sistema di gestione degli ordini, sebbene ruoli diversi (come amministratori, personale di vendita e personale finanziario) abbiano tutti il permesso di visualizzare gli ordini, i campi e i pulsanti di azione che ogni ruolo deve vedere potrebbero differire. Configurando le variabili globali, è possibile regolare in modo flessibile i campi visualizzati, i pulsanti di azione e persino le regole di ordinamento e filtro dei dati in base al ruolo dell'utente, ai permessi o ad altre condizioni.

#### Casi d'uso specifici:

- **Controllo di ruoli e permessi**: Controllare la visibilità o la modificabilità di determinati campi in base ai permessi dei diversi ruoli. Ad esempio, il personale di vendita può visualizzare solo le informazioni di base dell'ordine, mentre il personale finanziario può visualizzare i dettagli di pagamento.
- **Viste personalizzate**: Personalizzare diverse viste di blocco per dipartimenti o team differenti, assicurando che ogni utente visualizzi solo i contenuti pertinenti al proprio lavoro, migliorando così l'efficienza.
- **Gestione dei permessi di azione**: Controllare la visualizzazione dei pulsanti di azione utilizzando variabili globali. Ad esempio, alcuni ruoli potrebbero essere in grado solo di visualizzare i dati, mentre altri possono eseguire azioni come la modifica o l'eliminazione.

### Controllo dei blocchi con variabili contestuali

I blocchi possono anche essere controllati da variabili nel contesto. Ad esempio, è possibile utilizzare variabili contestuali come "Record corrente", "Modulo corrente" e "Record popup corrente" per mostrare o nascondere dinamicamente i blocchi.

Esempio: Il blocco "Informazioni opportunità ordine" viene visualizzato solo quando lo stato dell'ordine è "Pagato".

![20251029114022](https://static-docs.nocobase.com/20251029114022.png)

Per maggiori informazioni sulle regole di collegamento, consulti [Regole di collegamento](/interface-builder/linkage-rule).