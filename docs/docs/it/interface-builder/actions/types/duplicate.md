---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/interface-builder/actions/types/duplicate).
:::

# Duplica

## Introduzione

L'azione Duplica consente agli utenti di creare rapidamente nuovi record basandosi su dati esistenti. Supporta due modalità di duplicazione: **Duplicazione diretta** e **Duplica nel modulo e continua la compilazione**.

## Installazione

Questo è un plugin integrato, non è richiesta alcuna installazione aggiuntiva.

## Modalità di duplicazione

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Duplicazione diretta

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Viene eseguita come "Duplicazione diretta" per impostazione predefinita;
- **Campi del modello**: Specifichi i campi da duplicare. È possibile selezionarli tutti. Questa configurazione è obbligatoria.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Una volta configurato, faccia clic sul pulsante per duplicare i dati.

### Duplica nel modulo e continua la compilazione

I campi del modello configurati verranno inseriti nel modulo come **valori predefiniti**. Gli utenti possono modificare questi valori prima dell'invio per completare la duplicazione.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Configurazione dei campi del modello**: Solo i campi selezionati verranno riportati come valori predefiniti.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Sincronizza campi del modulo

- Analizza automaticamente i campi già configurati nel blocco modulo corrente come campi del modello;
- Se i campi del blocco modulo vengono modificati in seguito (ad esempio, regolando i componenti dei campi di associazione), è necessario riaprire la configurazione del modello e fare clic su **Sincronizza campi del modulo** per garantire la coerenza.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

I dati del modello verranno inseriti come valori predefiniti del modulo e gli utenti potranno inviarli dopo la modifica per completare la duplicazione.

### Note supplementari

#### Duplicazione, Riferimento, Precaricamento

Diversi tipi di campi (tipi di associazione) hanno logiche di elaborazione differenti: **Duplicazione / Riferimento / Precaricamento**. Anche il **componente del campo** di un campo di associazione influenza questa logica:

- Selettore / Selettore di record: Utilizzato per il **Riferimento**
- Sotto-modulo / Sotto-tabella: Utilizzato per la **Duplicazione**

**Duplicazione**

- I campi regolari vengono duplicati;
- `hasOne` / `hasMany` possono essere solo duplicati (queste relazioni non dovrebbero utilizzare componenti di selezione come Selettore singolo o Selettore di record; dovrebbero invece utilizzare componenti Sotto-modulo o Sotto-tabella);
- La modifica del componente per `hasOne` / `hasMany` **non** cambierà la logica di elaborazione (rimane Duplicazione);
- Per i campi di associazione duplicati, tutti i sotto-campi possono essere selezionati.

**Riferimento**

- `belongsTo` / `belongsToMany` sono trattati come Riferimento;
- Se il componente del campo viene modificato da "Selettore singolo" a "Sotto-modulo", la relazione passa da **Riferimento a Duplicazione** (una volta diventata Duplicazione, tutti i sotto-campi diventano selezionabili).

**Precaricamento**

- I campi di associazione sotto un campo di Riferimento sono trattati come Precaricamento;
- I campi di precaricamento possono diventare Riferimento o Duplicazione dopo una modifica del componente.

#### Seleziona tutto

- Seleziona tutti i **campi di Duplicazione** e i **campi di Riferimento**.

#### I seguenti campi verranno esclusi dal record selezionato come modello di dati:

- Le chiavi primarie dei dati di associazione duplicati vengono filtrate; le chiavi primarie per Riferimento e Precaricamento non vengono filtrate;
- Chiavi esterne;
- Campi che non consentono duplicati (Unici);
- Campi di ordinamento;
- Campi di codifica automatica (Sequence);
- Password;
- Creato da, Creato il;
- Ultimo aggiornamento da, Ultimo aggiornamento il.

#### Sincronizza campi del modulo

- Analizza automaticamente i campi configurati nel blocco modulo corrente come campi del modello;
- Dopo aver modificato i campi del blocco modulo (ad esempio, regolando i componenti dei campi di associazione), è necessario sincronizzare nuovamente per garantire la coerenza.