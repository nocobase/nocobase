---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Gestione Notifiche

## Introduzione

Il Gestore Notifiche è un servizio centralizzato che integra più canali di notifica. Le offre un'interfaccia unificata per la configurazione dei canali, la gestione degli invii e la registrazione dei log, supportando un'espansione flessibile.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Sezione viola**: Il Gestore Notifiche offre un servizio completo che include la configurazione dei canali e la registrazione dei log, con la possibilità di espandere a canali di notifica aggiuntivi.
- **Sezione verde**: Messaggio In-App, un canale integrato che consente agli utenti di ricevere notifiche direttamente all'interno dell'applicazione.
- **Sezione rossa**: Email, un canale estendibile che consente agli utenti di ricevere notifiche via email.

## Gestione Canali

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

I canali attualmente supportati sono:

- [Messaggio In-App](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (utilizzando il trasporto SMTP integrato)

Può anche estendere il sistema a più canali di notifica; consulti la documentazione [Estensione Canali](/notification-manager/development/extension).

## Log delle Notifiche

Il sistema registra dettagliatamente le informazioni e lo stato di ogni notifica, facilitando l'analisi e la risoluzione dei problemi.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Nodo di Notifica del Flusso di Lavoro

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)