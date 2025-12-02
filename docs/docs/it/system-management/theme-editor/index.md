:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Editor di Temi

> La funzionalità del tema attuale è implementata basandosi sulla versione 5.x di Ant Design. Si consiglia di leggere i concetti relativi alla [personalizzazione del tema](https://ant.design/docs/react/customize-theme-cn#%E8%87%AA%E5%AE%9A%E4%B9%89%E4%B8%BB%E9%A2%98) prima di procedere con questo documento.

## Introduzione

Il plugin Editor di Temi serve a modificare gli stili dell'intera pagina front-end. Attualmente, supporta la modifica globale di [SeedToken](https://ant.design/docs/react/customize-theme-cn#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme-cn#maptoken) e [AliasToken](https://ant.design/docs/react/customize-theme-cn#aliastoken), oltre a permettere il [passaggio](https://ant.design/docs/react/customize-theme-cn#%E4%BD%BF%E7%94%A8%E9%A2%84%E8%AE%BE%E7%AE%97%E6%B3%95) alla `Modalità Scura` e alla `Modalità Compatta`. In futuro, potrebbe essere introdotto il supporto per la personalizzazione del tema a [livello di componente](https://ant.design/docs/react/customize-theme-cn#%E4%BF%AE%E6%94%B9%E7%BB%84%E4%BB%B6%E5%8F%98%E9%87%8F-component-token).

## Istruzioni per l'Uso

### Abilitare il plugin Editor di Temi

Per prima cosa, aggiorni NocoBase all'ultima versione (v0.11.1 o superiore). Successivamente, nella pagina di gestione dei plugin, cerchi la scheda `Editor di Temi`. Clicchi sul pulsante `Abilita` nell'angolo in basso a destra della scheda e attenda il ricaricamento della pagina.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Accedere alla pagina di configurazione del tema

Dopo aver abilitato il plugin, clicchi sul pulsante delle impostazioni nell'angolo in basso a sinistra della scheda per accedere alla pagina di modifica del tema. Per impostazione predefinita, sono disponibili quattro opzioni di tema: `Tema Predefinito`, `Tema Scuro`, `Tema Compatto` e `Tema Scuro Compatto`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Aggiungere un nuovo tema

Clicchi sul pulsante `Aggiungi Nuovo Tema` e selezioni `Crea un Tema Completamente Nuovo`. Sulla destra della pagina si aprirà un Editor di Temi, che Le permetterà di modificare opzioni come `Colori`, `Dimensioni` e `Stili`. Una volta completata la modifica, inserisca un nome per il tema e clicchi su Salva per completare la creazione del tema.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Applicare un nuovo tema

Sposti il mouse nell'angolo in alto a destra della pagina per visualizzare il selettore del tema. Clicchi su di esso per passare ad altri temi, come ad esempio quello appena aggiunto.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Modificare un tema esistente

Clicchi sul pulsante `Modifica` nell'angolo in basso a sinistra della scheda. Sulla destra della pagina si aprirà un Editor di Temi (identico a quello utilizzato per aggiungere un nuovo tema). Una volta completata la modifica, clicchi su Salva per salvare le modifiche al tema.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Impostare i temi selezionabili dall'utente

I temi appena aggiunti sono selezionabili dagli utenti per impostazione predefinita. Se non desidera che gli utenti possano passare a un determinato tema, può disattivare l'interruttore `Selezionabile dall'utente` nell'angolo in basso a destra della scheda del tema, impedendo così agli utenti di selezionare quel tema.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Impostare come tema predefinito

Nello stato iniziale, il tema predefinito è `Tema Predefinito`. Se desidera impostare un tema specifico come predefinito, può attivare l'interruttore `Tema Predefinito` nell'angolo in basso a destra della scheda del tema. In questo modo, quando gli utenti apriranno la pagina per la prima volta, visualizzeranno quel tema. Nota: Il tema predefinito non può essere eliminato.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Eliminare un tema

Clicchi sul pulsante `Elimina` sotto la scheda, quindi confermi nella finestra di dialogo a comparsa per eliminare il tema.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)