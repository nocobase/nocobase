---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Configurazione dei Blocchi

## Blocco Messaggi Email

### Aggiungere un Blocco

Nella pagina di configurazione, clicchi sul pulsante **Crea blocco** e selezioni il blocco **Messaggi email (Tutti)** o **Messaggi email (Personali)** per aggiungere un blocco di messaggi email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_03_58_PM.png)

### Configurazione dei Campi

Clicchi sul pulsante **Campi** del blocco per selezionare i campi da visualizzare. Per operazioni dettagliate, può fare riferimento al metodo di configurazione dei campi per le tabelle.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_37_PM.png)

### Configurazione del Filtro Dati

Clicchi sull'icona di configurazione sul lato destro della tabella e selezioni **Ambito dati** per impostare l'intervallo di dati per filtrare le email.

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_39_PM.png)

Può filtrare le email con lo stesso suffisso tramite variabili:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_41_PM.png)

## Blocco Dettagli Email

Innanzitutto, abiliti la funzione **Abilita clic per aprire** su un campo nel blocco messaggi email:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_45_PM.png)

Aggiunga il blocco **Dettagli email** nella finestra pop-up:

![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_46_PM.png)

Può visualizzare il contenuto dettagliato dell'email:

![](https://static-docs.nocobase.com/email-manager/Loading--10-31-2025_04_49_PM.png)

In fondo, può configurare i pulsanti necessari.

## Blocco Invio Email

Esistono due modi per creare un modulo di invio email:

1.  Aggiunga un pulsante **Invia email** nella parte superiore della tabella:
    ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_52_PM.png)

2.  Aggiunga un blocco **Invia email**:
    ![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM.png)

Entrambi i metodi consentono di creare un modulo completo per l'invio di email:
![](https://static-docs.nocobase.com/email-manager/Email-10-31-2025_04_53_PM%20(1).png)

Ogni campo del modulo email è coerente con un modulo normale e può essere configurato con un **Valore predefinito** o **Regole di collegamento**, ecc.

> I moduli di risposta e inoltro email, presenti in fondo ai dettagli dell'email, includono di default alcune elaborazioni dati, che possono essere modificate tramite il **FlowEngine**.