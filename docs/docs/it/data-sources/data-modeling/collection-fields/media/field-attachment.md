:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Campo Allegato

## Introduzione

Il sistema include un campo di tipo "Allegato" per supportare il caricamento di file nelle collezioni personalizzate.

Sotto il cofano, il campo allegato è un campo di relazione molti-a-molti che punta alla collezione "Allegati" (`attachments`) integrata nel sistema. Quando si crea un campo allegato in una qualsiasi collezione, viene generata automaticamente una tabella di giunzione molti-a-molti. I metadati dei file caricati vengono memorizzati nella collezione "Allegati", e le informazioni sui file a cui si fa riferimento nella propria collezione sono collegate tramite questa tabella di giunzione.

## Configurazione del Campo

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Restrizione Tipi MIME

Utilizzato per limitare i tipi di file consentiti per il caricamento, utilizzando la sintassi [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Ad esempio, `image/*` rappresenta i file immagine. È possibile separare più tipi con una virgola, come `image/*,application/pdf`, che consente sia file immagine che file PDF.

### Motore di Archiviazione

Selezionare il motore di archiviazione per i file caricati. Se lasciato vuoto, verrà utilizzato il motore di archiviazione predefinito del sistema.