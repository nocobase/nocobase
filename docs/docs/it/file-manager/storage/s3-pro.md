---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Motore di Archiviazione: S3 (Pro)

## Introduzione

Partendo dal plugin di gestione file, questo estende il supporto a tipologie di archiviazione file compatibili con il protocollo S3. È possibile integrare facilmente qualsiasi servizio di object storage che supporti il protocollo S3, come Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2 e altri, migliorando ulteriormente la compatibilità e la flessibilità dei servizi di archiviazione.

## Caratteristiche

1. **Caricamento lato client**: Il caricamento dei file non richiede il passaggio attraverso il server NocoBase, ma si collega direttamente al servizio di archiviazione file, per un'esperienza di upload più efficiente e rapida.
    
2. **Accesso privato**: Quando si accede ai file, tutti gli URL sono indirizzi temporanei firmati e autorizzati, garantendo la sicurezza e la validità temporale dell'accesso ai file.

## Scenari di Utilizzo

1. **Gestione della collezione di file**: Gestione e archiviazione centralizzata di tutti i file caricati, con supporto per diverse tipologie di file e metodi di archiviazione, facilitando la classificazione e il recupero.
    
2. **Archiviazione di campi allegati**: Utilizzato per l'archiviazione dei dati degli allegati caricati in moduli o record, con supporto per l'associazione a specifici record di dati.
  

## Configurazione del plugin

1. Abiliti il plugin `plugin-file-storage-s3-pro`.
    
2. Clicchi su "Setting -> FileManager" per accedere alle impostazioni di gestione file.

3. Clicchi sul pulsante "Add new" e selezioni "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Dopo l'apertura del pop-up, vedrà un modulo con numerosi campi da compilare. Può fare riferimento alla documentazione successiva per ottenere le informazioni sui parametri pertinenti per il servizio file corrispondente e compilarli correttamente nel modulo.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configurazione del Fornitore di Servizi

### Amazon S3

#### Creazione del Bucket

1. Apra [https://ap-southeast-1.console.aws.amazon.com/s3/home](https://ap-southeast-1.console.aws.amazon.com/s3/home) per accedere alla console S3.
    
2. Clicchi sul pulsante "Create bucket" sulla destra.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Compili il Bucket Name (nome del bucket). Gli altri campi possono essere lasciati con le impostazioni predefinite. Scorri verso il basso fino alla fine della pagina e clicchi sul pulsante "**Create**" per completare la creazione.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configurazione CORS

1. Vada all'elenco dei bucket, trovi e clicchi sul bucket appena creato per accedere alla sua pagina dei dettagli.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Clicchi sulla scheda "Permission", quindi scorra verso il basso per trovare la sezione di configurazione CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Inserisca la seguente configurazione (può personalizzarla ulteriormente) e salvi.
    
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

1. Clicchi sul pulsante "Security credentials" nell'angolo in alto a destra della pagina.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Scorri verso il basso, trovi la sezione "Access Keys" e clicchi sul pulsante "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Clicchi su "Accetta" (questa è una dimostrazione con l'account root; si consiglia di utilizzare IAM in un ambiente di produzione).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Salvi l'Access key e il Secret access key visualizzati nella pagina.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Recupero e Configurazione dei Parametri

1. L'AccessKey ID e l'AccessKey Secret sono i valori ottenuti nel passaggio precedente. Li compili accuratamente.
    
2. Vada al pannello delle proprietà della pagina dei dettagli del bucket, dove potrà ottenere il nome del Bucket e le informazioni sulla Region (regione).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Accesso Pubblico (Opzionale)

Questa è una configurazione opzionale. La configuri quando ha bisogno di rendere i file caricati completamente pubblici.

1. Vada al pannello Permissions, scorra verso il basso fino a Object Ownership, clicchi su modifica e abiliti gli ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Scorri fino a Block public access, clicchi su modifica e imposti per consentire il controllo degli ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. In NocoBase, selezioni "Public access".

#### Configurazione delle Miniature (Opzionale)

Questa configurazione è opzionale e viene utilizzata per ottimizzare le dimensioni o gli effetti dell'anteprima delle immagini. **Si prega di notare che questa soluzione di deployment potrebbe comportare costi aggiuntivi. Per le tariffe specifiche, si prega di fare riferimento ai termini e alle condizioni pertinenti di AWS.**

