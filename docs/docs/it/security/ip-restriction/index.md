---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# Restrizioni IP

## Introduzione

NocoBase consente agli amministratori di configurare liste bianche o nere per gli IP di accesso degli utenti, al fine di limitare le connessioni di rete esterne non autorizzate o bloccare indirizzi IP malevoli noti, riducendo così i rischi per la sicurezza. Supporta inoltre gli amministratori nella consultazione dei log di accesso negato per identificare gli IP a rischio.

## Regole di Configurazione

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Modalità di Filtro IP

- **Lista Nera**: Quando l'IP di accesso di un utente corrisponde a un IP presente nell'elenco, il sistema **negherà** l'accesso; gli IP non corrispondenti sono **consentiti** per impostazione predefinita.
- **Lista Bianca**: Quando l'IP di accesso di un utente corrisponde a un IP presente nell'elenco, il sistema **consentirà** l'accesso; gli IP non corrispondenti sono **negati** per impostazione predefinita.

### Elenco IP

Utilizzato per definire gli indirizzi IP a cui è consentito o negato l'accesso al sistema. La sua funzione specifica dipende dalla modalità di filtro IP selezionata. Supporta l'inserimento di indirizzi IP o segmenti di rete CIDR; più indirizzi possono essere separati da virgole o interruzioni di riga.

## Consultazione dei Log

Dopo che a un utente viene negato l'accesso, l'IP di accesso viene registrato nei log di sistema e il file di log corrispondente può essere scaricato per l'analisi.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Esempio di Log:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Consigli di Configurazione

### Consigli per la Modalità Lista Nera

- Aggiunga indirizzi IP malevoli noti per prevenire potenziali attacchi di rete.
- Verifichi e aggiorni regolarmente la lista nera, rimuovendo gli indirizzi IP non validi o che non necessitano più di essere bloccati.

### Consigli per la Modalità Lista Bianca

- Aggiunga indirizzi IP di rete interna affidabili (come i segmenti di rete dell'ufficio) per garantire un accesso sicuro ai sistemi principali.
- Eviti di includere indirizzi IP assegnati dinamicamente nella lista bianca per evitare interruzioni dell'accesso.

### Consigli Generali

- Utilizzi i segmenti di rete CIDR per semplificare la configurazione, ad esempio usando 192.168.0.0/24 invece di aggiungere singoli indirizzi IP.
- Esegua regolarmente il backup delle configurazioni dell'elenco IP per un rapido ripristino in caso di errori operativi o guasti del sistema.
- Monitori regolarmente i log di accesso per identificare IP anomali e adegui tempestivamente le liste bianche o nere.