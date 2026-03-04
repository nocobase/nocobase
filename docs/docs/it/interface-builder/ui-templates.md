---
pkg: "@nocobase/plugin-ui-templates"
---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/ui-templates).
:::

# Template UI

## Introduzione

I template dell'interfaccia utente (UI) vengono utilizzati per riutilizzare le configurazioni nella creazione delle interfacce, riducendo le attività ripetitive e mantenendo sincronizzate le configurazioni in più punti quando necessario.

Attualmente, i tipi di template supportati includono:

- **Template di blocco**: per riutilizzare l'intera configurazione di un blocco.
- **Template di campo**: per riutilizzare la configurazione dell'"area dei campi" nei blocchi modulo o dettagli.
- **Template di popup**: per riutilizzare le configurazioni dei popup attivati da azioni o campi.

## Concetti chiave

### Riferimento e Copia

Esistono solitamente due modi per utilizzare i template:

- **Riferimento**: più punti condividono la stessa configurazione del template; la modifica del template o di un qualsiasi punto di riferimento aggiornerà simultaneamente tutti gli altri punti di riferimento.
- **Copia**: duplica il template come configurazione indipendente; le modifiche successive non si influenzeranno a vicenda.

### Salva come template

Quando un blocco o un popup è già configurato, è possibile utilizzare l'opzione `Salva come template` nel suo menu delle impostazioni e scegliere la modalità di salvataggio:

- **Converti l'attuale... in template**: dopo il salvataggio, la posizione corrente passerà all'utilizzo del riferimento a quel template.
- **Copia l'attuale... come template**: crea solo il template, mentre la posizione corrente rimane invariata.

## Template di blocco

### Salvare un blocco come template

1) Apra il menu delle impostazioni del blocco di destinazione e clicchi su `Salva come template`.  
2) Inserisca il `Nome template` / `Descrizione template` e scelga la modalità di salvataggio:
   - **Converti il blocco corrente in template**: dopo il salvataggio, la posizione corrente verrà sostituita da un blocco `Template di blocco` (ovvero, un riferimento a quel template).
   - **Copia il blocco corrente come template**: crea solo il template, il blocco corrente rimane invariato.

![save-as-template-block-20251228](https://static-docs.nocobase.com/save-as-template-block-20251228.png)

![save-as-template-block-full-20251228](https://static-docs.nocobase.com/save-as-template-block-full-20251228.png)

### Usare un template di blocco

1) Aggiungi blocco → "Altri blocchi" → `Template di blocco`.  
2) Nella configurazione, selezioni:
   - `Template`: scelga un template.
   - `Modalità`: `Riferimento` o `Copia`.

![block-template-menu-20251228](https://static-docs.nocobase.com/block-template-menu-20251228.png)

![select-block-template-20251228](https://static-docs.nocobase.com/select-block-template-20251228.png)

### Convertire un riferimento in copia

Quando un blocco fa riferimento a un template, può utilizzare l'opzione `Converti riferimento in copia` nel menu delle impostazioni del blocco per trasformarlo in un blocco normale (scollegando il riferimento); le modifiche successive saranno indipendenti.

![convert-block-template-duplicate-20251228](https://static-docs.nocobase.com/convert-block-template-duplicate-20251228.png)

### Note

- La modalità `Copia` rigenererà gli UID per il blocco e i suoi nodi figli; alcune configurazioni che dipendono dagli UID potrebbero dover essere riconfigurate.

## Template di campo

I template di campo vengono utilizzati per riutilizzare le configurazioni dell'area dei campi (selezione dei campi, layout e impostazioni dei campi) nei **blocchi modulo** e nei **blocchi dettagli**, evitando l'aggiunta ripetitiva di campi in più pagine o blocchi.

> I template di campo agiscono solo sull'"area dei campi" e non sostituiscono l'intero blocco. Per riutilizzare un intero blocco, utilizzi il Template di blocco descritto sopra.

### Usare i template di campo nei blocchi modulo/dettagli

1) Entri in modalità configurazione, apra il menu "Campi" in un blocco modulo o dettagli.  
2) Selezioni `Template di campo`.  
3) Scelga un template e selezioni la modalità: `Riferimento` o `Copia`.

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)

![use-field-template-config-20251228](https://static-docs.nocobase.com/use-field-template-config-20251228.png)

#### Avviso di sovrascrittura

Quando nel blocco sono già presenti dei campi, l'uso della modalità **Riferimento** solitamente richiederà una conferma (poiché i campi referenziati sostituiranno l'area dei campi corrente).

### Convertire i campi referenziati in copia

Quando un blocco fa riferimento a un template di campo, può utilizzare l'opzione `Converti i campi referenziati in copia` nel menu delle impostazioni del blocco per rendere l'area dei campi corrente una configurazione indipendente (scollegando il riferimento).

