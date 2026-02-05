---
pkg: "@nocobase/plugin-calendar"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Blocco Calendario

## Introduzione

Il Blocco Calendario Le permette di visualizzare e gestire eventi e dati correlati alle date in una vista a calendario. È ideale per la pianificazione di riunioni, l'organizzazione di attività ed eventi.

## Installazione

Questo plugin è preinstallato, quindi non è necessaria alcuna configurazione aggiuntiva.

## Aggiungere Blocchi

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Campo Titolo: Utilizzato per visualizzare le informazioni sulle barre del calendario. Attualmente, supporta tipi di campo come `input` (testo a riga singola), `select` (selezione singola), `phone`, `email`, `radioGroup` (gruppo di opzioni) e `sequence`. I tipi di campo titolo supportati possono essere estesi tramite plugin.
2.  Ora di Inizio: Indica l'ora di inizio dell'attività.
3.  Ora di Fine: Indica l'ora di fine dell'attività.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Cliccando su una barra dell'attività, la selezione viene evidenziata e si apre una finestra pop-up dettagliata.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opzioni di Configurazione del Blocco

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Visualizzare il Calendario Lunare

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Impostare l'Intervallo di Dati

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Per maggiori informazioni, consulti

### Impostare l'Altezza del Blocco

Esempio: Regolando l'altezza del blocco calendario degli ordini, non apparirà alcuna barra di scorrimento all'interno del blocco calendario.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Per maggiori informazioni, consulti

### Campo Colore di Sfondo

:::info{title=Suggerimento}
La versione di NocoBase deve essere v1.4.0-beta o superiore.
:::

Questa opzione può essere utilizzata per configurare il colore di sfondo degli eventi del calendario. Ecco come usarla:

1.  La tabella dei dati del calendario deve contenere un campo di tipo **selezione singola (Single select)** o **gruppo di opzioni (Radio group)**, e questo campo deve essere configurato con dei colori.
2.  Quindi, torni all'interfaccia di configurazione del blocco calendario e selezioni il campo appena configurato con i colori nel **Campo Colore di Sfondo**.
3.  Infine, può provare a selezionare un colore per un evento del calendario e cliccare su invia. Vedrà che il colore è stato applicato.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Giorno di Inizio Settimana

> Supportato dalla versione v1.7.7 e successive

Il blocco calendario supporta l'impostazione del giorno di inizio della settimana, permettendole di scegliere **Domenica** o **Lunedì** come primo giorno della settimana.
Il giorno di inizio predefinito è **Lunedì**, facilitando agli utenti l'adattamento della visualizzazione del calendario in base alle abitudini regionali per una migliore esperienza d'uso.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Configurare le Azioni

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Oggi

Il pulsante "Oggi" nel Blocco Calendario offre una navigazione rapida, consentendo agli utenti di tornare istantaneamente alla data corrente dopo aver esplorato altre date.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Cambiare Vista

La vista predefinita è impostata su Mese.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)