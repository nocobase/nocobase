:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Google Workspace

## Impostare Google come IdP

[Console di amministrazione Google](https://admin.google.com/) - App - App web e per dispositivi mobili

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Dopo aver configurato l'applicazione, copiare l'**URL SSO**, l'**ID entità** e il **Certificato**.

![](https://static-docs.nocobase.com/aafd0a794730e85411c0c8f368637e0.png)

## Aggiungere un nuovo autenticatore su NocoBase

Impostazioni **plugin** - Autenticazione utente - Aggiungi - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Inserire le informazioni copiate, come segue:

- URL SSO: URL SSO
- Certificato pubblico: Certificato
- Emittente IdP: ID entità
- http: Se si sta testando in locale tramite http, selezionare questa opzione.

Quindi, copiare l'Emittente SP/ID entità e l'URL ACS dalla sezione "Utilizzo".

## Compilare le informazioni SP su Google

Tornare alla Console Google, nella pagina **Dettagli del provider di servizi**, inserire l'URL ACS e l'ID entità copiati in precedenza e selezionare **Risposta firmata**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc7234317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

Sotto **Mappatura attributi**, aggiungere le mappature per gli attributi corrispondenti.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)