1. Visiti [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Clicchi sul pulsante `Launch in the AWS Console` in fondo alla pagina per avviare il deployment della soluzione.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Segua le istruzioni per completare la configurazione. Presti particolare attenzione alle seguenti opzioni:
   1. Quando crea lo stack, deve specificare il nome di un bucket Amazon S3 che contiene le immagini sorgente. Inserisca il nome del bucket che ha creato in precedenza.
   2. Se sceglie di effettuare il deployment dell'interfaccia utente demo, potrà testare le funzionalità di elaborazione delle immagini tramite questa interfaccia dopo il deployment. Nella console AWS CloudFormation, selezioni il suo stack, vada alla scheda "Outputs", trovi il valore corrispondente alla chiave DemoUrl e clicchi sul link per aprire l'interfaccia demo.
   3. Questa soluzione utilizza la libreria Node.js `sharp` per elaborare le immagini in modo efficiente. Può scaricare il codice sorgente dal repository GitHub e personalizzarlo secondo le sue esigenze.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Una volta completata la configurazione, attenda che lo stato del deployment diventi `CREATE_COMPLETE`.

5. Nella configurazione di NocoBase, ci sono diversi punti da notare:
   1. `Thumbnail rule`: Compili i parametri relativi all'elaborazione delle immagini, ad esempio `?width=100`. Per i dettagli, faccia riferimento alla [documentazione AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint`: Compili il valore di Outputs -> ApiEndpoint dopo il deployment.
   3. `Full access URL style`: Deve selezionare **Ignore** (poiché il nome del bucket è già stato compilato durante la configurazione, non è più necessario per l'accesso).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Creazione del Bucket

1. Apra la console OSS [https://oss.console.aliyun.com/overview](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Clicchi su "Buckets" nel menu a sinistra, quindi clicchi sul pulsante "Create Bucket" per iniziare la creazione di un bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Compili le informazioni relative al bucket e infine clicchi sul pulsante Create.
    
    1. Il Bucket Name dovrebbe adattarsi alle sue esigenze aziendali; il nome può essere arbitrario.
        
    2. Scelga la Region più vicina ai suoi utenti.
        
    3. Altre impostazioni possono essere lasciate predefinite o configurate in base alle sue esigenze.    

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configurazione CORS

1. Vada alla pagina dei dettagli del bucket creato nel passaggio precedente.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Clicchi su "Content Security -> CORS" nel menu centrale.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Clicchi sul pulsante "Create Rule", compili il contenuto pertinente, scorra verso il basso e clicchi su "OK". Può fare riferimento allo screenshot qui sotto o configurare impostazioni più dettagliate.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Recupero di AccessKey e SecretAccessKey

1. Clicchi su "AccessKey" sotto l'immagine del suo profilo nell'angolo in alto a destra.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Qui, per comodità di dimostrazione, stiamo creando un AccessKey utilizzando l'account principale. In un ambiente di produzione, si consiglia di utilizzare RAM per la creazione. Può fare riferimento a [https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp](https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp).
    
3. Clicchi sul pulsante "Create AccessKey". 

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Esegua la verifica dell'account.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Salvi l'Access key e il Secret access key visualizzati nella pagina.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Recupero e Configurazione dei Parametri

1. L'AccessKey ID e l'AccessKey Secret sono i valori ottenuti nel passaggio precedente.
    
2. Vada alla pagina dei dettagli del bucket per ottenere il nome del Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Scorri verso il basso per ottenere la Region (il suffisso ".aliyuncs.com" non è necessario).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Ottenga l'indirizzo dell'endpoint e aggiunga il prefisso `https://` quando lo inserisce in NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configurazione delle Miniature (Opzionale)

Questa configurazione è opzionale e deve essere utilizzata solo quando è necessario ottimizzare le dimensioni o gli effetti dell'anteprima delle immagini.

1. Compili i parametri relativi a `Thumbnail rule`. Per le impostazioni specifiche dei parametri, faccia riferimento a [Parametri di elaborazione delle immagini](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2. `Full upload URL style` e `Full access URL style` possono essere mantenuti uguali.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Creazione del Bucket

1. Clicchi sul menu Buckets a sinistra -> clicchi su Create Bucket per accedere alla pagina di creazione.
2. Dopo aver compilato il nome del Bucket, clicchi sul pulsante Salva.
#### Recupero di AccessKey e SecretAccessKey

1. Vada su Access Keys -> clicchi sul pulsante Create access key per accedere alla pagina di creazione.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Clicchi sul pulsante Salva.

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Salvi l'Access Key e il Secret Key dalla finestra pop-up per la configurazione successiva.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configurazione dei Parametri

1. Vada alla pagina NocoBase -> File manager.

2. Clicchi sul pulsante Add new e selezioni S3 Pro.

3. Compili il modulo:
   - **AccessKey ID** e **AccessKey Secret** sono i valori salvati nel passaggio precedente.
   - **Region**: Un'installazione MinIO self-hosted non ha il concetto di Region, quindi può essere configurata come "auto".
   - **Endpoint**: Compili il nome di dominio o l'indirizzo IP del suo deployment.
   - È necessario impostare `Full access URL style` su Path-Style.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Può fare riferimento alla configurazione dei servizi file menzionati sopra, poiché la logica è simile.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Può fare riferimento alla configurazione dei servizi file menzionati sopra, poiché la logica è simile.

#### Esempio di Configurazione

![](https://static-docs.nocobase.com/20250414154500264.png)