---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Archiviazione File: S3 (Pro)

## Introduzione

Basandosi sul plugin di gestione file, questa versione aggiunge il supporto per tipi di archiviazione file compatibili con il protocollo S3. Qualsiasi servizio di archiviazione oggetti che supporti il protocollo S3 può essere facilmente integrato, come Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, ecc., migliorando ulteriormente la compatibilità e la flessibilità dei servizi di archiviazione.

## Caratteristiche

1. **Caricamento lato client:** I file vengono caricati direttamente sul servizio di archiviazione senza passare attraverso il server NocoBase, garantendo un'esperienza di caricamento più efficiente e veloce.

2. **Accesso Privato:** Tutti gli URL dei file sono indirizzi di autorizzazione temporanei firmati, assicurando un accesso sicuro e a tempo limitato ai file.

## Casi d'uso

1. **Gestione Tabelle File:** Gestire e archiviare centralmente tutti i file caricati, supportando vari tipi di file e metodi di archiviazione per una facile classificazione e recupero.

2. **Archiviazione Campi Allegati:** Utilizzato per l'archiviazione di allegati caricati tramite moduli o record, supportando l'associazione con voci di dati specifiche.

## Configurazione del plugin

1. Abiliti il plugin `plugin-file-storage-s3-pro`.

2. Vada su "Impostazioni -> Gestione File" per accedere alle impostazioni di gestione file.

3. Clicchi sul pulsante "Aggiungi nuovo" e selezioni "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Nella finestra a comparsa, vedrà un modulo dettagliato da compilare. Faccia riferimento alla documentazione seguente per ottenere i parametri pertinenti per il Suo servizio di file e li inserisca correttamente nel modulo.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configurazione del Fornitore di Servizi

### Amazon S3

#### Creazione del Bucket

1. Vada su [Console Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Clicchi sul pulsante "Create bucket" (Crea bucket) sul lato destro.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Compili il campo `Bucket Name` (Nome del Bucket), lasci gli altri campi come predefiniti, scorra fino in fondo alla pagina e clicchi sul pulsante **"Create"** (Crea) per completare il processo.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configurazione CORS

1. Nell'elenco dei bucket, trovi e clicchi sul bucket appena creato per accedere ai suoi dettagli.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Vada alla scheda "Permission" (Permessi) e scorra fino alla sezione di configurazione CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Inserisca la seguente configurazione (personalizzi secondo necessità) e salvi.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Recupero di AccessKey e SecretAccessKey

1. Clicchi sul pulsante "Security credentials" (Credenziali di sicurezza) nell'angolo in alto a destra.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scorra fino alla sezione "Access Keys" (Chiavi di accesso) e clicchi su "Create Access Key" (Crea Chiave di Accesso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Accetti i termini (l'uso di IAM è raccomandato per gli ambienti di produzione).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Salvi l'Access Key e la Secret Access Key visualizzate.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Recupero e Configurazione dei Parametri

1. Utilizzi l'`AccessKey ID` e la `Secret AccessKey` recuperati nell'operazione precedente. Li inserisca accuratamente.

2. Vada al pannello delle proprietà del bucket per trovare il `Nome del Bucket` e le informazioni sulla `Regione`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Accesso Pubblico (Opzionale)

Questa è una configurazione opzionale. La configuri quando ha bisogno di rendere i file caricati completamente pubblici.

1. Nel pannello "Permissions" (Permessi), scorra fino a "Object Ownership" (Proprietà Oggetto), clicchi su "Edit" (Modifica) e abiliti gli ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scorra fino a "Block public access" (Blocca accesso pubblico), clicchi su "Edit" (Modifica) e lo imposti per consentire il controllo ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Selezioni "Public access" (Accesso pubblico) in NocoBase.

#### Configurazione Miniatura (Opzionale)

Questa configurazione è opzionale e dovrebbe essere utilizzata quando ha bisogno di ottimizzare le dimensioni o l'effetto dell'anteprima dell'immagine. **Si prega di notare che questa distribuzione potrebbe comportare costi aggiuntivi. Per maggiori dettagli, faccia riferimento ai termini e ai prezzi di AWS.**

