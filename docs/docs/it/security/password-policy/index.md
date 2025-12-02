---
pkg: '@nocobase/plugin-password-policy'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Criteri Password

## Introduzione

Imposti le regole per le password, la scadenza delle password e le politiche di sicurezza per l'accesso tramite password per tutti gli utenti, e gestisca gli utenti bloccati.

## Regole per le Password

![](https://static-docs.nocobase.com/202412281329313.png)

### Lunghezza Minima della Password

Imposti il requisito di lunghezza minima per le password. La lunghezza massima è di 64 caratteri.

### Requisiti di Complessità della Password

Sono supportate le seguenti opzioni:

- Deve contenere lettere e numeri
- Deve contenere lettere, numeri e simboli
- Deve contenere numeri, lettere maiuscole e minuscole
- Deve contenere numeri, lettere maiuscole e minuscole e simboli
- Deve contenere almeno 3 dei seguenti tipi di caratteri: numeri, lettere maiuscole, lettere minuscole e caratteri speciali
- Nessuna restrizione

![](https://static-docs.nocobase.com/202412281331649.png)

### La Password non può contenere il Nome Utente

Imposti se la password può contenere il nome utente dell'utente corrente.

### Numero di Password nella Cronologia

Memorizza il numero di password utilizzate più di recente dall'utente. Gli utenti non possono riutilizzare queste password quando la modificano. 0 significa nessuna restrizione, il numero massimo è 24.

## Configurazione della Scadenza della Password

![](https://static-docs.nocobase.com/202412281335588.png)

### Periodo di Validità della Password

Il periodo di validità della password dell'utente. Gli utenti devono cambiare la propria password prima della scadenza per reimpostare il periodo di validità. Se la password non viene cambiata prima della scadenza, non sarà più possibile accedere con la vecchia password e sarà necessario l'intervento di un amministratore per il reset. Se sono configurati altri metodi di accesso, l'utente potrà comunque accedere tramite questi.

### Canale di Notifica per la Scadenza della Password

Entro 10 giorni dalla scadenza della password dell'utente, viene inviato un promemoria ogni volta che l'utente effettua l'accesso. Per impostazione predefinita, il promemoria viene inviato tramite il canale di messaggistica interna "Promemoria Scadenza Password", che può essere gestito nella sezione di gestione delle notifiche.

### Consigli per la Configurazione

Poiché la scadenza della password potrebbe impedire l'accesso agli account, inclusi quelli degli amministratori, Le consigliamo di modificare tempestivamente le password e di configurare nel sistema più account con l'autorizzazione a modificare le password degli utenti.

## Sicurezza dell'Accesso tramite Password

Imposti i limiti per i tentativi di accesso con password non valida.

![](https://static-docs.nocobase.com/202412281339724.png)

### Numero Massimo di Tentativi di Accesso con Password Non Valida

Imposti il numero massimo di tentativi di accesso che un utente può effettuare entro un intervallo di tempo specificato.

### Intervallo di Tempo Massimo per Tentativi di Accesso con Password Non Valida (Secondi)

Imposti l'intervallo di tempo (in secondi) utilizzato per calcolare il numero massimo di tentativi di accesso non validi da parte di un utente.

### Durata del Blocco (Secondi)

Imposti la durata del blocco per un utente che ha superato il limite di tentativi di accesso con password non valida (0 significa nessuna restrizione). Durante il periodo di blocco, all'utente sarà impedito l'accesso al sistema tramite qualsiasi metodo di autenticazione, incluse le API keys. Se è necessario sbloccare manualmente un utente, può fare riferimento a [Blocco Utente](./lockout.md).

### Scenari

#### Nessuna Restrizione

Nessuna restrizione sul numero di tentativi di accesso con password non valida da parte degli utenti.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Limita la Frequenza dei Tentativi, Non Bloccare l'Utente

Esempio: Un utente può tentare di accedere al massimo 5 volte ogni 5 minuti.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Blocca l'Utente Dopo Aver Superato il Limite

Esempio: Se un utente effettua 5 tentativi consecutivi di accesso con password non valida entro 5 minuti, l'utente viene bloccato per 2 ore.

![](https://static-docs.nocobase.com/202412281344952.png)

### Consigli per la Configurazione

- La configurazione del numero di tentativi di accesso con password non valida e dell'intervallo di tempo è solitamente utilizzata per limitare i tentativi di accesso ad alta frequenza in un breve periodo, prevenendo attacchi di forza bruta.
- La decisione di bloccare l'utente dopo aver superato il limite dovrebbe essere valutata in base agli scenari di utilizzo effettivi. L'impostazione della durata del blocco potrebbe essere sfruttata in modo malevolo: gli attaccanti potrebbero intenzionalmente inserire password errate più volte per un account specifico, costringendolo al blocco e rendendolo inutilizzabile. Questo può essere mitigato combinando restrizioni IP, limiti di frequenza delle API e altre misure.
- Poiché il blocco dell'account impedisce l'accesso al sistema, inclusi gli account amministratore, è consigliabile configurare nel sistema più account che abbiano l'autorità per sbloccare gli utenti.