![convert-field-template-duplicate-20251228](https://static-docs.nocobase.com/convert-field-template-duplicate-20251228.png)

### Note

- I template di campo si applicano solo ai **blocchi modulo** e ai **blocchi dettagli**.
- Se il template e il blocco corrente sono associati a tabelle dati diverse, il template apparirà come non disponibile nel selettore con l'indicazione del motivo.
- Se desidera apportare "regolazioni personalizzate" ai campi nel blocco corrente, si consiglia di utilizzare direttamente la modalità `Copia` o di eseguire prima "Converti i campi referenziati in copia".

## Template di popup

I template di popup vengono utilizzati per riutilizzare un insieme di interfacce popup e logiche di interazione. Per le configurazioni generali come il metodo di apertura e le dimensioni del popup, consulti [Modifica popup](/interface-builder/actions/action-settings/edit-popup).

### Salvare un popup come template

1) Apra il menu delle impostazioni di un pulsante o campo che può attivare un popup e clicchi su `Salva come template`.  
2) Inserisca il nome e la descrizione del template e scelga la modalità di salvataggio:
   - **Converti il popup corrente in template**: dopo il salvataggio, il popup corrente passerà al riferimento a quel template.
   - **Copia il popup corrente come template**: crea solo il template, il popup corrente rimane invariato.

![save-as-template-popup-20251228](https://static-docs.nocobase.com/save-as-template-popup-20251228.png)

### Usare un template nella configurazione del popup

1) Apra la configurazione del popup del pulsante o del campo.  
2) Selezioni un template in `Template di popup` per riutilizzarlo.

![edit-popup-select-20251228](https://static-docs.nocobase.com/edit-popup-select-20251228.png)

### Condizioni di utilizzo (Ambito di disponibilità del template)

I template di popup sono legati allo scenario d'azione che attiva il popup. Il selettore filtrerà o disabiliterà automaticamente i template incompatibili in base allo scenario corrente (mostrando i motivi quando le condizioni non sono soddisfatte).

| Tipo di azione corrente | Template di popup disponibili |
| --- | --- |
| **Azione di collezione** | Template di popup creati da azioni di collezione della stessa collezione |
| **Azione record non associata** | Template di popup creati da azioni di collezione o azioni record non associate della stessa collezione |
| **Azione record associata** | Template di popup creati da azioni di collezione o azioni record non associate della stessa collezione; oppure template di popup creati da azioni record associate dello stesso campo di associazione |

### Popup di dati relazionali

I popup attivati da dati relazionali (campi di associazione) hanno regole di corrispondenza speciali:

#### Corrispondenza rigorosa per i template di popup associati

Quando un template di popup viene creato da un'**azione record associata** (il template possiede un `associationName`), tale template può essere utilizzato solo da azioni o campi con lo **stesso identico campo di associazione**.

Ad esempio: un template di popup creato sul campo di associazione `Ordine.Cliente` può essere utilizzato solo da altre azioni del campo di associazione `Ordine.Cliente`. Non può essere utilizzato dal campo di associazione `Ordine.Referente` (anche se entrambi puntano alla stessa tabella dati `Cliente`).

Questo accade perché le variabili interne e le configurazioni dei template di popup associati dipendono dallo specifico contesto della relazione di associazione.

#### Azioni di associazione che riutilizzano i template della collezione di destinazione

I campi o le azioni di associazione possono riutilizzare **template di popup non associati della tabella dati di destinazione** (template creati da azioni di collezione o azioni record non associate), purché la tabella dati corrisponda.

Ad esempio: il campo di associazione `Ordine.Cliente` può utilizzare i template di popup della tabella dati `Cliente`. Questo approccio è utile per condividere la stessa configurazione di popup tra più campi di associazione (come un popup unificato per i dettagli del cliente).

### Convertire un riferimento in copia

Quando un popup fa riferimento a un template, può utilizzare `Converti riferimento in copia` nel menu delle impostazioni per rendere il popup corrente una configurazione indipendente (scollegando il riferimento).

![convert-popup-to-duplicate-20251228](https://static-docs.nocobase.com/convert-popup-to-duplicate-20251228.png)


## Gestione dei template

In Impostazioni di sistema → `Template UI`, è possibile visualizzare e gestire tutti i template:

- **Template di blocco (v2)**: gestisce i template di blocco.
- **Template di popup (v2)**: gestisce i template di popup.

> I template di campo derivano dai template di blocco e vengono gestiti all'interno di essi.

![block-template-list-20251228](https://static-docs.nocobase.com/block-template-list-20251228.png)

Operazioni supportate: Visualizza, Filtra, Modifica, Elimina.

> **Nota**: se un template è attualmente referenziato, non può essere eliminato direttamente. Utilizzi prima `Converti riferimento in copia` nelle posizioni che referenziano quel template per scollegare il riferimento, quindi proceda all'eliminazione del template.