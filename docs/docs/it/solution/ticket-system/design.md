:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/solution/ticket-system/design).
:::

# Progettazione dettagliata della soluzione di gestione ticket

> **Versione**: v2.0-beta

> **Data di aggiornamento**: 05-01-2026

> **Stato**: Anteprima

## 1. Panoramica del sistema e filosofia di progettazione

### 1.1 Posizionamento del sistema

Questo sistema è una **piattaforma intelligente per la gestione dei ticket guidata dall'IA**, costruita sulla piattaforma low-code NocoBase. L'obiettivo principale è:

```
Permettere al servizio clienti di concentrarsi sulla risoluzione dei problemi, piuttosto che su tediose operazioni procedurali
```

### 1.2 Filosofia di progettazione

#### Filosofia 1: Architettura dati a T

**Cos'è l'architettura a T?**

Si ispira al concetto di "talento a forma di T": ampiezza orizzontale + profondità verticale:

- **Orizzontale (Tabella principale)**: Copre le funzionalità comuni a tutti i tipi di business: numero ticket, stato, assegnatario, SLA e altri campi fondamentali.
- **Verticale (Tabelle di estensione)**: Campi specializzati per specifici settori di attività: la riparazione di apparecchiature ha numeri di serie, i reclami hanno piani di compensazione.

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**Perché questa progettazione?**

| Soluzione tradizionale | Architettura a T |
|------------------------|------------------|
| Una tabella per ogni tipo di attività, campi duplicati | Campi comuni gestiti centralmente, campi di business estesi su richiesta |
| I report statistici richiedono l'unione di più tabelle | Un'unica tabella principale per le statistiche di tutti i ticket |
| Le modifiche ai processi richiedono interventi in più punti | Il processo principale viene modificato in un unico punto |
| I nuovi tipi di attività richiedono nuove tabelle | È sufficiente aggiungere tabelle di estensione, il flusso principale resta invariato |

#### Filosofia 2: Team di dipendenti IA

Non semplici "funzionalità IA", ma veri e propri "dipendenti IA". Ogni IA ha un ruolo, una personalità e responsabilità chiare:

| Dipendente IA | Ruolo | Responsabilità principali | Scenario di attivazione |
|---------------|-------|---------------------------|-------------------------|
| **Sam** | Supervisore del Service Desk | Smistamento ticket, valutazione priorità, decisioni di escalation | Automatico alla creazione del ticket |
| **Grace** | Esperta di Customer Success | Generazione risposte, regolazione del tono, gestione reclami | Al clic dell'operatore su "Risposta IA" |
| **Max** | Assistente alla conoscenza | Casi simili, raccomandazioni di conoscenza, sintesi delle soluzioni | Automatico nella pagina dei dettagli del ticket |
| **Lexi** | Traduttrice | Traduzione multilingue, traduzione dei commenti | Automatico al rilevamento di una lingua straniera |

**Perché il modello "Dipendente IA"?**

- **Responsabilità chiare**: Sam gestisce lo smistamento, Grace le risposte; nessuna confusione.
- **Facile da capire**: Dire all'utente "Lasciamo che Sam analizzi la situazione" è più amichevole di "Chiamata API di classificazione".
- **Estensibile**: Aggiungere nuove capacità IA equivale a "assumere" nuovi dipendenti.

#### Filosofia 3: Auto-circolazione della conoscenza

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

Questo crea un ciclo chiuso di **Accumulo di conoscenza - Applicazione della conoscenza**.

---

## 2. Entità principali e modello dati

### 2.1 Panoramica delle relazioni tra entità

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 Dettaglio delle tabelle principali

#### 2.2.1 Tabella principale ticket (nb_tts_tickets)

Questo è il cuore del sistema, che utilizza un design a "tabella larga" inserendo tutti i campi comuni nella tabella principale.

**Informazioni di base**

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| id | BIGINT | Chiave primaria | 1001 |
| ticket_no | VARCHAR | Numero ticket | TKT-20251229-0001 |
| title | VARCHAR | Titolo | Connessione di rete lenta |
| description | TEXT | Descrizione del problema | Da stamattina la rete in ufficio... |
| biz_type | VARCHAR | Tipo di attività | it_support |
| priority | VARCHAR | Priorità | P1 |
| status | VARCHAR | Stato | processing |

