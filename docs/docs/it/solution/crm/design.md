:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/solution/crm/design).
:::

# Progettazione Dettagliata del Sistema CRM 2.0


## 1. Panoramica del sistema e filosofia di progettazione

### 1.1 Posizionamento del sistema

Questo sistema è una **Piattaforma di gestione delle vendite CRM 2.0** costruita sulla piattaforma no-code NocoBase. L'obiettivo principale è:

```
Permettere ai venditori di concentrarsi sulla costruzione di relazioni con i clienti, anziché sull'inserimento dei dati e sull'analisi ripetitiva.
```

Il sistema automatizza le attività di routine attraverso flussi di lavoro e utilizza l'IA per assistere nel punteggio dei lead, nell'analisi delle opportunità e in altre attività, aiutando i team di vendita a migliorare l'efficienza.

### 1.2 Filosofia di progettazione

#### Filosofia 1: Imbuto di vendita completo

**Processo di vendita end-to-end:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**Perché progettarlo in questo modo?**

| Metodo tradizionale | CRM integrato |
|---------|-----------|
| Utilizzo di più sistemi per fasi diverse | Un unico sistema che copre l'intero ciclo di vita |
| Trasferimento manuale dei dati tra i sistemi | Flusso di dati e conversione automatizzati |
| Viste dei clienti incoerenti | Vista unificata del cliente a 360 gradi |
| Analisi dei dati frammentata | Analisi della pipeline di vendita end-to-end |

#### Filosofia 2: Pipeline di vendita configurabile
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

Settori diversi possono personalizzare le fasi della pipeline di vendita senza modificare il codice.

#### Filosofia 3: Design modulare

- I moduli principali (Clienti + Opportunità) sono obbligatori; altri moduli possono essere abilitati secondo necessità.
- La disattivazione dei moduli non richiede modifiche al codice; si effettua tramite la configurazione dell'interfaccia di NocoBase.
- Ogni modulo è progettato in modo indipendente per ridurre l'accoppiamento.

---

## 2. Architettura dei moduli e personalizzazione

### 2.1 Panoramica dei moduli

Il sistema CRM adotta un design ad **architettura modulare**: ogni modulo può essere abilitato o disabilitato indipendentemente in base ai requisiti aziendali.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 Dipendenze dei moduli

| Modulo | Obbligatorio | Dipendenze | Condizione di disattivazione |
|-----|---------|--------|---------|
| **Gestione Clienti** | ✅ Sì | - | Impossibile disattivare (Core) |
| **Gestione Opportunità** | ✅ Sì | Gestione Clienti | Impossibile disattivare (Core) |
| **Gestione Lead** | Opzionale | - | Quando non è richiesta l'acquisizione di lead |
| **Gestione Preventivi** | Opzionale | Opportunità, Prodotti | Transazioni semplici che non richiedono preventivi formali |
| **Gestione Ordini** | Opzionale | Opportunità (o Preventivi) | Quando non è richiesto il monitoraggio di ordini/pagamenti |
| **Gestione Prodotti** | Opzionale | - | Quando non è richiesto un catalogo prodotti |
| **Integrazione E-mail** | Opzionale | Clienti, Contatti | Quando si utilizza un sistema e-mail esterno |

### 2.3 Versioni preconfigurate

| Versione | Moduli inclusi | Caso d'uso | Numero di collezioni |
|-----|---------|---------|-----------|
| **Lite** | Clienti + Opportunità | Monitoraggio transazioni semplici | 6 |
| **Standard** | Lite + Lead + Preventivi + Ordini + Prodotti | Ciclo di vendita completo | 15 |
| **Enterprise** | Standard + Integrazione E-mail | Funzionalità complete inclusa l'e-mail | 17 |

### 2.4 Mappatura Modulo-Collezione

#### Collezioni dei moduli principali (Sempre richieste)

| Collezione | Modulo | Descrizione |
|-------|------|------|
| nb_crm_customers | Gestione Clienti | Record Clienti/Aziende |
| nb_crm_contacts | Gestione Clienti | Contatti |
| nb_crm_customer_shares | Gestione Clienti | Permessi di condivisione clienti |
| nb_crm_opportunities | Gestione Opportunità | Opportunità di vendita |
| nb_crm_opportunity_stages | Gestione Opportunità | Configurazioni delle fasi |
| nb_crm_opportunity_users | Gestione Opportunità | Collaboratori dell'opportunità |
| nb_crm_activities | Gestione Attività | Record delle attività |
| nb_crm_comments | Gestione Attività | Commenti/Note |
| nb_crm_tags | Core | Tag condivisi |
| nb_cbo_currencies | Dati di base | Dizionario valute |
| nb_cbo_regions | Dati di base | Dizionario Paesi/Regioni |

### 2.5 Come disattivare i moduli

È sufficiente nascondere la voce di menu per il modulo nell'interfaccia di amministrazione di NocoBase; non è necessario modificare il codice o eliminare le collezioni.

---

## 3. Entità principali e modello dati

### 3.1 Panoramica delle relazioni tra entità
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 Dettagli delle collezioni principali

#### 3.2.1 Lead (nb_crm_leads)

Gestione dei lead tramite un flusso di lavoro semplificato a 4 fasi.

**Processo delle fasi:**
```
Nuovo → In lavorazione → Qualificato → Convertito in Cliente/Opportunità
           ↓               ↓
     Non qualificato  Non qualificato
```

