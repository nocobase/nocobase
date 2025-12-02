---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Processo di configurazione

## Panoramica
Dopo aver abilitato il **plugin** Email, gli amministratori devono prima completare la configurazione necessaria affinché gli utenti possano connettere i propri account email a NocoBase. Attualmente, è supportato solo l'accesso tramite autorizzazione per gli account Outlook e Gmail; l'accesso diretto con account Microsoft e Google non è ancora disponibile.

Il fulcro della configurazione risiede nelle impostazioni di autenticazione per le chiamate API del **fornitore di servizi email**. Gli amministratori devono completare i seguenti passaggi per garantire il corretto funzionamento del **plugin**:

1.  **Ottenere le informazioni di autenticazione dal fornitore di servizi**
    -   Acceda alla console per sviluppatori del **fornitore di servizi email** (ad esempio, Google Cloud Console o Microsoft Azure Portal).
    -   Crei una nuova applicazione o progetto e abiliti il servizio API per Gmail o Outlook.
    -   Ottenga il **Client ID** e il **Client Secret** corrispondenti.
    -   Configuri l'URI di reindirizzamento (Redirect URI) in modo che corrisponda all'indirizzo di callback del **plugin** di NocoBase.

2.  **Configurazione del fornitore di servizi email**
    -   Vada alla pagina di configurazione del **plugin** Email.
    -   Fornisca le informazioni di autenticazione API richieste, inclusi il **Client ID** e il **Client Secret**, per garantire una corretta autorizzazione con il **fornitore di servizi email**.

3.  **Accesso tramite autorizzazione**
    -   Gli utenti accedono ai propri account email tramite il protocollo OAuth.
    -   Il **plugin** genererà e memorizzerà automaticamente il token di autorizzazione dell'utente, utilizzato per le successive chiamate API e operazioni email.

4.  **Connessione degli account email**
    -   Dopo un'autorizzazione riuscita, l'account email dell'utente verrà connesso a NocoBase.
    -   Il **plugin** sincronizzerà i dati email dell'utente e fornirà funzionalità per la gestione, l'invio e la ricezione di email.

5.  **Utilizzo delle funzionalità email**
    -   Gli utenti potranno visualizzare, gestire e inviare email direttamente all'interno della piattaforma.
    -   Tutte le operazioni vengono completate tramite chiamate API del **fornitore di servizi email**, garantendo sincronizzazione in tempo reale e trasmissione efficiente.

Attraverso il processo descritto sopra, il **plugin** Email di NocoBase offre agli utenti servizi di gestione email efficienti e sicuri. Se dovesse riscontrare problemi durante la configurazione, La preghiamo di consultare la documentazione pertinente o di contattare il team di supporto tecnico per assistenza.

## Configurazione del **plugin**

### Abilitare il **plugin** Email

1.  Vada alla pagina di gestione dei **plugin**
2.  Trovi il **plugin** "Email manager" e lo abiliti.

### Configurazione del **fornitore di servizi email**

Dopo aver abilitato il **plugin** Email, può configurare i **fornitori di servizi email**. Attualmente, sono supportati i servizi email di Google e Microsoft. Clicchi su "Impostazioni" -> "Impostazioni Email" nella barra superiore per accedere alla pagina delle impostazioni.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Per ogni **fornitore di servizi**, è necessario inserire il **Client ID** e il **Client Secret**. Le sezioni seguenti descriveranno in dettaglio come ottenere questi due parametri.