**Tracciamento della fonte**

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| source_system | VARCHAR | Sistema di origine | crm / email / iot |
| source_channel | VARCHAR | Canale di origine | web / phone / wechat |
| external_ref_id | VARCHAR | ID riferimento esterno | CRM-2024-0001 |

**Informazioni di contatto**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| customer_id | BIGINT | ID Cliente |
| contact_name | VARCHAR | Nome del contatto |
| contact_phone | VARCHAR | Telefono del contatto |
| contact_email | VARCHAR | Email del contatto |
| contact_company | VARCHAR | Nome azienda |

**Informazioni sull'assegnatario**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| assignee_id | BIGINT | ID Assegnatario |
| assignee_department_id | BIGINT | ID Dipartimento assegnatario |
| transfer_count | INT | Numero di trasferimenti |

**Nodi temporali**

| Campo | Tipo | Descrizione | Momento di attivazione |
|-------|------|-------------|------------------------|
| submitted_at | TIMESTAMP | Data di invio | Alla creazione del ticket |
| assigned_at | TIMESTAMP | Data di assegnazione | All'assegnazione dell'operatore |
| first_response_at | TIMESTAMP | Data prima risposta | Alla prima risposta al cliente |
| resolved_at | TIMESTAMP | Data risoluzione | Al cambio di stato in "resolved" |
| closed_at | TIMESTAMP | Data chiusura | Al cambio di stato in "closed" |

**Relativi a SLA**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| sla_config_id | BIGINT | ID configurazione SLA |
| sla_response_due | TIMESTAMP | Scadenza risposta |
| sla_resolve_due | TIMESTAMP | Scadenza risoluzione |
| sla_paused_at | TIMESTAMP | Inizio pausa SLA |
| sla_paused_duration | INT | Durata totale pausa (minuti) |
| is_sla_response_breached | BOOLEAN | Violazione risposta SLA |
| is_sla_resolve_breached | BOOLEAN | Violazione risoluzione SLA |

**Risultati analisi IA**

| Campo | Tipo | Descrizione | Compilato da |
|-------|------|-------------|--------------|
| ai_category_code | VARCHAR | Categoria identificata dall'IA | Sam |
| ai_sentiment | VARCHAR | Analisi del sentiment | Sam |
| ai_urgency | VARCHAR | Livello di urgenza | Sam |
| ai_keywords | JSONB | Parole chiave | Sam |
| ai_reasoning | TEXT | Processo di ragionamento | Sam |
| ai_suggested_reply | TEXT | Risposta suggerita | Sam/Grace |
| ai_confidence_score | NUMERIC | Punteggio di confidenza | Sam |
| ai_analysis | JSONB | Risultato analisi completo | Sam |

**Supporto multilingue**

| Campo | Tipo | Descrizione | Compilato da |
|-------|------|-------------|--------------|
| source_language_code | VARCHAR | Lingua originale | Sam/Lexi |
| target_language_code | VARCHAR | Lingua di destinazione | Default sistema (EN) |
| is_translated | BOOLEAN | Tradotto | Lexi |
| description_translated | TEXT | Descrizione tradotta | Lexi |

#### 2.2.2 Tabelle di estensione di business

**Riparazione apparecchiature (nb_tts_biz_repair)**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ticket_id | BIGINT | ID ticket associato |
| equipment_model | VARCHAR | Modello apparecchiatura |
| serial_number | VARCHAR | Numero di serie |
| fault_code | VARCHAR | Codice guasto |
| spare_parts | JSONB | Elenco parti di ricambio |
| maintenance_type | VARCHAR | Tipo di manutenzione |

**Supporto IT (nb_tts_biz_it_support)**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ticket_id | BIGINT | ID ticket associato |
| asset_number | VARCHAR | Numero asset |
| os_version | VARCHAR | Versione sistema operativo |
| software_name | VARCHAR | Software coinvolto |
| remote_address | VARCHAR | Indirizzo remoto |
| error_code | VARCHAR | Codice errore |

**Reclami clienti (nb_tts_biz_complaint)**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ticket_id | BIGINT | ID ticket associato |
| related_order_no | VARCHAR | Numero ordine correlato |
| complaint_level | VARCHAR | Livello reclamo |
| compensation_amount | DECIMAL | Importo risarcimento |
| compensation_type | VARCHAR | Modalità risarcimento |
| root_cause | TEXT | Causa principale |

