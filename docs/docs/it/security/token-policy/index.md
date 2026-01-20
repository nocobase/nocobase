---
pkg: '@nocobase/plugin-auth'
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Politica di Sicurezza dei Token

## Introduzione

La Politica di Sicurezza dei Token è una configurazione funzionale pensata per proteggere la sicurezza del sistema e migliorare l'esperienza utente. Include tre voci di configurazione principali: "Durata della Sessione", "Durata del Token" e "Limite di Tempo per il Refresh del Token Scaduto".

## Punto di Configurazione

Può trovare la configurazione in Impostazioni plugin - Sicurezza - Politica Token:

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Durata della Sessione

**Definizione:**

La Durata della Sessione si riferisce al tempo massimo in cui il sistema consente a un utente di mantenere una sessione attiva dopo aver effettuato l'accesso.

**Funzione:**

Una volta superata la Durata della Sessione, l'utente riceverà una risposta di errore 401 al successivo accesso al sistema e verrà quindi reindirizzato alla pagina di login per una nuova autenticazione.
Esempio:
Se la Durata della Sessione è impostata su 8 ore, la sessione scadrà 8 ore dopo l'accesso dell'utente, supponendo che non ci siano state interazioni aggiuntive.

**Impostazioni consigliate:**

- Scenari di operazioni a breve termine: Si consigliano 1-2 ore per migliorare la sicurezza.
- Scenari di lavoro a lungo termine: Può essere impostata a 8 ore per soddisfare le esigenze aziendali.

## Durata del Token

**Definizione:**

La Durata del Token si riferisce al ciclo di vita di ogni Token emesso dal sistema durante la sessione attiva dell'utente.

**Funzione:**

Quando un Token scade, il sistema emetterà automaticamente un nuovo Token per mantenere attiva la sessione.
Ogni Token scaduto può essere rinnovato (refreshed) una sola volta.

**Impostazioni consigliate:**

Per motivi di sicurezza, si consiglia di impostarla tra i 15 e i 30 minuti.
Le regolazioni possono essere effettuate in base alle esigenze dello scenario. Ad esempio:
- Scenari ad alta sicurezza: La Durata del Token può essere ridotta a 10 minuti o meno.
- Scenari a basso rischio: La Durata del Token può essere opportunamente estesa a 1 ora.

## Limite di Tempo per il Refresh del Token Scaduto

**Definizione:**

Il Limite di Tempo per il Refresh del Token Scaduto si riferisce alla finestra di tempo massima consentita all'utente per ottenere un nuovo Token tramite un'operazione di refresh dopo che il Token è scaduto.

**Caratteristiche:**

Se il limite di tempo per il refresh viene superato, l'utente dovrà effettuare nuovamente l'accesso per ottenere un nuovo Token.
L'operazione di refresh non estende la Durata della Sessione, ma rigenera solo il Token.

**Impostazioni consigliate:**

Per motivi di sicurezza, si consiglia di impostarla tra i 5 e i 10 minuti.