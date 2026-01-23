---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Ramo Parallelo

Il nodo di ramo parallelo può dividere un flusso di lavoro in più rami. Ogni ramo può essere configurato con nodi diversi, e il metodo di esecuzione varia a seconda della modalità del ramo. Utilizzi il nodo di ramo parallelo negli scenari in cui è necessario eseguire più azioni contemporaneamente.

## Installazione

Plugin integrato, non è richiesta alcuna installazione.

## Creazione del nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Ramo Parallelo":

![Aggiungi Ramo Parallelo](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Dopo aver aggiunto un nodo di ramo parallelo al flusso di lavoro, vengono aggiunti due sotto-rami per impostazione predefinita. Può anche aggiungere altri rami cliccando sul pulsante "Aggiungi ramo". Può aggiungere un numero qualsiasi di nodi a ogni ramo. I rami non necessari possono essere rimossi cliccando sul pulsante di eliminazione all'inizio del ramo.

![Gestisci Rami Paralleli](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Configurazione del nodo

### Modalità del ramo

Il nodo di ramo parallelo ha le seguenti tre modalità:

- **Tutti con successo**: Il flusso di lavoro continuerà a eseguire i nodi successivi ai rami solo se tutti i rami vengono eseguiti con successo. Altrimenti, se un qualsiasi ramo termina prematuramente, sia per fallimento, errore o qualsiasi altro stato non di successo, l'intero nodo di ramo parallelo terminerà prematuramente con tale stato. Questa modalità è anche nota come "modalità All".
- **Qualsiasi con successo**: Il flusso di lavoro continuerà a eseguire i nodi successivi ai rami non appena un qualsiasi ramo viene eseguito con successo. L'intero nodo di ramo parallelo terminerà prematuramente solo se tutti i rami terminano prematuramente, sia per fallimento, errore o qualsiasi altro stato non di successo. Questa modalità è anche nota come "modalità Any".
- **Qualsiasi con successo o fallimento**: Il flusso di lavoro continuerà a eseguire i nodi successivi ai rami non appena un qualsiasi ramo viene eseguito con successo. Tuttavia, se un qualsiasi nodo fallisce, l'intero ramo parallelo terminerà prematuramente con tale stato. Questa modalità è anche nota come "modalità Race".

Indipendentemente dalla modalità, ogni ramo verrà eseguito in ordine da sinistra a destra fino a quando non saranno soddisfatte le condizioni della modalità di ramo preimpostata, a quel punto continuerà con i nodi successivi o uscirà prematuramente.

## Esempio

Faccia riferimento all'esempio in [Nodo di ritardo](./delay.md).