#### 2.2.3 Tabella commenti (nb_tts_ticket_comments)

**Campi principali**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | BIGINT | Chiave primaria |
| ticket_id | BIGINT | ID ticket |
| parent_id | BIGINT | ID commento padre (supporta struttura ad albero) |
| content | TEXT | Contenuto del commento |
| direction | VARCHAR | Direzione: inbound (cliente) / outbound (operatore) |
| is_internal | BOOLEAN | Nota interna |
| is_first_response | BOOLEAN | Prima risposta |

**Campi revisione IA (per outbound)**

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| source_language_code | VARCHAR | Lingua sorgente |
| content_translated | TEXT | Contenuto tradotto |
| is_translated | BOOLEAN | Tradotto |
| is_ai_blocked | BOOLEAN | Bloccato dall'IA |
| ai_block_reason | VARCHAR | Motivo del blocco |
| ai_block_detail | TEXT | Descrizione dettagliata |
| ai_quality_score | NUMERIC | Punteggio qualità |
| ai_suggestions | TEXT | Suggerimenti di miglioramento |

#### 2.2.4 Tabella valutazioni (nb_tts_ratings)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| ticket_id | BIGINT | ID ticket (unico) |
| overall_rating | INT | Soddisfazione generale (1-5) |
| response_rating | INT | Velocità di risposta (1-5) |
| professionalism_rating | INT | Professionalità (1-5) |
| resolution_rating | INT | Risoluzione del problema (1-5) |
| nps_score | INT | Punteggio NPS (0-10) |
| tags | JSONB | Tag rapidi |
| comment | TEXT | Commento testuale |

#### 2.2.5 Tabella articoli di conoscenza (nb_tts_qa_articles)

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| article_no | VARCHAR | Numero articolo KB-T0001 |
| title | VARCHAR | Titolo |
| content | TEXT | Contenuto (Markdown) |
| summary | TEXT | Riassunto |
| category_code | VARCHAR | Codice categoria |
| keywords | JSONB | Parole chiave |
| source_type | VARCHAR | Fonte: ticket/faq/manual |
| source_ticket_id | BIGINT | ID ticket di origine |
| ai_generated | BOOLEAN | Generato dall'IA |
| ai_quality_score | NUMERIC | Punteggio qualità |
| status | VARCHAR | Stato: draft/published/archived |
| view_count | INT | Numero visualizzazioni |
| helpful_count | INT | Numero "utile" |

### 2.3 Elenco delle tabelle dati

| N. | Nome tabella | Descrizione | Tipo record |
|----|--------------|-------------|-------------|
| 1 | nb_tts_tickets | Tabella principale ticket | Dati di business |
| 2 | nb_tts_biz_repair | Estensione riparazione apparecchiature | Dati di business |
| 3 | nb_tts_biz_it_support | Estensione supporto IT | Dati di business |
| 4 | nb_tts_biz_complaint | Estensione reclami clienti | Dati di business |
| 5 | nb_tts_customers | Tabella principale clienti | Dati di business |
| 6 | nb_tts_customer_contacts | Contatti clienti | Dati di business |
| 7 | nb_tts_ticket_comments | Commenti ticket | Dati di business |
| 8 | nb_tts_ratings | Valutazioni soddisfazione | Dati di business |
| 9 | nb_tts_qa_articles | Articoli di conoscenza | Dati di conoscenza |
| 10 | nb_tts_qa_article_relations | Relazioni articoli | Dati di conoscenza |
| 11 | nb_tts_faqs | Domande frequenti (FAQ) | Dati di conoscenza |
| 12 | nb_tts_tickets_categories | Categorie ticket | Dati di configurazione |
| 13 | nb_tts_sla_configs | Configurazioni SLA | Dati di configurazione |
| 14 | nb_tts_skill_configs | Configurazioni competenze | Dati di configurazione |
| 15 | nb_tts_business_types | Tipi di business | Dati di configurazione |

---

## 3. Ciclo di vita del ticket

### 3.1 Definizione degli stati

