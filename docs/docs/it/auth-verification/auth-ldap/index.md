---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Autenticazione: LDAP



## Introduzione

Il plugin Autenticazione: LDAP segue lo standard del protocollo LDAP (Lightweight Directory Access Protocol), consentendo agli utenti di accedere a NocoBase utilizzando le credenziali del loro server LDAP.

## Attivare il plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Aggiungere l'autenticazione LDAP

Acceda alla pagina di gestione dei plugin di autenticazione utente.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Aggiungi - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configurazione

### Configurazione di base

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Iscrizione automatica se l'utente non esiste - Indica se creare automaticamente un nuovo utente quando non viene trovato un utente esistente corrispondente.
- URL LDAP - Indirizzo del server LDAP
- Bind DN - DN utilizzato per testare la connessione al server e cercare gli utenti.
- Password di Bind - Password del Bind DN
- Testa connessione - Clicchi sul pulsante per testare la connessione al server e verificare la validità del Bind DN.

### Configurazione di ricerca

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - DN utilizzato per la ricerca degli utenti
- Filtro di ricerca - Condizione di filtro per la ricerca degli utenti, dove `{{account}}` rappresenta l'account utente utilizzato per l'accesso.
- Scope - `Base`, `One level`, `Subtree`, predefinito `Subtree`
- Limite dimensione - Dimensione della pagina di ricerca

### Mappatura attributi

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Utilizza questo campo per collegare l'utente - Campo utilizzato per collegare gli utenti esistenti. Se l'account di accesso è un nome utente, selezioni "Nome utente"; se è un indirizzo email, selezioni "Email". Il valore predefinito è "Nome utente".
- Mappatura attributi - Mappatura degli attributi utente sui campi della tabella utente di NocoBase.

## Accesso

Acceda alla pagina di accesso e inserisca il nome utente e la password LDAP nel modulo di accesso.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>