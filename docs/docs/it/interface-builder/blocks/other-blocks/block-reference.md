---
pkg: "@nocobase/plugin-block-reference"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Blocco di Riferimento

## Introduzione
Il blocco di riferimento Le consente di visualizzare un blocco esistente direttamente nella pagina corrente, specificando l'UID del blocco di destinazione. Non è necessario riconfigurare il blocco.

## Attivare il plugin
Questo plugin è integrato, ma disabilitato per impostazione predefinita.
Apra "Gestione plugin" → cerchi "Blocco: Riferimento" → clicchi su "Abilita".

![Abilita blocco di riferimento (Gestione plugin)](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Come aggiungere il blocco
1) Aggiunga un blocco → gruppo "Altri blocchi" → selezioni "Blocco di riferimento".  
2) Nelle "Impostazioni di riferimento", configuri:
   - `UID del blocco`: l'UID del blocco di destinazione
   - `Modalità di riferimento`: scelga `Riferimento` o `Copia`

![Dimostrazione di aggiunta e configurazione del blocco di riferimento](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Come ottenere l'UID del blocco
- Apra il menu delle impostazioni del blocco di destinazione e clicchi su `Copia UID` per copiarne l'UID.

![Esempio di copia dell'UID del blocco](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modalità e comportamento
- `Riferimento` (predefinito)
  - Condivide la stessa configurazione del blocco originale; le modifiche apportate al blocco originale o a qualsiasi punto di riferimento aggiorneranno tutte le istanze di riferimento.

- `Copia`
  - Crea un blocco indipendente identico all'originale al momento della copia; le modifiche successive non si sincronizzano tra loro.

## Configurazione
- Blocco di riferimento:
  - "Impostazioni di riferimento": per specificare l'UID del blocco di destinazione e scegliere la modalità "Riferimento/Copia";
  - Verranno visualizzate anche le impostazioni complete del blocco di riferimento stesso (equivalente alla configurazione diretta del blocco originale).

![Interfaccia di configurazione del blocco di riferimento](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Blocco copiato:
  - Il nuovo blocco ha lo stesso tipo dell'originale e contiene solo le proprie impostazioni;
  - Non include più le "Impostazioni di riferimento".

## Stati di errore e fallback
- Obiettivo mancante/non valido: viene visualizzato un messaggio di errore. È possibile ridefinire l'UID del blocco nelle impostazioni del blocco di riferimento (Impostazioni di riferimento → UID del blocco) e salvare per ripristinare la visualizzazione.  

![Stato di errore quando il blocco di destinazione non è valido](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Note e limitazioni
- Funzionalità sperimentale: utilizzare con cautela negli ambienti di produzione.
- Durante la copia, alcune configurazioni che dipendono dall'UID di destinazione potrebbero richiedere una riconfigurazione.
- Tutte le configurazioni di un blocco di riferimento vengono sincronizzate automaticamente, inclusi aspetti come l'ambito dei dati. Tuttavia, un blocco di riferimento può avere una propria [configurazione del flusso di eventi](/interface-builder/event-flow/). Tramite i flussi di eventi e le azioni JavaScript personalizzate, è possibile ottenere indirettamente ambiti di dati o configurazioni correlate diversi per ciascun riferimento.