| Stato | Nome | Descrizione | Conteggio SLA | Colore |
|-------|------|-------------|---------------|--------|
| new | Nuovo | Appena creato, in attesa di assegnazione | Avvio | 🔵 Blu |
| assigned | Assegnato | Operatore assegnato, in attesa di presa in carico | Continua | 🔷 Ciano |
| processing | In elaborazione | In fase di gestione | Continua | 🟠 Arancione |
| pending | In sospeso | In attesa di feedback dal cliente | **Pausa** | ⚫ Grigio |
| transferred | Trasferito | Passato a un altro operatore | Continua | 🟣 Viola |
| resolved | Risolto | In attesa di conferma dal cliente | Stop | 🟢 Verde |
| closed | Chiuso | Ticket terminato | Stop | ⚫ Grigio |
| cancelled | Annullato | Ticket annullato | Stop | ⚫ Grigio |

### 3.2 Diagramma di flusso degli stati

**Flusso principale (da sinistra a destra)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**Flussi secondari**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**Macchina a stati completa**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 Regole chiave per la transizione di stato

| Da | A | Condizione di attivazione | Azione di sistema |
|----|---|---------------------------|-------------------|
| new | assigned | Assegnazione operatore | Registra assigned_at |
| assigned | processing | L'operatore clicca su "Accetta" | Nessuna |
| processing | pending | Clic su "Sospendi" | Registra sla_paused_at |
| pending | processing | Risposta cliente / Ripresa manuale | Calcola durata pausa, svuota paused_at |
| processing | resolved | Clic su "Risolvi" | Registra resolved_at |
| resolved | closed | Conferma cliente / Timeout 3 giorni | Registra closed_at |
| * | cancelled | Annullamento ticket | Nessuna |


---

## 4. Gestione dei livelli di servizio SLA

### 4.1 Priorità e configurazione SLA

| Priorità | Nome | Tempo di risposta | Tempo di risoluzione | Soglia di pre-allarme | Scenario tipico |
|----------|------|-------------------|----------------------|-----------------------|-----------------|
| P0 | Critico | 15 minuti | 2 ore | 80% | Sistema inattivo, linea di produzione ferma |
| P1 | Alto | 1 ora | 8 ore | 80% | Guasto a funzionalità importanti |
| P2 | Medio | 4 ore | 24 ore | 80% | Problemi generali |
| P3 | Basso | 8 ore | 72 ore | 80% | Consulenze, suggerimenti |

### 4.2 Logica di calcolo SLA

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### Alla creazione del ticket

```
Scadenza risposta = Data invio + Limite risposta (minuti)
Scadenza risoluzione = Data invio + Limite risoluzione (minuti)
```

#### In sospensione (pending)

```
Inizio pausa SLA = Ora attuale
```

#### Alla ripresa (da pending a processing)

```
-- Calcolo durata della pausa attuale
Durata pausa attuale = Ora attuale - Inizio pausa SLA

-- Aggiunta alla durata totale della pausa
Durata totale pausa = Durata totale pausa + Durata pausa attuale

-- Estensione delle scadenze (il periodo di pausa non conta per lo SLA)
Scadenza risposta = Scadenza risposta + Durata pausa attuale
Scadenza risoluzione = Scadenza risoluzione + Durata pausa attuale

-- Reset dell'inizio pausa
Inizio pausa SLA = Vuoto
```

#### Determinazione violazione SLA

```
-- Violazione risposta
Risposta violata = (Prima risposta vuota E Ora attuale > Scadenza risposta)
                 OPPURE (Prima risposta > Scadenza risposta)

-- Violazione risoluzione
Risoluzione violata = (Data risoluzione vuota E Ora attuale > Scadenza risoluzione)
                    OPPURE (Data risoluzione > Scadenza risoluzione)
```

### 4.3 Meccanismo di pre-allarme SLA

| Livello allarme | Condizione | Destinatario | Modalità |
|-----------------|------------|--------------|----------|
| Allarme Giallo | Tempo residuo < 20% | Operatore | Messaggio interno |
| Allarme Rosso | Scaduto | Operatore + Supervisore | Messaggio interno + Email |
| Allarme Escalation | Scaduto da 1 ora | Responsabile dipartimento | Email + SMS |

### 4.4 Indicatori Dashboard SLA