**Campi chiave:**

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| lead_no | VARCHAR | Numero lead (generato automaticamente) |
| name | VARCHAR | Nome contatto |
| company | VARCHAR | Nome azienda |
| title | VARCHAR | Qualifica |
| email | VARCHAR | E-mail |
| phone | VARCHAR | Telefono |
| mobile_phone | VARCHAR | Cellulare |
| website | TEXT | Sito web |
| address | TEXT | Indirizzo |
| source | VARCHAR | Fonte lead: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | Settore |
| annual_revenue | VARCHAR | Scala del fatturato annuo |
| number_of_employees | VARCHAR | Scala del numero di dipendenti |
| status | VARCHAR | Stato: new/working/qualified/unqualified |
| rating | VARCHAR | Valutazione: hot/warm/cold |
| owner_id | BIGINT | Responsabile (FK → users) |
| ai_score | INTEGER | Punteggio qualità IA 0-100 |
| ai_convert_prob | DECIMAL | Probabilità di conversione IA |
| ai_best_contact_time | VARCHAR | Orario di contatto consigliato dall'IA |
| ai_tags | JSONB | Tag generati dall'IA |
| ai_scored_at | TIMESTAMP | Orario del punteggio IA |
| ai_next_best_action | TEXT | Suggerimento IA per la prossima migliore azione |
| ai_nba_generated_at | TIMESTAMP | Orario di generazione del suggerimento IA |
| is_converted | BOOLEAN | Flag convertito |
| converted_at | TIMESTAMP | Orario di conversione |
| converted_customer_id | BIGINT | ID Cliente convertito |
| converted_contact_id | BIGINT | ID Contatto convertito |
| converted_opportunity_id | BIGINT | ID Opportunità convertita |
| lost_reason | TEXT | Motivo della perdita |
| disqualification_reason | TEXT | Motivo della squalifica |
| description | TEXT | Descrizione |

#### 3.2.2 Clienti (nb_crm_customers)

Gestione Clienti/Aziende che supporta il commercio internazionale.

