---
pkg: '@nocobase/plugin-auth'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Autenticazione tramite password

## Interfaccia di configurazione

![](https://static-docs.nocobase.com/202411131505095.png)

## Consenti registrazione

Quando la registrazione è consentita, la pagina di accesso mostrerà il link per creare un account e sarà possibile accedere alla pagina di registrazione.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Pagina di registrazione

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Quando la registrazione non è consentita, la pagina di accesso non mostrerà il link per creare un account.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Quando la registrazione non è consentita, non è possibile accedere alla pagina di registrazione.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Impostazioni del modulo di registrazione<Badge>v1.4.0-beta.7+</Badge>

È possibile configurare quali campi nella collezione utente devono essere visualizzati nel modulo di registrazione e se sono obbligatori. Almeno uno tra il nome utente o l'email deve essere impostato come visibile e obbligatorio.

![](https://static-docs.nocobase.com/202411262133669.png)

Pagina di registrazione

![](https://static-docs.nocobase.com/202411262135801.png)

## Password dimenticata<Badge>v1.8.0+</Badge>

La funzione "Password dimenticata" consente agli utenti di reimpostare la propria password tramite verifica email, nel caso l'avessero dimenticata.

### Configurazione amministratore

1.  **Abilitare la funzione "Password dimenticata"**

    Nella scheda "Impostazioni" > "Autenticazione utente" > "Password dimenticata", spunti la casella di controllo "Abilita la funzione "Password dimenticata"".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Configurare il canale di notifica**

    Selezioni un canale di notifica email (attualmente è supportata solo l'email). Se non è disponibile alcun canale di notifica, è necessario aggiungerne uno prima.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Configurare l'email di reimpostazione password**

    Personalizzi l'oggetto e il contenuto dell'email, supportando il formato HTML o testo semplice. Può utilizzare le seguenti variabili:
    - Utente corrente
    - Impostazioni di sistema
    - Link per reimpostare la password
    - Scadenza del link di reimpostazione (minuti)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Impostare la scadenza del link di reimpostazione**

    Imposti il periodo di validità (in minuti) per il link di reimpostazione; il valore predefinito è 120 minuti.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Flusso di utilizzo per l'utente

1.  **Avviare la richiesta di reimpostazione password**

    Nella pagina di accesso, clicchi sul link "Password dimenticata" (è necessario che l'amministratore abbia prima abilitato la funzione "Password dimenticata") per accedere alla pagina di reimpostazione password.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Inserisca l'indirizzo email registrato e clicchi sul pulsante "Invia email di reimpostazione".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Reimpostare la password**

    L'utente riceverà un'email contenente un link di reimpostazione. Dopo aver cliccato sul link, imposti una nuova password nella pagina che si aprirà.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Una volta completata l'impostazione, l'utente potrà accedere al sistema con la nuova password.

### Note

- Il link di reimpostazione ha un limite di tempo; per impostazione predefinita, è valido per 120 minuti dopo la sua generazione (configurabile dall'amministratore).
- Il link può essere utilizzato una sola volta e diventa immediatamente non valido dopo l'uso.
- Se l'utente non riceve l'email di reimpostazione, verifichi che l'indirizzo email sia corretto o controlli la cartella spam.
- L'amministratore dovrebbe assicurarsi che la configurazione del server di posta sia corretta per garantire che l'email di reimpostazione possa essere inviata con successo.