| Indicatore | Formula di calcolo | Soglia di salute |
|------------|--------------------|------------------|
| Tasso conformità risposta | Ticket non violati / Totale ticket | > 95% |
| Tasso conformità risoluzione | Risolti non violati / Totale ticket risolti | > 90% |
| Tempo medio di risposta | SUM(Tempo risposta) / Numero ticket | < 50% dello SLA |
| Tempo medio di risoluzione | SUM(Tempo risoluzione) / Numero ticket | < 80% dello SLA |

---

## 5. Capacità IA e sistema dipendenti

### 5.1 Team di dipendenti IA

Il sistema configura 8 dipendenti IA, divisi in due categorie:

**Nuovi dipendenti (Specifici per il sistema ticket)**

| ID | Nome | Ruolo | Capacità principali |
|----|------|-------|---------------------|
| sam | Sam | Supervisore Service Desk | Smistamento ticket, valutazione priorità, decisioni escalation, identificazione rischi SLA |
| grace | Grace | Esperta Customer Success | Generazione risposte professionali, regolazione tono, gestione reclami, recupero soddisfazione |
| max | Max | Assistente conoscenza | Ricerca casi simili, raccomandazione articoli, sintesi soluzioni |

**Dipendenti riutilizzati (Capacità generali)**

| ID | Nome | Ruolo | Capacità principali |
|----|------|-------|---------------------|
| dex | Dex | Organizzatore dati | Estrazione ticket da email/telefonate, pulizia dati massiva |
| ellis | Ellis | Esperto Email | Analisi sentiment email, riassunto thread, bozze risposte |
| lexi | Lexi | Traduttrice | Traduzione ticket, traduzione risposte, traduzione dialoghi in tempo reale |
| cole | Cole | Esperto NocoBase | Guida all'uso del sistema, aiuto configurazione flussi di lavoro |
| vera | Vera | Analista di ricerca | Ricerca soluzioni tecniche, verifica informazioni prodotto |

### 5.2 Elenco attività IA

Ogni dipendente IA ha 4 attività specifiche configurate:

#### Attività di Sam

| ID Attività | Nome | Modalità attivazione | Descrizione |
|-------------|------|----------------------|-------------|
| SAM-01 | Analisi e smistamento ticket | Flusso di lavoro auto | Analisi automatica alla creazione |
| SAM-02 | Rivalutazione priorità | Interazione frontend | Regola priorità in base a nuove info |
| SAM-03 | Decisione escalation | Frontend/Flusso | Valuta se è necessaria l'escalation |
| SAM-04 | Valutazione rischio SLA | Flusso di lavoro auto | Identifica rischi di timeout |

#### Attività di Grace

| ID Attività | Nome | Modalità attivazione | Descrizione |
|-------------|------|----------------------|-------------|
| GRACE-01 | Generazione risposte professionali | Interazione frontend | Genera risposte in base al contesto |
| GRACE-02 | Regolazione tono risposta | Interazione frontend | Ottimizza il tono delle risposte esistenti |
| GRACE-03 | Gestione de-escalation reclami | Frontend/Flusso | Risolve i reclami dei clienti |
| GRACE-04 | Recupero soddisfazione | Frontend/Flusso | Follow-up dopo esperienze negative |

#### Attività di Max

| ID Attività | Nome | Modalità attivazione | Descrizione |
|-------------|------|----------------------|-------------|
| MAX-01 | Ricerca casi simili | Frontend/Flusso | Trova ticket storici simili |
| MAX-02 | Raccomandazione articoli | Frontend/Flusso | Suggerisce articoli di conoscenza pertinenti |
| MAX-03 | Sintesi soluzioni | Interazione frontend | Sintetizza soluzioni da più fonti |
| MAX-04 | Guida risoluzione problemi | Interazione frontend | Crea processi di controllo sistematici |

#### Attività di Lexi

| ID Attività | Nome | Modalità attivazione | Descrizione |
|-------------|------|----------------------|-------------|
| LEXI-01 | Traduzione ticket | Flusso di lavoro auto | Traduce il contenuto del ticket |
| LEXI-02 | Traduzione risposte | Interazione frontend | Traduce le risposte dell'operatore |
| LEXI-03 | Traduzione massiva | Flusso di lavoro auto | Gestione traduzioni in blocco |
| LEXI-04 | Traduzione dialoghi real-time | Interazione frontend | Traduzione simultanea conversazioni |

### 5.3 Dipendenti IA e ciclo di vita del ticket

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 Esempi di risposta IA

