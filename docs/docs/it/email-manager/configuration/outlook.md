---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Configurazione Microsoft

### Prerequisiti
Affinché gli utenti possano connettere le loro caselle di posta Outlook a NocoBase, è necessario che NocoBase sia distribuito su un server in grado di accedere ai servizi Microsoft. Il backend richiamerà le API Microsoft.

### Registrare un account

1. Apra [https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account)
2. Acceda al suo account Microsoft

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Creare un tenant

1. Apra [https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount](https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount) e acceda al suo account.
2. Compili le informazioni di base e ottenga il codice di verifica.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Compili le altre informazioni e continui.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Compili le informazioni della sua carta di credito (può saltare questo passaggio per ora).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Ottenere l'ID client

1. Clicchi sul menu in alto e selezioni "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Selezioni "App registrations" sulla sinistra.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Clicchi su "New registration" in alto.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Compili le informazioni e invii.

Il nome può essere qualsiasi cosa. Per i tipi di account, selezioni l'opzione mostrata nell'immagine seguente. Può lasciare l'URI di reindirizzamento (Redirect URI) vuoto per ora.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Ottenga l'ID client.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autorizzazione API

1. Apra il menu "API permissions" sulla sinistra.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Clicchi sul pulsante "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Clicchi su "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Cerchi e aggiunga i seguenti permessi. Il risultato finale dovrebbe essere come mostrato nell'immagine seguente.
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Ottenere il segreto

1. Clicchi su "Certificates & secrets" sulla sinistra.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Clicchi sul pulsante "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Compili la descrizione e la data di scadenza, quindi clicchi su Aggiungi.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Ottenga l'ID segreto (Secret ID).

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Copi l'ID client (Client ID) e il segreto client (Client secret) e li incolli nella pagina di configurazione dell'email.

![](https://static-docs.nocobase.com/mail-1733818630710.png)