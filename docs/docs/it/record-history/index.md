---
pkg: '@nocobase/plugin-record-history'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Cronologia Record

## Introduzione

Il plugin **Cronologia Record** traccia le modifiche ai dati salvando automaticamente istantanee e differenze delle operazioni di **creazione**, **modifica** ed **eliminazione**. Aiuta gli utenti a rivedere rapidamente le modifiche ai dati e a verificare le attività operative.

![](https://static-docs.nocobase.com/202511011338499.png)

## Abilitare la Cronologia Record

### Aggiungere collezioni e campi

Per prima cosa, acceda alla pagina delle impostazioni del plugin Cronologia Record per aggiungere le collezioni e i campi di cui desidera tracciare la cronologia. Per migliorare l'efficienza della registrazione ed evitare ridondanze, Le consigliamo di configurare solo le collezioni e i campi essenziali. Campi come ID univoco, `createdAt`, `updatedAt`, `createdBy` e `updatedBy` di solito non necessitano di essere registrati.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sincronizzare le istantanee dei dati storici

- Per i record creati prima dell'abilitazione della cronologia, le modifiche verranno registrate solo dopo che il primo aggiornamento avrà generato un'istantanea; pertanto, il primo aggiornamento o eliminazione non lascerà una traccia storica.
- Se desidera conservare la cronologia dei dati esistenti, può eseguire una sincronizzazione delle istantanee una tantum.
- La dimensione dell'istantanea per collezione è calcolata come: numero di record × numero di campi da registrare.
- Per set di dati di grandi dimensioni, Le consigliamo di filtrare per ambito dati e sincronizzare solo i record importanti.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Clicchi su **“Sincronizza istantanee storiche”**, configuri i campi e l'ambito dei dati, e avvii la sincronizzazione.

![](https://static-docs.nocobase.com/202511011320958.png)

L'attività di sincronizzazione verrà messa in coda ed eseguita in background. Può aggiornare l'elenco per verificarne lo stato di completamento.

## Utilizzare il blocco Cronologia Record

### Aggiungere un blocco

Selezioni il blocco Cronologia Record e scelga una collezione per aggiungere il blocco di cronologia corrispondente alla Sua pagina.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Se sta aggiungendo un blocco di cronologia all'interno di un pop-up dei dettagli di un record, può selezionare **“Record corrente”** per visualizzare la cronologia specifica di quel record.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Modificare i modelli di descrizione

Clicchi su **“Modifica modello”** nelle impostazioni del blocco per configurare il testo descrittivo per i record delle operazioni.

![](https://static-docs.nocobase.com/202511011340406.png)

Può configurare modelli di descrizione separati per le operazioni di creazione, modifica ed eliminazione. Per le operazioni di modifica, può anche configurare il modello di descrizione per le modifiche ai campi, sia come modello unico per tutti i campi che per campi specifici individualmente.

![](https://static-docs.nocobase.com/202511011346400.png)

È possibile utilizzare variabili durante la configurazione del testo.

![](https://static-docs.nocobase.com/202511011347163.png)

Dopo la configurazione, può scegliere di applicare il modello a **“Tutti i blocchi di cronologia record della collezione corrente”** o **“Solo questo blocco di cronologia record”**.

![](https://static-docs.nocobase.com/202511011348885.png)