#### SAM-01 Risposta analisi ticket

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "errore login", "timeout", "chiusura mensile"],
  "confidence": 0.92,
  "reasoning": "Il ticket descrive un problema di accesso al sistema ERP che impatta la chiusura mensile del dipartimento finanziario, urgenza elevata",
  "suggested_reply": "Gentile cliente, la ringraziamo per la segnalazione...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "Salve, non riusciamo ad accedere al sistema ERP..."
}
```

#### GRACE-01 Risposta generazione risposta

```
Gentile Sig. Rossi,

La ringraziamo per averci contattato in merito al problema di accesso all'ERP. Comprendo perfettamente come questo stia influenzando le attività di chiusura mensile della Sua azienda; abbiamo assegnato a questa segnalazione la massima priorità.

Stato attuale:
- Il team tecnico sta verificando i problemi di connessione al server
- Prevediamo di fornirLe un aggiornamento entro 30 minuti

Nel frattempo, può provare a:
1. Accedere tramite l'indirizzo di backup: https://erp-backup.azienda.it
2. Se necessita di report urgenti, ci contatti per assistenza nell'esportazione

Resto a Sua disposizione per qualsiasi ulteriore necessità.

Cordiali saluti,
Team di Supporto Tecnico
```

### 5.5 Filtro per l'intelligenza emotiva IA

La revisione della qualità delle risposte affidata a Grace intercetta i seguenti problemi:

| Tipo di problema | Esempio originale | Suggerimento IA |
|------------------|-------------------|-----------------|
| Tono negativo | "No, questo non è in garanzia" | "Il guasto non rientra attualmente nella garanzia gratuita, possiamo proporre un piano di riparazione a pagamento" |
| Accusa al cliente | "L'ha rotto Lei" | "Dalle verifiche effettuate, il guasto risulta essere un danno accidentale" |
| Scarico responsabilità | "Non è un problema nostro" | "Mi permetta di aiutarLa a indagare ulteriormente sulle cause del problema" |
| Espressione fredda | "Non lo so" | "Mi lasci verificare le informazioni pertinenti per Lei" |
| Info sensibili | "La Sua password è abc123" | [Bloccato] Contiene informazioni sensibili, invio non consentito |

---

## 6. Sistema della base di conoscenza

### 6.1 Fonti di conoscenza

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 Flusso da ticket a conoscenza

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**Dimensioni di valutazione**:
- **Generalità**: È un problema comune?
- **Completezza**: La soluzione è chiara e completa?
- **Ripetibilità**: I passaggi sono riutilizzabili?

### 6.3 Meccanismo di raccomandazione della conoscenza

Quando l'operatore apre i dettagli del ticket, Max raccomanda automaticamente la conoscenza correlata:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Conoscenza raccomandata                     [Espandi/Riduci] │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 Guida diagnosi guasti sistema servo CNC  Match: 94% │
│ │ Include: Interpretazione codici allarme, check drive servo   │
│ │ [Visualizza] [Applica a risposta] [Segna come utile]      │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 Manuale manutenzione serie XYZ-CNC3000   Match: 87% │
│ │ Include: Guasti comuni, piano manutenzione preventiva      │
│ │ [Visualizza] [Applica a risposta] [Segna come utile]      │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. Motore dei flussi di lavoro

### 7.1 Classificazione dei flussi di lavoro

| Codice | Categoria | Descrizione | Modalità attivazione |
|--------|-----------|-------------|----------------------|
| WF-T | Flusso Ticket | Gestione ciclo di vita ticket | Eventi modulo |
| WF-S | Flusso SLA | Calcolo e allarmi SLA | Eventi modulo/Pianificato |
| WF-C | Flusso Commenti | Gestione e traduzione commenti | Eventi modulo |
| WF-R | Flusso Valutazioni | Inviti e statistiche valutazioni | Eventi modulo/Pianificato |
| WF-N | Flusso Notifiche | Invio notifiche | Basato su eventi |
| WF-AI | Flusso IA | Analisi e generazione IA | Eventi modulo |

### 7.2 Flussi di lavoro principali

#### WF-T01: Flusso creazione ticket

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: Analisi IA ticket

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: Traduzione e revisione commenti

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: Generazione conoscenza

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 Attività pianificate

| Attività | Frequenza | Descrizione |
|----------|-----------|-------------|
| Controllo allarmi SLA | Ogni 5 minuti | Verifica ticket prossimi alla scadenza |
| Chiusura automatica ticket | Giornaliera | Chiusura automatica dopo 3 giorni in stato "resolved" |
| Invio inviti valutazione | Giornaliera | Invio invito 24 ore dopo la chiusura |
| Aggiornamento statistiche | Oraria | Aggiorna le statistiche ticket dei clienti |

---

## 8. Design dei menu e dell'interfaccia

### 8.1 Pannello di amministrazione backend

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 Portale clienti

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 Design delle Dashboard

#### Vista Dirigente

| Componente | Tipo | Descrizione dati |
|------------|------|------------------|
| Tasso conformità SLA | Gauge | Tasso conformità risposta/risoluzione mese corrente |
| Trend soddisfazione | Grafico a linee | Variazione soddisfazione ultimi 30 giorni |
| Trend volume ticket | Grafico a barre | Volume ticket ultimi 30 giorni |
| Distribuzione tipi business | Grafico a torta | Percentuale per ogni tipo di attività |

#### Vista Supervisore

| Componente | Tipo | Descrizione dati |
|------------|------|------------------|
| Allarmi scadenza | Elenco | Ticket in scadenza o già scaduti |
| Carico di lavoro team | Grafico a barre | Numero ticket per membro del team |
| Distribuzione arretrati | Grafico a pile | Numero ticket per stato |
| Efficienza gestione | Mappa di calore | Distribuzione tempi medi di gestione |

#### Vista Operatore

| Componente | Tipo | Descrizione dati |
|------------|------|------------------|
| Mie attività | Scheda numerica | Numero ticket da gestire |
| Distribuzione priorità | Grafico a torta | Distribuzione P0/P1/P2/P3 |
| Statistiche odierne | Scheda indicatori | Gestiti/Risolti oggi |
| Countdown SLA | Elenco | I 5 ticket più urgenti |

---

## Appendice

### A. Configurazione tipi di business

| Codice tipo | Nome | Icona | Tabella estensione associata |
|-------------|------|-------|------------------------------|
| repair | Riparazione apparecchiature | 🔧 | nb_tts_biz_repair |
| it_support | Supporto IT | 💻 | nb_tts_biz_it_support |
| complaint | Reclamo cliente | 📢 | nb_tts_biz_complaint |
| consultation | Consulenza/Suggerimento | ❓ | Nessuna |
| other | Altro | 📝 | Nessuna |

### B. Codici categoria

| Codice | Nome | Descrizione |
|--------|------|-------------|
| CONVEYOR | Sistemi di trasporto | Problemi sistemi di trasporto |
| PACKAGING | Macchine imballaggio | Problemi macchine imballaggio |
| WELDING | Apparecchiature saldatura | Problemi apparecchiature saldatura |
| COMPRESSOR | Compressori d'aria | Problemi compressori d'aria |
| COLD_STORE | Celle frigorifere | Problemi celle frigorifere |
| CENTRAL_AC | Aria condizionata centr. | Problemi aria condizionata |
| FORKLIFT | Carrelli elevatori | Problemi carrelli elevatori |
| COMPUTER | Computer | Problemi hardware computer |
| PRINTER | Stampanti | Problemi stampanti |
| PROJECTOR | Proiettori | Problemi proiettori |
| INTERNET | Rete | Problemi connessione rete |
| EMAIL | Email | Problemi sistema email |
| ACCESS | Permessi | Problemi permessi account |
| PROD_INQ | Info prodotto | Richiesta informazioni prodotto |
| COMPLAINT | Reclamo generale | Reclamo generale |
| DELAY | Ritardo logistica | Reclamo ritardo spedizione |
| DAMAGE | Imballaggio danneggiato | Reclamo imballaggio danneggiato |
| QUANTITY | Errore quantità | Reclamo mancanza pezzi |
| SVC_ATTITUDE | Atteggiamento servizio | Reclamo comportamento personale |
| PROD_QUALITY | Qualità prodotto | Reclamo qualità prodotto |
| TRAINING | Formazione | Richiesta formazione |
| RETURN | Reso | Richiesta reso merce |

---

*Versione documento: 2.0 | Ultimo aggiornamento: 05-01-2026*