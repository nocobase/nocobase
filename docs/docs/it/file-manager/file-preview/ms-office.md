---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/file-manager/file-preview/ms-office).
:::

# Anteprima file Office <Badge>v1.8.11+</Badge>

Il plugin Anteprima file Office consente di visualizzare in anteprima i file in formato Office nelle applicazioni NocoBase, come Word, Excel e PowerPoint.  
Si basa su un servizio online pubblico fornito da Microsoft, che permette di incorporare in un'interfaccia di anteprima i file accessibili tramite un URL pubblico, consentendo agli utenti di visualizzare questi file nel browser senza doverli scaricare o utilizzare le applicazioni Office.

## Manuale utente

Per impostazione predefinita, il plugin è in uno stato **disabilitato**. Può essere utilizzato dopo essere stato abilitato nel gestore dei plugin, senza necessità di ulteriori configurazioni.

![Interfaccia di attivazione del plugin](https://static-docs.nocobase.com/20250731140048.png)

Dopo aver caricato correttamente un file Office (Word / Excel / PowerPoint) in un campo file di una collezione, faccia clic sull'icona del file corrispondente o sul collegamento per visualizzarne il contenuto nell'interfaccia di anteprima a comparsa o incorporata.

![Esempio di operazione di anteprima](https://static-docs.nocobase.com/20250731143231.png)

## Principio di funzionamento

L'anteprima incorporata da questo plugin si affida al servizio online pubblico di Microsoft (Office Web Viewer). Il processo principale è il seguente:

- Il frontend genera un URL accessibile pubblicamente per il file caricato dall'utente (inclusi gli URL firmati S3);
- Il plugin carica l'anteprima del file in un iframe utilizzando il seguente indirizzo:

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<URL pubblico del file>
  ```

- Il servizio Microsoft richiede il contenuto del file da questo URL, lo renderizza e restituisce una pagina visualizzabile.

## Note

- Poiché questo plugin dipende dal servizio online di Microsoft, si assicuri che la connessione di rete sia normale e che sia possibile accedere ai relativi servizi Microsoft.
- Microsoft accederà all'URL del file fornito e il contenuto del file verrà temporaneamente memorizzato nella cache del suo server per il rendering della pagina di anteprima. Pertanto, esiste un certo rischio per la privacy. Se ha dubbi al riguardo, si consiglia di non utilizzare la funzione di anteprima fornita da questo plugin[^1].
- Il file da visualizzare in anteprima deve essere un URL accessibile pubblicamente. In circostanze normali, i file caricati su NocoBase genereranno automaticamente collegamenti pubblici accessibili (inclusi gli URL firmati generati dal plugin S3-Pro), ma se il file ha permessi di accesso impostati o è memorizzato in un ambiente di rete interna, non potrà essere visualizzato in anteprima[^2].
- Il servizio non supporta l'autenticazione tramite login o risorse in archivi privati. Ad esempio, i file accessibili solo all'interno di una rete interna o che richiedono il login non possono utilizzare questa funzione di anteprima.
- Dopo che il contenuto del file è stato acquisito dal servizio Microsoft, potrebbe essere memorizzato nella cache per un breve periodo. Anche se il file sorgente viene eliminato, il contenuto dell'anteprima potrebbe rimanere accessibile per un certo lasso di tempo.
- Esistono limiti consigliati per le dimensioni dei file: si raccomanda che i file Word e PowerPoint non superino i 10 MB e i file Excel non superino i 5 MB per garantire la stabilità dell'anteprima[^3].
- Attualmente non esiste una descrizione ufficiale chiara della licenza per l'uso commerciale di questo servizio. Valuti autonomamente i rischi durante l'uso[^4].

## Formati di file supportati

Il plugin supporta solo l'anteprima dei seguenti formati di file Office, in base al tipo MIME o all'estensione del file:

- Documenti Word:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) o `application/msword` (`.doc`)
- Fogli di calcolo Excel:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) o `application/vnd.ms-excel` (`.xls`)
- Presentazioni PowerPoint:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) o `application/vnd.ms-powerpoint` (`.ppt`)
- Testo OpenDocument: `application/vnd.oasis.opendocument.text` (`.odt`)

Per i file in altri formati non verrà abilitata la funzione di anteprima di questo plugin.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)