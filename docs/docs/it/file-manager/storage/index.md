:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Panoramica

## Introduzione

I motori di archiviazione (o "storage engine") servono a salvare i file su servizi specifici, come l'archiviazione locale (salvataggio sul disco rigido del server), l'archiviazione cloud e altro ancora.

Prima di caricare qualsiasi file, è necessario configurare un motore di archiviazione. Il sistema aggiunge automaticamente un motore di archiviazione locale durante l'installazione, che può essere utilizzato direttamente. Può anche aggiungere nuovi motori o modificare i parametri di quelli esistenti.

## Tipi di motori di archiviazione

Attualmente, NocoBase supporta i seguenti tipi di motori di archiviazione integrati:

- [Archiviazione locale](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

Il sistema aggiunge automaticamente un motore di archiviazione locale durante l'installazione, che può essere utilizzato direttamente. Può anche aggiungere nuovi motori o modificare i parametri di quelli esistenti.

## Parametri comuni

Oltre ai parametri specifici per i diversi tipi di motori, le seguenti sezioni descrivono i parametri comuni (prendendo l'archiviazione locale come esempio):

![Esempio di configurazione del motore di archiviazione file](https://static-docs.nocobase.com/20240529115151.png)

### Titolo

Il nome del motore di archiviazione, utilizzato per l'identificazione umana.

### Nome di sistema

Il nome di sistema del motore di archiviazione, utilizzato per l'identificazione da parte del sistema. Deve essere unico all'interno del sistema. Se lasciato vuoto, il sistema ne genererà automaticamente uno casuale.

### Prefisso URL pubblico

La parte del prefisso dell'URL accessibile pubblicamente per il file. Può essere l'URL di base di una CDN, ad esempio: "`https://cdn.nocobase.com/app`" (senza la barra finale "/").

### Percorso

Il percorso relativo utilizzato per l'archiviazione dei file. Questa parte verrà automaticamente aggiunta all'URL finale durante l'accesso. Ad esempio: "`user/avatar`" (senza barre iniziali o finali "/").

### Limite dimensione file

Il limite di dimensione per i file caricati su questo motore di archiviazione. I file che superano questa dimensione non potranno essere caricati. Il limite predefinito del sistema è 20 MB e può essere regolato fino a un massimo di 1 GB.

### Tipi di file

È possibile limitare i tipi di file che possono essere caricati, utilizzando il formato di descrizione della sintassi [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ad esempio: `image/*` rappresenta i file immagine. Più tipi possono essere separati da virgole, come: `image/*, application/pdf` che consente file immagine e PDF.

### Motore di archiviazione predefinito

Se selezionato, questo motore viene impostato come motore di archiviazione predefinito del sistema. Quando un campo allegato o una **collezione** di file non specifica un motore di archiviazione, i file caricati verranno salvati nel motore di archiviazione predefinito. Il motore di archiviazione predefinito non può essere eliminato.

### Mantieni il file quando il record viene eliminato

Se selezionato, il file caricato nel motore di archiviazione verrà mantenuto anche quando il record di dati nella tabella degli allegati o nella **collezione** di file viene eliminato. Per impostazione predefinita, questa opzione non è selezionata, il che significa che il file nel motore di archiviazione verrà eliminato insieme al record.

:::info{title=Suggerimento}
Dopo che un file è stato caricato, il percorso di accesso finale è composto dalla concatenazione di diverse parti:

```
<Prefisso URL pubblico>/<Percorso>/<Nome file><Estensione>
```

Ad esempio: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::