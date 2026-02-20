---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: "@nocobase/plugin-ai-ee"
---

# Conversazione Multimodale

## Immagini

Se il modello lo supporta, il nodo LLM può inviare immagini al modello. Quando lo utilizza, deve selezionare un campo allegato o un record di una collezione di file associata tramite una variabile. Quando seleziona un record di una collezione di file, può selezionarlo a livello di oggetto o selezionare il campo URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Ci sono due opzioni per il formato di invio delle immagini:

- Invio tramite URL - Tutte le immagini, ad eccezione di quelle archiviate localmente, verranno inviate come URL. Le immagini archiviate localmente verranno convertite in formato base64 prima dell'invio.
- Invio tramite base64 - Tutte le immagini, siano esse archiviate localmente o nel cloud, verranno inviate in formato base64. Questo è adatto per i casi in cui l'URL dell'immagine non può essere direttamente accessibile dal servizio LLM online.

![](https://static-docs.nocobase.com/202503041200638.png)