# Utilizzo della funzione "Stampa Modello" per generare contratti di fornitura e acquisto

Negli scenari di supply chain o commerciali, è spesso necessario generare rapidamente un "Contratto di Fornitura e Acquisto" standardizzato e popolare dinamicamente il suo contenuto basandosi su informazioni provenienti da **fonti dati** come acquirenti, venditori e dettagli dei prodotti. Di seguito, prenderemo come esempio un caso d'uso semplificato di "Contratto" per mostrarLe come configurare e utilizzare la funzione "Stampa Modello" per mappare le informazioni dei dati ai segnaposto nei modelli di contratto, generando così automaticamente il documento contrattuale finale.

---

## 1. Panoramica del Contesto e della Struttura dei Dati

Nel nostro esempio, esistono all'incirca le seguenti **collezioni** principali (omettendo altri campi irrilevanti):

- **parties**: Memorizza le informazioni sulle unità o persone della Parte A/Parte B, inclusi nome, indirizzo, referente, telefono, ecc.
- **contracts**: Memorizza i record specifici dei contratti, inclusi numero di contratto, chiavi esterne acquirente/venditore, informazioni sul firmatario, date di inizio/fine, conto bancario, ecc.
- **contract_line_items**: Utilizzata per salvare più voci sotto il contratto (nome del prodotto, specifiche, quantità, prezzo unitario, data di consegna, ecc.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Poiché il sistema attuale supporta solo la stampa di singoli record, faremo clic su "Stampa" nella pagina "Dettagli Contratto". Il sistema recupererà automaticamente il record del contratto corrispondente, insieme alle informazioni associate sulle parti e altri dettagli, e li inserirà nei documenti Word o PDF.

---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


## 2. Preparazione

### 2.1 Preparazione del **Plugin**

Si noti che il nostro **plugin** "Stampa Modello" è un **plugin** commerciale che deve essere acquistato e attivato prima di poter eseguire operazioni di stampa.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Conferma dell'attivazione del plugin:**

Su qualsiasi pagina, crei un blocco dettagli (ad esempio, per gli utenti) e verifichi se esiste un'opzione di configurazione del modello corrispondente nella configurazione delle azioni:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Creazione delle **Collezioni**

Crei le **collezioni** principali (entità, contratti e voci di prodotto) progettate in precedenza (selezioni solo i campi principali).

#### **Collezione** Contratti

| Categoria Campo | Nome Visualizzato Campo | Nome Campo | Interfaccia Campo |
|-----------------|-------------------------|------------|-------------------|
| **Campi PK & FK** | | | |
| | ID | id | Intero |
| | ID Acquirente | buyer_id | Intero |
| | ID Venditore | seller_id | Intero |
| **Campi di Associazione** | | | |
| | Voci del Contratto | contract_items | Uno a molti |
| | Acquirente (Parte A) | buyer | Molti a uno |
| | Venditore (Parte B) | seller | Molti a uno |
| **Campi Generali** | | | |
| | Numero Contratto | contract_no | Testo su riga singola |
| | Data Inizio Consegna | start_date | Data/Ora (con fuso orario) |
| | Data Fine Consegna | end_date | Data/Ora (con fuso orario) |
| | Percentuale di Acconto (%) | deposit_ratio | Percentuale |
| | Giorni di Pagamento Dopo la Consegna | payment_days_after | Intero |
| | Nome Conto Bancario (Beneficiario) | bank_account_name | Testo su riga singola |
| | Nome Banca | bank_name | Testo su riga singola |
| | Numero Conto Bancario (Beneficiario) | bank_account_number | Testo su riga singola |
| | Importo Totale | total_amount | Numero |
| | Codici Valuta | currency_codes | Selezione singola |
| | Percentuale di Saldo (%) | balance_ratio | Percentuale |
| | Giorni di Saldo Dopo la Consegna | balance_days_after | Intero |
| | Luogo di Consegna | delivery_place | Testo lungo |
| | Nome Firmatario Parte A | party_a_signatory_name | Testo su riga singola |
| | Titolo Firmatario Parte A | party_a_signatory_title | Testo su riga singola |
| | Nome Firmatario Parte B | party_b_signatory_name | Testo su riga singola |
| | Titolo Firmatario Parte B | party_b_signatory_title | Testo su riga singola |
| **Campi di Sistema** | | | |
| | Creato il | createdAt | Creato il |
| | Creato da | createdBy | Creato da |
| | Ultimo aggiornamento il | updatedAt | Ultimo aggiornamento il |
| | Ultimo aggiornamento da | updatedBy | Ultimo aggiornamento da |

#### **Collezione** Parti

| Categoria Campo | Nome Visualizzato Campo | Nome Campo | Interfaccia Campo |
|-----------------|-------------------------|------------|-------------------|
| **Campi PK & FK** | | | |
| | ID | id | Intero |
| **Campi Generali** | | | |
| | Nome della Parte | party_name | Testo su riga singola |
| | Indirizzo | address | Testo su riga singola |
| | Referente | contact_person | Testo su riga singola |
| | Telefono di Contatto | contact_phone | Telefono |
| | Posizione | position | Testo su riga singola |
| | Email | email | Email |
| | Sito web | website | URL |
| **Campi di Sistema** | | | |
| | Creato il | createdAt | Creato il |
| | Creato da | createdBy | Creato da |
| | Ultimo aggiornamento il | updatedAt | Ultimo aggiornamento il |
| | Ultimo aggiornamento da | updatedBy | Ultimo aggiornamento da |

#### **Collezione** Voci di Contratto

| Categoria Campo | Nome Visualizzato Campo | Nome Campo | Interfaccia Campo |
|-----------------|-------------------------|------------|-------------------|
| **Campi PK & FK** | | | |
| | ID | id | Intero |
| | ID Contratto | contract_id | Intero |
| **Campi di Associazione** | | | |
| | Contratto | contract | Molti a uno |
| **Campi Generali** | | | |
| | Nome Prodotto | product_name | Testo su riga singola |
| | Specifiche / Modello | spec | Testo su riga singola |
| | Quantità | quantity | Intero |
| | Prezzo Unitario | unit_price | Numero |
| | Importo Totale | total_amount | Numero |
| | Data di Consegna | delivery_date | Data/Ora (con fuso orario) |
| | Nota | remark | Testo lungo |
| **Campi di Sistema** | | | |
| | Creato il | createdAt | Creato il |
| | Creato da | createdBy | Creato da |
| | Ultimo aggiornamento il | updatedAt | Ultimo aggiornamento il |
| | Ultimo aggiornamento da | updatedBy | Ultimo aggiornamento da |

### 2.3 Configurazione dell'Interfaccia

**Inserimento di dati di esempio:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Configuri le regole di collegamento per calcolare automaticamente il prezzo totale e i pagamenti a saldo:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Crei un blocco di visualizzazione, confermi i dati e abiliti l'azione "Stampa Modello":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Configurazione del **Plugin** "Stampa Modello"

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Aggiunga una configurazione di modello, ad esempio "Contratto di Fornitura e Acquisto":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Successivamente, andiamo alla scheda "Elenco Campi", dove possiamo vedere tutti i campi dell'oggetto corrente. Dopo aver cliccato su "Copia", possiamo iniziare a compilare il modello.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Preparazione del File del Contratto

**File modello di contratto Word**

Prepari in anticipo il modello di contratto (file .docx), ad esempio: `SUPPLY AND PURCHASE CONTRACT.docx`

In questo esempio, forniamo una versione semplificata del "Contratto di Fornitura e Acquisto", che contiene segnaposto di esempio:

- `{d.contract_no}`: Numero del contratto
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Nomi di acquirente e venditore
- `{d.total_amount}`: Importo totale del contratto
- E altri segnaposto come "referente", "indirizzo", "telefono", ecc.

Successivamente, può copiare e incollare i campi dalla Sua **collezione** in Word.

---

## 3. Tutorial sulle Variabili del Modello

### 3.1 Compilazione di Variabili Base e Proprietà di Oggetti Associati

**Compilazione dei campi base:**

Ad esempio, il numero del contratto in alto, o l'oggetto dell'entità firmataria del contratto. Clicchiamo su copia e lo incolliamo direttamente nello spazio vuoto corrispondente nel contratto.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Formattazione dei Dati

#### Formattazione della Data

Nei modelli, spesso è necessario formattare i campi, in particolare quelli di data. Il formato di data copiato direttamente è solitamente lungo (ad esempio, Mer Gen 01 2025 00:00:00 GMT) e deve essere formattato per visualizzare lo stile desiderato.

Per i campi data, può utilizzare la funzione `formatD()` per specificare il formato di output:

```
{nome_campo:formatD(stile_formattazione)}
```

**Esempio:**

Ad esempio, se il campo originale che abbiamo copiato è `{d.created_at}`, e dobbiamo formattare la data nel formato `2025-01-01`, allora modifichiamo questo campo in:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Output: 2025-01-01
```

**Stili comuni di formattazione della data:**

- `YYYY` - Anno (quattro cifre)
- `MM` - Mese (due cifre)
- `DD` - Giorno (due cifre)
- `HH` - Ora (formato 24 ore)
- `mm` - Minuti
- `ss` - Secondi

**Esempio 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Output: 2025-01-01 14:30:00
```

#### Formattazione Numerica

Supponiamo che ci sia un campo importo, come `{d.total_amount}` nel contratto. Possiamo utilizzare la funzione `formatN()` per formattare i numeri, specificando le cifre decimali e il separatore delle migliaia.

**Sintassi:**

```
{nome_campo:formatN(cifre_decimali, separatore_migliaia)}
```

- **cifre_decimali**: Può specificare quante cifre decimali mantenere. Ad esempio, `2` indica due cifre decimali.
- **separatore_migliaia**: Specifica se utilizzare il separatore delle migliaia, solitamente `true` o `false`.

**Esempio 1: Formattare l'importo con separatore delle migliaia e due cifre decimali**

```
{d.amount:formatN(2, true)}  // Output: 1,234.56
```

Questo formatterà `d.amount` con due cifre decimali e aggiungerà un separatore delle migliaia.

**Esempio 2: Formattare l'importo come numero intero senza cifre decimali**

```
{d.amount:formatN(0, true)}  // Output: 1,235
```

Questo formatterà `d.amount` come numero intero e aggiungerà un separatore delle migliaia.

**Esempio 3: Formattare l'importo con due cifre decimali ma senza separatore delle migliaia**

```
{d.amount:formatN(2, false)}  // Output: 1234.56
```

Qui il separatore delle migliaia è disabilitato, mantenendo solo due cifre decimali.

**Altre esigenze di formattazione dell'importo:**

- **Simbolo di valuta**: Carbone non fornisce direttamente funzioni di formattazione del simbolo di valuta, ma può aggiungere simboli di valuta direttamente nei dati o nei modelli. Ad esempio:
  ```
  {d.amount:formatN(2, true)} EUR  // Output: 1,234.56 EUR
  ```

#### Formattazione delle Stringhe

Per i campi stringa, può utilizzare `:upperCase` per specificare il formato del testo, come la conversione del caso.

**Sintassi:**

```
{nome_campo:upperCase:altri_comandi}
```

**Metodi di conversione comuni:**

- `upperCase` - Converte in tutto maiuscolo
- `lowerCase` - Converte in tutto minuscolo
- `upperCase:ucFirst` - Capitalizza la prima lettera

**Esempio:**

```
{d.party_a_signatory_name:upperCase}  // Output: JOHN DOE
```

### 3.3 Stampa in Ciclo

#### Come stampare elenchi di oggetti figli (ad esempio, dettagli dei prodotti)

Quando dobbiamo stampare una tabella contenente più sotto-voci (ad esempio, dettagli dei prodotti), di solito è necessario utilizzare la stampa in ciclo. In questo modo, il sistema genererà una riga di contenuto per ogni voce nell'elenco fino a quando tutte le voci non saranno state elaborate.

Supponiamo di avere un elenco di prodotti (ad esempio, `contract_items`), che contiene più oggetti prodotto. Ogni oggetto prodotto ha più attributi, come nome del prodotto, specifiche, quantità, prezzo unitario, importo totale e note.

**Fase 1: Compilare i campi nella prima riga della tabella**

Innanzitutto, nella prima riga della tabella (non l'intestazione), copiamo e compiliamo direttamente le variabili del modello. Queste variabili verranno sostituite dai dati corrispondenti e visualizzate nell'output.

Ad esempio, la prima riga della tabella è la seguente:

| Nome Prodotto | Specifiche / Modello | Quantità | Prezzo Unitario | Importo Totale | Nota |
|---------------|----------------------|----------|-----------------|----------------|------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Qui, `d.contract_items[i]` rappresenta l'i-esima voce nell'elenco dei prodotti, e `i` è un indice che rappresenta l'ordine del prodotto corrente.

**Fase 2: Modificare l'indice nella seconda riga**

Successivamente, nella seconda riga della tabella, modifichiamo l'indice del campo in `i+1` e compiliamo solo il primo attributo. Questo perché durante la stampa in ciclo, dobbiamo recuperare la voce di dati successiva dall'elenco e visualizzarla nella riga successiva.

Ad esempio, la seconda riga viene compilata come segue:
| Nome Prodotto | Specifiche / Modello | Quantità | Prezzo Unitario | Importo Totale | Nota |
|---------------|----------------------|----------|-----------------|----------------|------|
| {d.contract_items[i+1].product_name} | | | | | |

In questo esempio, abbiamo cambiato `[i]` in `[i+1]`, in modo da poter ottenere i dati del prodotto successivo nell'elenco.

**Fase 3: Stampa in ciclo automatica durante il rendering del modello**

Quando il sistema elabora questo modello, opererà secondo la seguente logica:

1. La prima riga verrà compilata in base ai campi impostati nel modello.
2. Quindi, il sistema eliminerà automaticamente la seconda riga e inizierà a estrarre i dati da `d.contract_items`, compilando in ciclo ogni riga nel formato della tabella fino a quando tutti i dettagli del prodotto non saranno stati stampati.

L'`i` in ogni riga verrà incrementato, garantendo che ogni riga visualizzi informazioni diverse sul prodotto.

---

## 4. Caricamento e Configurazione del Modello di Contratto

### 4.1 Caricamento del Modello

1. Clicchi sul pulsante "Aggiungi modello" e inserisca il nome del modello, ad esempio "Modello Contratto di Fornitura e Acquisto".
2. Carichi il [file Word del contratto (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx) preparato, che contiene già tutti i segnaposto.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Una volta completato, il sistema elencherà il modello nell'elenco dei modelli disponibili per un uso futuro.
4. Clicchiamo su "Usa" per attivare questo modello.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

A questo punto, esca dalla finestra popup corrente e clicchi su "Scarica modello" per ottenere il modello completo generato.

**Consigli:**

- Se il modello utilizza `.doc` o altri formati, potrebbe essere necessario convertirlo in `.docx`, a seconda del supporto del **plugin**.
- Nei file Word, presti attenzione a non dividere i segnaposto in più paragrafi o caselle di testo, per evitare anomalie di rendering.

---

Con la funzione "Stampa Modello", potrà risparmiare notevolmente il lavoro ripetitivo nella gestione dei contratti, evitare errori di copia-incolla manuale e ottenere una produzione di contratti standardizzata e automatizzata. Le auguriamo un buon utilizzo!