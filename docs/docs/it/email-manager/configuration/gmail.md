---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Configurazione Google

### Prerequisiti

Affinché gli utenti possano collegare i propri account Google Mail a NocoBase, è necessario che NocoBase sia distribuito su un server in grado di accedere ai servizi Google, poiché il backend richiamerà le API di Google.
    
### Registrare un account

1. Apra https://console.cloud.google.com/welcome per accedere a Google Cloud.  
2. Al primo accesso, dovrà accettare i termini e le condizioni.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Creare un'applicazione

1. Clicchi su "Select a project" in alto.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Clicchi sul pulsante "NEW PROJECT" nel pannello a comparsa.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Inserisca le informazioni del progetto.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Dopo aver creato il progetto, lo selezioni.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Abilitare l'API di Gmail

1. Clicchi sul pulsante "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Acceda al pannello di controllo "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Cerchi "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Clicchi sul pulsante "ENABLE" per abilitare l'API di Gmail.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Configurare la schermata di consenso OAuth

1. Clicchi sul menu "OAuth consent screen" a sinistra.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Selezioni "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Inserisca le informazioni del progetto (verranno visualizzate nella pagina di autorizzazione) e clicchi su Salva.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Inserisca le informazioni di contatto dello sviluppatore e clicchi su Continua.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Clicchi su Continua.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Aggiunga gli utenti di test per la verifica prima della pubblicazione dell'applicazione.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Clicchi su Continua.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Riveda le informazioni di riepilogo e torni al pannello di controllo.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Creare le credenziali

1. Clicchi sul menu "Credentials" a sinistra.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Clicchi sul pulsante "CREATE CREDENTIALS" e selezioni "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Selezioni "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Inserisca le informazioni dell'applicazione.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Inserisca il dominio di deployment finale del progetto (l'esempio qui è un indirizzo di test di NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Aggiunga l'URI di reindirizzamento autorizzato. Deve essere `dominio + "/admin/settings/mail/oauth2"`. Esempio: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Clicchi su Crea per visualizzare le informazioni OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Copi il Client ID e il Client secret e li incolli nella pagina di configurazione della posta elettronica.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Clicchi su Salva per completare la configurazione.  

### Pubblicare l'applicazione

Dopo aver completato il processo sopra descritto e aver testato funzionalità come l'accesso autorizzato degli utenti di test e l'invio di email, può pubblicare l'applicazione.

1. Clicchi sul menu "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Clicchi sul pulsante "EDIT APP", quindi sul pulsante "SAVE AND CONTINUE" in basso.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Clicchi sul pulsante "ADD OR REMOVE SCOPES" per selezionare gli ambiti di autorizzazione utente. 

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Cerchi "Gmail API", quindi selezioni "Gmail API" (si assicuri che il valore dello Scope sia l'API di Gmail con "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Clicchi sul pulsante "UPDATE" in basso per salvare.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Clicchi sul pulsante "SAVE AND CONTINUE" in fondo a ogni pagina e infine sul pulsante "BACK TO DASHBOARD" per tornare alla pagina del pannello di controllo.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Clicchi sul pulsante "PUBLISH APP". Apparirà una pagina di conferma che elenca le informazioni richieste per la pubblicazione. Quindi clicchi sul pulsante "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Tornando alla pagina della console, vedrà che lo stato di pubblicazione è "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Clicchi sul pulsante "PREPARE FOR VERIFICATION", compili le informazioni richieste e clicchi sul pulsante "SAVE AND CONTINUE" (i dati nell'immagine sono solo a scopo dimostrativo).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Continui a compilare le informazioni necessarie (i dati nell'immagine sono solo a scopo dimostrativo).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Clicchi sul pulsante "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Clicchi sul pulsante "SUBMIT FOR VERIFICATION" per inviare la richiesta di verifica.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Attenda il risultato dell'approvazione.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Se l'approvazione è ancora in sospeso, gli utenti possono cliccare sul link non sicuro per autorizzare e accedere.

![](https://static-docs.nocobase.com/mail-1735633689645.png)