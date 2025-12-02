---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Invio email

## Introduzione

Utilizzato per inviare email. Supporta contenuti in formato testo e HTML.

## Creazione del nodo

Nell'interfaccia di configurazione del flusso di lavoro, clicchi sul pulsante più ("+") nel flusso per aggiungere un nodo "Invio email":

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Configurazione del nodo

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Ogni opzione può utilizzare variabili dal contesto del flusso di lavoro. Per le informazioni sensibili, è possibile utilizzare anche variabili globali e segreti.

## Domande frequenti

### Limite di frequenza per l'invio di email con Gmail

Durante l'invio di alcune email, potrebbe verificarsi il seguente errore:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Questo accade perché Gmail applica un limite di frequenza alle richieste di invio provenienti da domini non specificati. Quando si distribuisce l'applicazione, è necessario configurare l'hostname del server con il dominio che ha configurato in Gmail. Ad esempio, in una distribuzione Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Impostare sul dominio di invio configurato
```

Riferimento: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)