**Campi chiave:**

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| name | VARCHAR | Nome cliente (obbligatorio) |
| account_number | VARCHAR | Numero cliente (generato automaticamente, unico) |
| phone | VARCHAR | Telefono |
| website | TEXT | Sito web |
| address | TEXT | Indirizzo |
| industry | VARCHAR | Settore |
| type | VARCHAR | Tipo: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | Scala del numero di dipendenti |
| annual_revenue | VARCHAR | Scala del fatturato annuo |
| level | VARCHAR | Livello: normal/important/vip |
| status | VARCHAR | Stato: potential/active/dormant/churned |
| country | VARCHAR | Paese |
| region_id | BIGINT | Regione (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | Valuta preferita: CNY/USD/EUR |
| owner_id | BIGINT | Responsabile (FK → users) |
| parent_id | BIGINT | Azienda madre (FK → self) |
| source_lead_id | BIGINT | ID Lead di origine |
| ai_health_score | INTEGER | Punteggio salute IA 0-100 |
| ai_health_grade | VARCHAR | Grado di salute IA: A/B/C/D |
| ai_churn_risk | DECIMAL | Rischio di abbandono IA 0-100% |
| ai_churn_risk_level | VARCHAR | Livello di rischio abbandono IA: low/medium/high |
| ai_health_dimensions | JSONB | Punteggi delle dimensioni di salute IA |
| ai_recommendations | JSONB | Elenco suggerimenti IA |
| ai_health_assessed_at | TIMESTAMP | Orario valutazione salute IA |
| ai_tags | JSONB | Tag generati dall'IA |
| ai_best_contact_time | VARCHAR | Orario di contatto consigliato dall'IA |
| ai_next_best_action | TEXT | Suggerimento IA per la prossima migliore azione |
| ai_nba_generated_at | TIMESTAMP | Orario di generazione del suggerimento IA |
| description | TEXT | Descrizione |
| is_deleted | BOOLEAN | Flag eliminazione logica |

#### 3.2.3 Opportunità (nb_crm_opportunities)

Gestione delle opportunità di vendita con fasi della pipeline configurabili.

**Campi chiave:**

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| opportunity_no | VARCHAR | Numero opportunità (generato automaticamente, unico) |
| name | VARCHAR | Nome opportunità (obbligatorio) |
| amount | DECIMAL | Importo previsto |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Tasso di cambio |
| amount_usd | DECIMAL | Importo equivalente in USD |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contatto principale (FK) |
| stage | VARCHAR | Codice fase (FK → stages.code) |
| stage_sort | INTEGER | Ordine di ordinamento fase (ridondante per facilitare l'ordinamento) |
| stage_entered_at | TIMESTAMP | Orario di ingresso nella fase attuale |
| days_in_stage | INTEGER | Giorni trascorsi nella fase attuale |
| win_probability | DECIMAL | Probabilità di vincita manuale |
| ai_win_probability | DECIMAL | Probabilità di vincita prevista dall'IA |
| ai_analyzed_at | TIMESTAMP | Orario analisi IA |
| ai_confidence | DECIMAL | Confidenza della previsione IA |
| ai_trend | VARCHAR | Trend previsione IA: up/stable/down |
| ai_risk_factors | JSONB | Fattori di rischio identificati dall'IA |
| ai_recommendations | JSONB | Elenco suggerimenti IA |
| ai_predicted_close | DATE | Data di chiusura prevista dall'IA |
| ai_next_best_action | TEXT | Suggerimento IA per la prossima migliore azione |
| ai_nba_generated_at | TIMESTAMP | Orario di generazione del suggerimento IA |
| expected_close_date | DATE | Data di chiusura prevista |
| actual_close_date | DATE | Data di chiusura effettiva |
| owner_id | BIGINT | Responsabile (FK → users) |
| last_activity_at | TIMESTAMP | Orario ultima attività |
| stagnant_days | INTEGER | Giorni senza attività |
| loss_reason | TEXT | Motivo della perdita |
| competitor_id | BIGINT | Concorrente (FK) |
| lead_source | VARCHAR | Fonte lead |
| campaign_id | BIGINT | ID Campagna marketing |
| expected_revenue | DECIMAL | Entrate previste = importo × probabilità |
| description | TEXT | Descrizione |

#### 3.2.4 Preventivi (nb_crm_quotations)

Gestione dei preventivi con supporto multi-valuta e flussi di lavoro di approvazione.

**Flusso degli stati:**
```
Bozza → In attesa di approvazione → Approvato → Inviato → Accettato/Rifiutato/Scaduto
                   ↓
               Rifiutato → Modifica → Bozza
```

**Campi chiave:**

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| quotation_no | VARCHAR | N. preventivo (generato automaticamente, unico) |
| name | VARCHAR | Nome preventivo |
| version | INTEGER | Numero versione |
| opportunity_id | BIGINT | Opportunità (FK, obbligatorio) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contatto (FK) |
| owner_id | BIGINT | Responsabile (FK → users) |
| currency_id | BIGINT | Valuta (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | Tasso di cambio |
| subtotal | DECIMAL | Totale parziale |
| discount_rate | DECIMAL | Tasso di sconto |
| discount_amount | DECIMAL | Importo sconto |
| shipping_handling | DECIMAL | Spedizione/Gestione |
| tax_rate | DECIMAL | Aliquota fiscale |
| tax_amount | DECIMAL | Importo tasse |
| total_amount | DECIMAL | Importo totale |
| total_amount_usd | DECIMAL | Importo equivalente in USD |
| status | VARCHAR | Stato: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | Orario di invio |
| approved_by | BIGINT | Approvatore (FK → users) |
| approved_at | TIMESTAMP | Orario approvazione |
| rejected_at | TIMESTAMP | Orario rifiuto |
| sent_at | TIMESTAMP | Orario invio al cliente |
| customer_response_at | TIMESTAMP | Orario risposta cliente |
| expired_at | TIMESTAMP | Orario scadenza |
| valid_until | DATE | Valido fino al |
| payment_terms | TEXT | Termini di pagamento |
| terms_condition | TEXT | Termini e condizioni |
| address | TEXT | Indirizzo di spedizione |
| description | TEXT | Descrizione |

#### 3.2.5 Ordini (nb_crm_orders)

Gestione degli ordini incluso il monitoraggio dei pagamenti.

**Campi chiave:**

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| order_no | VARCHAR | Numero ordine (generato automaticamente, unico) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contatto (FK) |
| opportunity_id | BIGINT | Opportunità (FK) |
| quotation_id | BIGINT | Preventivo (FK) |
| owner_id | BIGINT | Responsabile (FK → users) |
| currency | VARCHAR | Valuta |
| exchange_rate | DECIMAL | Tasso di cambio |
| order_amount | DECIMAL | Importo ordine |
| paid_amount | DECIMAL | Importo pagato |
| unpaid_amount | DECIMAL | Importo non pagato |
| status | VARCHAR | Stato: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | Stato pagamento: unpaid/partial/paid |
| order_date | DATE | Data ordine |
| delivery_date | DATE | Data di consegna prevista |
| actual_delivery_date | DATE | Data di consegna effettiva |
| shipping_address | TEXT | Indirizzo di spedizione |
| logistics_company | VARCHAR | Società di logistica |
| tracking_no | VARCHAR | Numero di tracciamento |
| terms_condition | TEXT | Termini e condizioni |
| description | TEXT | Descrizione |

### 3.3 Riepilogo delle collezioni

#### Collezioni aziendali CRM

| N. | Nome collezione | Descrizione | Tipo |
|-----|------|------|------|
| 1 | nb_crm_leads | Gestione Lead | Business |
| 2 | nb_crm_customers | Clienti/Aziende | Business |
| 3 | nb_crm_contacts | Contatti | Business |
| 4 | nb_crm_opportunities | Opportunità di vendita | Business |
| 5 | nb_crm_opportunity_stages | Configurazione fasi | Configurazione |
| 6 | nb_crm_opportunity_users | Collaboratori opportunità (Team di vendita) | Associazione |
| 7 | nb_crm_quotations | Preventivi | Business |
| 8 | nb_crm_quotation_items | Voci del preventivo | Business |
| 9 | nb_crm_quotation_approvals | Record di approvazione | Business |
| 10 | nb_crm_orders | Ordini | Business |
| 11 | nb_crm_order_items | Voci dell'ordine | Business |
| 12 | nb_crm_payments | Record dei pagamenti | Business |
| 13 | nb_crm_products | Catalogo prodotti | Business |
| 14 | nb_crm_product_categories | Categorie prodotti | Configurazione |
| 15 | nb_crm_price_tiers | Prezzi a scaglioni | Configurazione |
| 16 | nb_crm_activities | Record delle attività | Business |
| 17 | nb_crm_comments | Commenti/Note | Business |
| 18 | nb_crm_competitors | Concorrenti | Business |
| 19 | nb_crm_tags | Tag | Configurazione |
| 20 | nb_crm_lead_tags | Associazione Lead-Tag | Associazione |
| 21 | nb_crm_contact_tags | Associazione Contatto-Tag | Associazione |
| 22 | nb_crm_customer_shares | Permessi di condivisione clienti | Associazione |
| 23 | nb_crm_exchange_rates | Cronologia tassi di cambio | Configurazione |

#### Collezioni dati di base (Moduli comuni)

| N. | Nome collezione | Descrizione | Tipo |
|-----|------|------|------|
| 1 | nb_cbo_currencies | Dizionario valute | Configurazione |
| 2 | nb_cbo_regions | Dizionario Paesi/Regioni | Configurazione |

### 3.4 Collezioni ausiliarie

#### 3.4.1 Commenti (nb_crm_comments)

Collezione generica di commenti/note che può essere associata a vari oggetti aziendali.

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| content | TEXT | Contenuto del commento |
| lead_id | BIGINT | Lead associato (FK) |
| customer_id | BIGINT | Cliente associato (FK) |
| opportunity_id | BIGINT | Opportunità associata (FK) |
| order_id | BIGINT | Ordine associato (FK) |

#### 3.4.2 Condivisioni clienti (nb_crm_customer_shares)

Consente la collaborazione tra più persone e la condivisione dei permessi per i clienti.

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| customer_id | BIGINT | Cliente (FK, obbligatorio) |
| shared_with_user_id | BIGINT | Condiviso con l'utente (FK, obbligatorio) |
| shared_by_user_id | BIGINT | Condiviso dall'utente (FK) |
| permission_level | VARCHAR | Livello di permesso: read/write/full |
| shared_at | TIMESTAMP | Orario di condivisione |

#### 3.4.3 Collaboratori opportunità (nb_crm_opportunity_users)

Supporta la collaborazione del team di vendita sulle opportunità.

| Campo | Tipo | Descrizione |
|-----|------|------|
| opportunity_id | BIGINT | Opportunità (FK, PK composta) |
| user_id | BIGINT | Utente (FK, PK composta) |
| role | VARCHAR | Ruolo: owner/collaborator/viewer |

#### 3.4.4 Regioni (nb_cbo_regions)

Dizionario dei dati di base per Paesi/Regioni.

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| code_alpha2 | VARCHAR | Codice ISO 3166-1 Alpha-2 (unico) |
| code_alpha3 | VARCHAR | Codice ISO 3166-1 Alpha-3 (unico) |
| code_numeric | VARCHAR | Codice numerico ISO 3166-1 |
| name | VARCHAR | Nome Paese/Regione |
| is_active | BOOLEAN | È attivo |
| sort_order | INTEGER | Ordine di ordinamento |

---

## 4. Ciclo di vita dei lead

La gestione dei lead utilizza un flusso di lavoro semplificato a 4 fasi. Quando viene creato un nuovo lead, un flusso di lavoro può attivare automaticamente il punteggio IA per aiutare i venditori a identificare rapidamente i lead di alta qualità.

### 4.1 Definizioni degli stati

| Stato | Nome | Descrizione |
|-----|------|------|
| new | Nuovo | Appena creato, in attesa di contatto |
| working | In lavorazione | Seguito attivamente |
| qualified | Qualificato | Pronto per la conversione |
| unqualified | Non qualificato | Non idoneo |

### 4.2 Diagramma di flusso degli stati

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 Processo di conversione dei lead

L'interfaccia di conversione fornisce tre opzioni simultaneamente; gli utenti possono scegliere di creare o associare:

- **Cliente**: Creare un nuovo cliente OPPURE associarlo a un cliente esistente.
- **Contatto**: Creare un nuovo contatto (associato al cliente).
- **Opportunità**: È obbligatorio creare un'opportunità.
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**Record post-conversione:**
- `converted_customer_id`: ID Cliente associato
- `converted_contact_id`: ID Contatto associato
- `converted_opportunity_id`: ID Opportunità creata

---

## 5. Ciclo di vita delle opportunità

La gestione delle opportunità utilizza fasi della pipeline di vendita configurabili. Quando una fase dell'opportunità cambia, può attivare automaticamente la previsione della probabilità di vincita tramite IA per aiutare i venditori a identificare rischi e opportunità.

### 5.1 Fasi configurabili

Le fasi sono memorizzate nella collezione `nb_crm_opportunity_stages` e possono essere personalizzate:

| Codice | Nome | Ordine | Probabilità di vincita predefinita |
|-----|------|------|---------|
| prospecting | Ricerca | 1 | 10% |
| analysis | Analisi dei bisogni | 2 | 30% |
| proposal | Proposta/Preventivo | 3 | 60% |
| negotiation | Negoziazione/Revisione | 4 | 80% |
| won | Chiusa vinta | 5 | 100% |
| lost | Chiusa persa | 6 | 0% |

### 5.2 Flusso della pipeline
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 Rilevamento della stagnazione

Le opportunità senza attività verranno contrassegnate:

| Giorni senza attività | Azione |
|-----------|------|
| 7 giorni | Avviso giallo |
| 14 giorni | Promemoria arancione al responsabile |
| 30 giorni | Promemoria rosso al manager |

```sql
-- Calcolo dei giorni di stagnazione
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 Gestione di vincite/perdite

**In caso di vincita:**
1. Aggiornare la fase a 'won'.
2. Registrare la data di chiusura effettiva.
3. Aggiornare lo stato del cliente in 'active'.
4. Attivare la creazione dell'ordine (se un preventivo è stato accettato).

**In caso di perdita:**
1. Aggiornare la fase a 'lost'.
2. Registrare il motivo della perdita.
3. Registrare l'ID del concorrente (se persa a favore di un concorrente).
4. Notificare il manager.

---

## 6. Ciclo di vita dei preventivi

### 6.1 Definizioni degli stati

| Stato | Nome | Descrizione |
|-----|------|------|
| draft | Bozza | In preparazione |
| pending_approval | In attesa di approvazione | In attesa di approvazione |
| approved | Approvato | Pronto per l'invio |
| sent | Inviato | Inviato al cliente |
| accepted | Accettato | Accettato dal cliente |
| rejected | Rifiutato | Rifiutato dal cliente |
| expired | Scaduto | Oltre la data di validità |

### 6.2 Regole di approvazione (da finalizzare)

I flussi di lavoro di approvazione vengono attivati in base alle seguenti condizioni:

| Condizione | Livello di approvazione |
|------|---------|
| Sconto > 10% | Sales Manager |
| Sconto > 20% | Direttore Vendite |
| Importo > $100K | Amministrazione + Direttore Generale |

### 6.3 Supporto multi-valuta

#### Filosofia di progettazione

Utilizzare l'**USD come valuta di base unificata** per tutti i report e le analisi. Ogni record di importo memorizza:
- Valuta e importo originali (ciò che vede il cliente)
- Tasso di cambio al momento della transazione
- Importo equivalente in USD (per confronti interni)

#### Dizionario valute (nb_cbo_currencies)

La configurazione delle valute utilizza una collezione di dati di base comune, supportando la gestione dinamica. Il campo `current_rate` memorizza il tasso di cambio attuale, aggiornato da un'attività pianificata dall'ultimo record in `nb_crm_exchange_rates`.

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| code | VARCHAR | Codice valuta (unico): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | Nome valuta |
| symbol | VARCHAR | Simbolo valuta |
| decimal_places | INTEGER | Posizioni decimali |
| current_rate | DECIMAL | Tasso attuale rispetto all'USD (sincronizzato dalla cronologia) |
| is_active | BOOLEAN | È attivo |
| sort_order | INTEGER | Ordine di ordinamento |

#### Cronologia tassi di cambio (nb_crm_exchange_rates)

Registra i dati storici dei tassi di cambio. Un'attività pianificata sincronizza gli ultimi tassi in `nb_cbo_currencies.current_rate`.

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| currency_code | VARCHAR | Codice valuta (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | Tasso rispetto all'USD |
| effective_date | DATE | Data di decorrenza |
| source | VARCHAR | Fonte: manual/api |
| createdAt | TIMESTAMP | Orario di creazione |

> **Nota**: I preventivi sono associati alla collezione `nb_cbo_currencies` tramite la chiave esterna `currency_id`, e il tasso di cambio viene recuperato direttamente dal campo `current_rate`. Le opportunità e gli ordini utilizzano un campo VARCHAR `currency` per memorizzare il codice della valuta.

#### Modello dei campi importo

Le collezioni contenenti importi seguono questo modello:

| Campo | Tipo | Descrizione |
|-----|------|------|
| currency | VARCHAR | Valuta della transazione |
| amount | DECIMAL | Importo originale |
| exchange_rate | DECIMAL | Tasso di cambio rispetto all'USD al momento della transazione |
| amount_usd | DECIMAL | Equivalente in USD (calcolato) |

**Applicato a:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### Integrazione del flusso di lavoro
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**Logica di recupero del tasso di cambio:**
1. Recuperare il tasso di cambio direttamente da `nb_cbo_currencies.current_rate` durante le operazioni aziendali.
2. Transazioni in USD: Tasso = 1.0, nessuna ricerca richiesta.
3. `current_rate` viene sincronizzato da un'attività pianificata dall'ultimo record di `nb_crm_exchange_rates`.

### 6.4 Gestione delle versioni

Quando un preventivo viene rifiutato o scade, può essere duplicato come nuova versione:

```
QT-20260119-001 v1 → Rifiutato
QT-20260119-001 v2 → Inviato
QT-20260119-001 v3 → Accettato
```

---

## 7. Ciclo di vita degli ordini

### 7.1 Panoramica degli ordini

Gli ordini vengono creati quando un preventivo viene accettato, rappresentando un impegno aziendale confermato.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 Definizioni degli stati dell'ordine

| Stato | Codice | Descrizione | Azioni consentite |
|-----|------|------|---------|
| Bozza | `draft` | Ordine creato, non ancora confermato | Modifica, Conferma, Annulla |
| Confermato | `confirmed` | Ordine confermato, in attesa di evasione | Inizia evasione, Annulla |
| In corso | `in_progress` | Ordine in fase di elaborazione/produzione | Aggiorna stato, Spedisci, Annulla (richiede approvazione) |
| Spedito | `shipped` | Prodotti spediti al cliente | Contrassegna come consegnato |
| Consegnato | `delivered` | Il cliente ha ricevuto la merce | Completa ordine |
| Completato | `completed` | Ordine completamente terminato | Nessuna |
| Annullato | `cancelled` | Ordine annullato | Nessuna |

### 7.3 Modello dati dell'ordine

#### nb_crm_orders

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| order_no | VARCHAR | Numero ordine (generato automaticamente, unico) |
| customer_id | BIGINT | Cliente (FK) |
| contact_id | BIGINT | Contatto (FK) |
| opportunity_id | BIGINT | Opportunità (FK) |
| quotation_id | BIGINT | Preventivo (FK) |
| owner_id | BIGINT | Responsabile (FK → users) |
| status | VARCHAR | Stato dell'ordine |
| payment_status | VARCHAR | Stato pagamento: unpaid/partial/paid |
| order_date | DATE | Data ordine |
| delivery_date | DATE | Data di consegna prevista |
| actual_delivery_date | DATE | Data di consegna effettiva |
| currency | VARCHAR | Valuta dell'ordine |
| exchange_rate | DECIMAL | Tasso rispetto all'USD |
| order_amount | DECIMAL | Importo totale ordine |
| paid_amount | DECIMAL | Importo pagato |
| unpaid_amount | DECIMAL | Importo non pagato |
| shipping_address | TEXT | Indirizzo di spedizione |
| logistics_company | VARCHAR | Società di logistica |
| tracking_no | VARCHAR | Numero di tracciamento |
| terms_condition | TEXT | Termini e condizioni |
| description | TEXT | Descrizione |

#### nb_crm_order_items

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| order_id | FK | Ordine padre |
| product_id | FK | Riferimento prodotto |
| product_name | VARCHAR | Snapshot del nome prodotto |
| quantity | INT | Quantità ordinata |
| unit_price | DECIMAL | Prezzo unitario |
| discount_percent | DECIMAL | Percentuale di sconto |
| line_total | DECIMAL | Totale della riga |
| notes | TEXT | Note della riga |

### 7.4 Monitoraggio dei pagamenti

#### nb_crm_payments

| Campo | Tipo | Descrizione |
|-----|------|------|
| id | BIGINT | Chiave primaria |
| order_id | BIGINT | Ordine associato (FK, obbligatorio) |
| customer_id | BIGINT | Cliente (FK) |
| payment_no | VARCHAR | N. pagamento (generato automaticamente, unico) |
| amount | DECIMAL | Importo pagamento (obbligatorio) |
| currency | VARCHAR | Valuta pagamento |
| payment_method | VARCHAR | Metodo: transfer/check/cash/credit_card/lc |
| payment_date | DATE | Data pagamento |
| bank_account | VARCHAR | Numero conto bancario |
| bank_name | VARCHAR | Nome banca |
| notes | TEXT | Note di pagamento |

---

## 8. Ciclo di vita dei clienti

### 8.1 Panoramica dei clienti

I clienti vengono creati durante la conversione dei lead o quando un'opportunità viene vinta. Il sistema traccia l'intero ciclo di vita, dall'acquisizione alla fidelizzazione (advocacy).
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 Definizioni degli stati del cliente

| Stato | Codice | Salute | Descrizione |
|-----|------|--------|------|
| Prospect | `prospect` | N/D | Lead convertito, nessun ordine ancora |
| Attivo | `active` | ≥70 | Cliente pagante, buona interazione |
| In crescita | `growing` | ≥80 | Cliente con opportunità di espansione |
| A rischio | `at_risk` | <50 | Cliente che mostra segni di abbandono |
| Abbandonato | `churned` | N/D | Non più attivo |
| Recupero | `win_back` | N/D | Ex cliente in fase di riattivazione |
| Sostenitore | `advocate` | ≥90 | Alta soddisfazione, fornisce referenze |

### 8.3 Punteggio di salute del cliente

La salute del cliente viene calcolata in base a molteplici fattori:

| Fattore | Peso | Metrica |
|-----|------|---------|
| Recency d'acquisto | 25% | Giorni dall'ultimo ordine |
| Frequenza d'acquisto | 20% | Numero di ordini per periodo |
| Valore monetario | 20% | Valore totale e medio dell'ordine |
| Coinvolgimento | 15% | Tassi di apertura e-mail, partecipazione a riunioni |
| Salute del supporto | 10% | Volume dei ticket e tasso di risoluzione |
| Utilizzo del prodotto | 10% | Metriche di utilizzo attivo (se applicabile) |

**Soglie di salute:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 Segmentazione dei clienti

#### Segmentazione automatizzata

| Segmento | Condizione | Azione suggerita |
|-----|------|---------|
| VIP | LTV > $100K | Servizio "guanti bianchi", sponsorizzazione esecutiva |
| Enterprise | Dimensione azienda > 500 | Account Manager dedicato |
| Mid-Market | Dimensione azienda 50-500 | Check-in regolari, supporto scalabile |
| Startup | Dimensione azienda < 50 | Risorse self-service, community |
| Dormiente | 90+ giorni senza attività | Marketing di riattivazione |

---

## 9. Integrazione e-mail

### 9.1 Panoramica

NocoBase fornisce un plugin di integrazione e-mail integrato che supporta Gmail e Outlook. Una volta sincronizzate le e-mail, i flussi di lavoro possono attivare automaticamente l'analisi IA del sentiment e dell'intento delle e-mail, aiutando i venditori a comprendere rapidamente l'atteggiamento dei clienti.

### 9.2 Sincronizzazione e-mail

**Provider supportati:**
- Gmail (tramite OAuth 2.0)
- Outlook/Microsoft 365 (tramite OAuth 2.0)

**Comportamento della sincronizzazione:**
- Sincronizzazione bidirezionale delle e-mail inviate e ricevute.
- Associazione automatica delle e-mail ai record CRM (Lead, Contatti, Opportunità).
- Allegati memorizzati nel file system di NocoBase.

### 9.3 Associazione E-mail-CRM (da finalizzare)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 Modelli di e-mail

I venditori possono utilizzare modelli preimpostati:

| Categoria modello | Esempi |
|---------|------|
| Primo contatto | E-mail a freddo, Introduzione calorosa, Follow-up evento |
| Follow-up | Follow-up riunione, Follow-up proposta, Sollecito per mancata risposta |
| Preventivo | Preventivo allegato, Revisione preventivo, Preventivo in scadenza |
| Ordine | Conferma ordine, Notifica spedizione, Conferma consegna |
| Customer Success | Benvenuto, Check-in, Richiesta recensione |

---

## 10. Funzionalità assistite dall'IA

### 10.1 Team di dipendenti IA

Il sistema CRM integra il plugin NocoBase AI, utilizzando i seguenti dipendenti IA integrati configurati con compiti specifici per il CRM:

| ID | Nome | Ruolo integrato | Funzionalità di estensione CRM |
|----|------|---------|-------------|
| viz | Viz | Analista dati | Analisi dei dati di vendita, previsione della pipeline |
| dara | Dara | Esperto grafici | Visualizzazione dati, sviluppo report, design dashboard |
| ellis | Ellis | Editor | Bozza risposte e-mail, riepiloghi comunicazioni, bozza e-mail aziendali |
| lexi | Lexi | Traduttore | Comunicazione clienti multilingue, traduzione contenuti |
| orin | Orin | Organizzatore | Priorità giornaliere, suggerimenti per i prossimi passi, pianificazione follow-up |

### 10.2 Elenco dei compiti IA

Le funzionalità IA sono divise in due categorie indipendenti:

#### I. Dipendenti IA (attivati da blocchi frontend)

Gli utenti interagiscono direttamente con l'IA tramite i blocchi frontend "Dipendente IA" per ottenere analisi e suggerimenti.

| Dipendente | Compito | Descrizione |
|------|------|------|
| Viz | Analisi dati vendita | Analizza i trend della pipeline e i tassi di conversione |
| Viz | Previsione pipeline | Prevede le entrate in base alla pipeline ponderata |
| Dara | Generazione grafici | Genera grafici per i report di vendita |
| Dara | Design dashboard | Progetta i layout delle dashboard dati |
| Ellis | Bozza risposte | Genera risposte e-mail professionali |
| Ellis | Riepilogo comunicazioni | Riassume le discussioni via e-mail |
| Ellis | Bozza e-mail aziendali | Inviti a riunioni, follow-up, e-mail di ringraziamento, ecc. |
| Orin | Priorità giornaliere | Genera un elenco di attività prioritarie per la giornata |
| Orin | Prossima migliore azione | Raccomanda i passi successivi per ogni opportunità |
| Lexi | Traduzione contenuti | Traduce materiali di marketing, proposte ed e-mail |

#### II. Nodi LLM del flusso di lavoro (esecuzione automatizzata backend)

Nodi LLM inseriti nei flussi di lavoro, attivati automaticamente da eventi delle collezioni, eventi di azione o attività pianificate, indipendentemente dai Dipendenti IA.

| Compito | Metodo di attivazione | Descrizione | Campo di destinazione |
|------|---------|------|---------|
| Punteggio lead | Evento collezione (Crea/Aggiorna) | Valuta la qualità del lead | ai_score, ai_convert_prob |
| Previsione probabilità vincita | Evento collezione (Cambio fase) | Prevede la probabilità di successo dell'opportunità | ai_win_probability, ai_risk_factors |

> **Nota**: I nodi LLM del flusso di lavoro utilizzano prompt e output Schema per JSON strutturato, che viene analizzato e scritto nei campi dati aziendali senza l'intervento dell'utente.

### 10.3 Campi IA nel database

| Tabella | Campo IA | Descrizione |
|----|--------|------|
| nb_crm_leads | ai_score | Punteggio IA 0-100 |
| | ai_convert_prob | Probabilità di conversione |
| | ai_best_contact_time | Miglior orario di contatto |
| | ai_tags | Tag generati dall'IA (JSONB) |
| | ai_scored_at | Orario del punteggio |
| | ai_next_best_action | Suggerimento per la prossima migliore azione |
| | ai_nba_generated_at | Orario di generazione del suggerimento |
| nb_crm_opportunities | ai_win_probability | Probabilità di vincita prevista dall'IA |
| | ai_analyzed_at | Orario dell'analisi |
| | ai_confidence | Confidenza della previsione |
| | ai_trend | Trend: up/stable/down |
| | ai_risk_factors | Fattori di rischio (JSONB) |
| | ai_recommendations | Elenco suggerimenti (JSONB) |
| | ai_predicted_close | Data di chiusura prevista |
| | ai_next_best_action | Suggerimento per la prossima migliore azione |
| | ai_nba_generated_at | Orario di generazione del suggerimento |
| nb_crm_customers | ai_health_score | Punteggio salute 0-100 |
| | ai_health_grade | Grado di salute: A/B/C/D |
| | ai_churn_risk | Rischio abbandono 0-100% |
| | ai_churn_risk_level | Livello rischio abbandono: low/medium/high |
| | ai_health_dimensions | Punteggi delle dimensioni (JSONB) |
| | ai_recommendations | Elenco suggerimenti (JSONB) |
| | ai_health_assessed_at | Orario valutazione salute |
| | ai_tags | Tag generati dall'IA (JSONB) |
| | ai_best_contact_time | Miglior orario di contatto |
| | ai_next_best_action | Suggerimento per la prossima migliore azione |
| | ai_nba_generated_at | Orario di generazione del suggerimento |

---

## 11. Motore del flusso di lavoro

### 11.1 Flussi di lavoro implementati

| Nome flusso di lavoro | Tipo di attivazione | Stato | Descrizione |
|-----------|---------|------|------|
| Leads Created | Evento collezione | Abilitato | Attivato quando viene creato un lead |
| CRM Overall Analytics | Evento Dipendente IA | Abilitato | Analisi complessiva dei dati CRM |
| Lead Conversion | Evento post-azione | Abilitato | Processo di conversione del lead |
| Lead Assignment | Evento collezione | Abilitato | Assegnazione automatizzata dei lead |
| Lead Scoring | Evento collezione | Disabilitato | Punteggio dei lead (da finalizzare) |
| Follow-up Reminder | Attività pianificata | Disabilitato | Promemoria di follow-up (da finalizzare) |

### 11.2 Flussi di lavoro da implementare

| Flusso di lavoro | Tipo di attivazione | Descrizione |
|-------|---------|------|
| Avanzamento fase opportunità | Evento collezione | Aggiorna la probabilità di vincita e registra l'orario al cambio di fase |
| Rilevamento stagnazione opportunità | Attività pianificata | Rileva opportunità inattive e invia promemoria |
| Approvazione preventivo | Evento post-azione | Processo di approvazione a più livelli |
| Generazione ordine | Evento post-azione | Genera automaticamente l'ordine dopo l'accettazione del preventivo |

---

## 12. Design del menu e dell'interfaccia

### 12.1 Struttura dell'amministrazione

| Menu | Tipo | Descrizione |
|------|------|------|
| **Dashboards** | Gruppo | Dashboard |
| - Dashboard | Pagina | Dashboard predefinita |
| - SalesManager | Pagina | Vista Sales Manager |
| - SalesRep | Pagina | Vista Sales Rep |
| - Executive | Pagina | Vista Executive |
| **Leads** | Pagina | Gestione Lead |
| **Customers** | Pagina | Gestione Clienti |
| **Opportunities** | Pagina | Gestione Opportunità |
| - Table | Tab | Elenco opportunità |
| **Products** | Pagina | Gestione Prodotti |
| - Categories | Tab | Categorie prodotti |
| **Orders** | Pagina | Gestione Ordini |
| **Settings** | Gruppo | Impostazioni |
| - Stage Settings | Pagina | Configurazione fasi opportunità |
| - Exchange Rate | Pagina | Impostazioni tassi di cambio |
| - Activity | Pagina | Record delle attività |
| - Emails | Pagina | Gestione e-mail |
| - Contacts | Pagina | Gestione contatti |
| - Data Analysis | Pagina | Analisi dei dati |

### 12.2 Viste della dashboard

#### Vista Sales Manager

| Componente | Tipo | Dati |
|-----|------|------|
| Valore pipeline | Scheda KPI | Importo totale pipeline per fase |
| Classifica team | Tabella | Classifica delle prestazioni dei venditori |
| Avvisi di rischio | Elenco avvisi | Opportunità ad alto rischio |
| Trend tasso vincita | Grafico a linee | Tasso di vincita mensile |
| Trattative stagnanti | Elenco | Trattative che richiedono attenzione |

#### Vista Sales Rep

| Componente | Tipo | Dati |
|-----|------|------|
| Progresso mia quota | Barra di progresso | Effettivo mensile vs Quota |
| Opportunità in sospeso | Scheda KPI | Numero delle mie opportunità in sospeso |
| In chiusura questa settimana | Elenco | Trattative la cui chiusura è prevista a breve |
| Attività scadute | Avviso | Compiti scaduti |
| Azioni rapide | Pulsanti | Registra attività, Crea opportunità |

#### Vista Executive

| Componente | Tipo | Dati |
|-----|------|------|
| Entrate annuali | Scheda KPI | Entrate da inizio anno |
| Valore pipeline | Scheda KPI | Importo totale della pipeline |
| Tasso di vincita | Scheda KPI | Tasso di vincita complessivo |
| Salute dei clienti | Distribuzione | Distribuzione del punteggio di salute |
| Previsione | Grafico | Previsione delle entrate mensili |

---

*Versione documento: v2.0 | Aggiornato il: 06-02-2026*