1. Vada su [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Clicchi sul pulsante `Launch in the AWS Console` (Avvia nella Console AWS) in fondo alla pagina per avviare la distribuzione.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Segua le istruzioni per completare la configurazione. Le seguenti opzioni richiedono particolare attenzione:
   1. Durante la creazione dello stack, dovrà specificare il nome del bucket Amazon S3 che contiene le immagini sorgente. Inserisca il nome del bucket che ha creato in precedenza.
   2. Se ha scelto di distribuire l'interfaccia utente demo, dopo la distribuzione, potrà utilizzare l'interfaccia per testare la funzionalità di elaborazione delle immagini. Nella console AWS CloudFormation, selezioni il Suo stack, vada alla scheda "Outputs" (Output), trovi il valore corrispondente alla chiave `DemoUrl` e clicchi sul link per aprire l'interfaccia demo.
   3. Questa soluzione utilizza la libreria Node.js `sharp` per un'elaborazione efficiente delle immagini. Può scaricare il codice sorgente dal repository GitHub e personalizzarlo secondo necessità.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Una volta completata la configurazione, attenda che lo stato di distribuzione cambi in `CREATE_COMPLETE`.

5. Nella configurazione NocoBase, prenda nota di quanto segue:
   1. `Thumbnail rule` (Regola miniatura): Compili i parametri relativi all'elaborazione delle immagini, ad esempio `?width=100`. Per i dettagli, faccia riferimento alla [documentazione AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint` (Endpoint di accesso): Inserisca il valore da Outputs -> ApiEndpoint dopo la distribuzione.
   3. `Full access URL style` (Stile URL di accesso completo): Selezioni **Ignora** (poiché il nome del bucket è già stato compilato nella configurazione, non è necessario per l'accesso).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Creazione del Bucket

1. Apra la [Console OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Selezioni "Buckets" dal menu a sinistra e clicchi su "Create Bucket" (Crea Bucket).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Compili i dettagli del bucket e clicchi su "Create" (Crea).
   - `Bucket Name` (Nome del Bucket): Scelga in base alle Sue esigenze aziendali.
   - `Region` (Regione): Selezioni la regione più vicina per i Suoi utenti.
   - Altre impostazioni possono rimanere predefinite o essere personalizzate secondo necessità.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configurazione CORS

1. Vada alla pagina dei dettagli del bucket che ha appena creato.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Clicchi su "Content Security -> CORS" (Sicurezza Contenuti -> CORS) nel menu centrale.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Clicchi su "Create Rule" (Crea Regola), compili i campi, scorra verso il basso e clicchi su "OK". Può fare riferimento allo screenshot qui sotto o configurare impostazioni più dettagliate.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Recupero di AccessKey e SecretAccessKey

1. Clicchi su "AccessKey" sotto l'avatar del Suo account nell'angolo in alto a destra.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. A scopo dimostrativo, creeremo un'AccessKey utilizzando l'account principale. In un ambiente di produzione, si raccomanda di utilizzare RAM per creare l'AccessKey. Per istruzioni, faccia riferimento alla [documentazione di Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3. Clicchi sul pulsante "Create AccessKey" (Crea AccessKey).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Completi la verifica dell'account.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Salvi l'Access Key e la Secret Access Key visualizzate.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Recupero e Configurazione dei Parametri

1. Utilizzi l'`AccessKey ID` e la `Secret AccessKey` ottenuti nel passaggio precedente.

2. Vada alla pagina dei dettagli del bucket per ottenere il nome del `Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scorra verso il basso per ottenere la `Regione` (il suffisso ".aliyuncs.com" non è necessario).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Ottenga l'indirizzo endpoint e aggiunga il prefisso `https://` quando lo inserisce in NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configurazione Miniatura (Opzionale)

Questa configurazione è opzionale e dovrebbe essere utilizzata solo quando si desidera ottimizzare le dimensioni o l'effetto dell'anteprima dell'immagine.

1. Compili i parametri pertinenti per la `Regola miniatura`. Per le impostazioni specifiche dei parametri, faccia riferimento alla documentazione di Alibaba Cloud su [Elaborazione Immagini](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. Mantenga le impostazioni di `Stile URL di caricamento completo` e `Stile URL di accesso completo` uguali.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Creazione del Bucket

1. Clicchi sul menu **Bucket** a sinistra -> Clicchi su **Crea Bucket** per aprire la pagina di creazione.
2. Inserisca il nome del Bucket, quindi clicchi sul pulsante **Salva**.

#### Recupero di AccessKey e SecretAccessKey

1. Vada su **Chiavi di Accesso** -> Clicchi sul pulsante **Crea chiave di accesso** per aprire la pagina di creazione.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Clicchi sul pulsante **Salva**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Salvi l'**Access Key** e la **Secret Key** dalla finestra pop-up per la configurazione futura.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configurazione dei Parametri

1. Vada alla pagina **Gestione File** in NocoBase.

2. Clicchi sul pulsante **Aggiungi nuovo** e selezioni **S3 Pro**.

3. Compili il modulo:
   - **ID AccessKey** e **Secret AccessKey**: Utilizzi i valori salvati dal passaggio precedente.
   - **Regione**: MinIO distribuito privatamente non ha il concetto di regione; può impostarlo su `"auto"`.
   - **Endpoint**: Inserisca il nome di dominio o l'indirizzo IP del Suo servizio distribuito.
   - Imposti lo **Stile URL di accesso completo** su **Path-Style**.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Faccia riferimento alle configurazioni per i servizi di file sopra menzionati. La logica è simile.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Faccia riferimento alle configurazioni per i servizi di file sopra menzionati. La logica è simile.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414154500264.png)

## Guida per l'Utente

Faccia riferimento alla [documentazione del plugin di gestione file](/data-sources/file-manager).