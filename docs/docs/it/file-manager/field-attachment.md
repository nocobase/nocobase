:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Campo Allegato

## Introduzione

Il sistema include un campo di tipo "Allegato" per permettere agli utenti di caricare file nelle collezioni personalizzate.

Il campo Allegato è, a livello fondamentale, un campo di associazione Molti-a-Molti che punta alla collezione "Allegati" (`attachments`) integrata nel sistema. Quando si crea un campo Allegato in una qualsiasi collezione, viene generata automaticamente una tabella di giunzione per la relazione molti-a-molti. I metadati dei file caricati vengono memorizzati nella collezione "Allegati" e le informazioni sui file a cui si fa riferimento nella collezione vengono associate tramite questa tabella di giunzione.

## Configurazione del Campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrizioni del Tipo MIME

Serve a limitare i tipi di file che è possibile caricare, utilizzando il formato della sintassi [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ad esempio: `image/*` rappresenta i file immagine. È possibile separare più tipi con una virgola, ad esempio: `image/*,application/pdf` consente sia i file immagine che i file PDF.

### Motore di Archiviazione

Selezioni il motore di archiviazione da utilizzare per i file caricati. Se lasciato vuoto, verrà utilizzato il motore di archiviazione predefinito del sistema.