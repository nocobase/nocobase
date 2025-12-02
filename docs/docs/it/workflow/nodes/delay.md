:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Ritardo

## Introduzione

Il nodo Ritardo permette di aggiungere un ritardo a un **flusso di lavoro**. Una volta terminato il ritardo, il **flusso di lavoro** può continuare l'esecuzione dei nodi successivi oppure terminare in anticipo, a seconda della configurazione.

Lo si usa spesso in combinazione con il nodo Ramo Parallelo. È possibile aggiungere un nodo Ritardo a uno dei rami per gestire le azioni successive a un timeout. Ad esempio, in un ramo parallelo, un ramo potrebbe contenere un'elaborazione manuale e l'altro un nodo Ritardo. Se l'elaborazione manuale va in timeout, impostando l'opzione "fallisci al timeout" si richiede che l'elaborazione manuale venga completata entro il tempo limite. Impostando invece "continua al timeout" si permette di ignorare l'elaborazione manuale una volta scaduto il tempo.

## Installazione

**Plugin** integrato, non richiede installazione.

## Creare il nodo

Nell'interfaccia di configurazione del **flusso di lavoro**, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Ritardo":

![Creare nodo Ritardo](https://static-docs.nocobase.com/d0816999c9f7acaec1c409bd8fb6cc36.png)

## Configurazione del nodo

![Nodo Ritardo_Configurazione del nodo](https://static-docs.nocobase.com/5fe8a36535f20a087a0148ffa1cd2aea.png)

### Tempo di ritardo

Per il tempo di ritardo, può inserire un numero e selezionare un'unità di tempo. Le unità di tempo supportate sono: secondi, minuti, ore, giorni e settimane.

### Stato al timeout

Per lo stato al timeout, può scegliere tra "Passa e continua" o "Fallisci ed esci". La prima opzione significa che, una volta terminato il ritardo, il **flusso di lavoro** continuerà a eseguire i nodi successivi. La seconda opzione significa che, una volta terminato il ritardo, il **flusso di lavoro** terminerà prematuramente con uno stato di fallimento.

## Esempio

Prendiamo come esempio lo scenario in cui un ordine di lavoro richiede una risposta entro un tempo limitato dopo essere stato avviato. Dobbiamo aggiungere un nodo manuale in uno dei due rami paralleli e un nodo Ritardo nell'altro. Se l'elaborazione manuale non riceve una risposta entro 10 minuti, lo stato dell'ordine di lavoro viene aggiornato a "timeout e non elaborato".

![Nodo Ritardo_Esempio_Organizzazione del flusso](https://static-docs.nocobase.com/898c84adc376dc211b003a62e16e8e5b.png)