:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/ai-employees/features/new-ai-employees).
:::

# Nuovo dipendente AI

Se i dipendenti AI predefiniti non soddisfano le Sue esigenze, può creare e personalizzare il Suo dipendente AI.

## Iniziare la creazione

Vada alla pagina di gestione `AI employees` e clicchi su `New AI employee`.

## Configurazione delle informazioni di base

Configuri quanto segue nella scheda `Profile`:

- `Username`: identificatore unico.
- `Nickname`: nome visualizzato.
- `Position`: descrizione della posizione lavorativa.
- `Avatar`: avatar del dipendente.
- `Bio`: breve introduzione.
- `About me`: prompt di sistema.
- `Greeting message`: messaggio di benvenuto della chat.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Impostazione del ruolo (Role setting)

Nella scheda `Role setting`, configuri il prompt di sistema (System Prompt) del dipendente. Questo contenuto definisce l'identità, gli obiettivi, i limiti operativi e lo stile di risposta del dipendente durante le conversazioni.

Si consiglia di includere almeno:

- Posizionamento del ruolo e ambito delle responsabilità.
- Principi di gestione dei compiti e struttura delle risposte.
- Azioni vietate, limiti delle informazioni e tono/stile.

È possibile inserire variabili (come l'utente corrente, il ruolo corrente, la lingua corrente, la data e l'ora) affinché il prompt si adatti automaticamente al contesto delle diverse sessioni.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Configurazione di competenze e conoscenze

Configuri i permessi delle competenze nella scheda `Skills`; se la funzionalità della base di conoscenza è stata abilitata, può continuare la configurazione nelle relative schede della base di conoscenza.

## Completare la creazione

Clicchi su `Submit` per completare la creazione.