:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

## Motori Integrati

Attualmente, NocoBase supporta i seguenti tipi di motori integrati:

- [Archiviazione Locale](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Un motore di archiviazione locale viene aggiunto automaticamente durante l'installazione del sistema ed è subito pronto all'uso. Può anche aggiungere nuovi motori o modificare i parametri di quelli esistenti.

## Parametri Comuni del Motore

Oltre ai parametri specifici per le diverse tipologie di motore, di seguito sono elencati i parametri comuni (prendendo come esempio l'archiviazione locale):

![Esempio di configurazione del motore di archiviazione file](https://static-docs.nocobase.com/20240529115151.png)

### Titolo

Il nome del motore di archiviazione, utilizzato per l'identificazione.

### Nome di Sistema

Il nome di sistema del motore di archiviazione, utilizzato per l'identificazione da parte del sistema. Deve essere univoco all'interno del sistema. Se lasciato vuoto, verrà generato casualmente dal sistema.

### URL Base di Accesso

Il prefisso dell'indirizzo URL per l'accesso esterno al file. Può essere l'URL base di una CDN, ad esempio: "`https://cdn.nocobase.com/app`" (senza la barra finale "`/`").

### Percorso

Il percorso relativo utilizzato per archiviare i file. Questa parte verrà automaticamente concatenata all'URL finale al momento dell'accesso. Ad esempio: "`user/avatar`" (senza la barra iniziale o finale "`/`").

### Limite Dimensione File

Il limite di dimensione per i file caricati su questo motore di archiviazione. I file che superano questa dimensione non potranno essere caricati. Il limite predefinito del sistema è 20MB, e il limite massimo regolabile è 1GB.

### Tipo di File

Consente di limitare i tipi di file che possono essere caricati, utilizzando il formato di descrizione della sintassi [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ad esempio, `image/*` rappresenta i file immagine. Più tipi possono essere separati da virgole, come: `image/*, application/pdf` per consentire sia file immagine che PDF.

### Motore di Archiviazione Predefinito

Se selezionato, questo motore viene impostato come motore di archiviazione predefinito del sistema. Quando un campo allegato o una **collezione** di file non specifica un motore di archiviazione, i file caricati verranno salvati nel motore di archiviazione predefinito. Il motore di archiviazione predefinito non può essere eliminato.

### Mantieni i File Quando si Eliminano i Record

Se selezionato, i file caricati nel motore di archiviazione vengono mantenuti anche quando i record di dati nella tabella degli allegati o nella **collezione** di file vengono eliminati. Per impostazione predefinita, questa opzione non è selezionata, il che significa che i file nel motore di archiviazione vengono eliminati insieme ai record.

:::info{title=Suggerimento}
Dopo il caricamento di un file, il percorso di accesso finale viene costruito concatenando diverse parti:

```
<URL Base di Accesso>/<Percorso>/<NomeFile><Estensione>
```

Ad esempio: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::