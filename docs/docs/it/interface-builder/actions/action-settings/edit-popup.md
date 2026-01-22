:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Modifica Popup

## Introduzione

Qualsiasi azione o campo che, una volta cliccato, apre un popup, consente di configurarne la modalità di apertura, le dimensioni e altro ancora.

![20251027212617](https://static-docs.nocobase.com/20251027212617.png)

![20251027212800](https://static-docs.nocobase.com/20251027212800.png)

## Modalità di Apertura

- Cassetto

![20251027212832](https://static-docs.nocobase.com/20251027212832.png)

- Finestra di Dialogo

![20251027212905](https://static-docs.nocobase.com/20251027212905.png)

- Sottopagina

![20251027212940](https://static-docs.nocobase.com/20251027212940.png)

## Dimensioni del Popup

- Grande
- Media (predefinita)
- Piccola

## Popup UID

Il “Popup UID” è l'UID del componente che apre il popup; corrisponde anche al segmento `viewUid` nell'URL, ad esempio `view/:viewUid`. Può ottenerlo rapidamente dal campo o dal pulsante che attiva il popup, tramite il menu delle impostazioni, cliccando su “Copia Popup UID”. Impostare il Popup UID consente di riutilizzare i popup.

![popup-copy-uid-20251102](https://static-docs.nocobase.com/popup-copy-uid-20251102.png)

### Popup interno (predefinito)
- Il “Popup UID” è uguale all'UID del pulsante di azione corrente (per impostazione predefinita, utilizza l'UID di questo pulsante).

### Popup esterno (riutilizzo di un popup esistente)
- Inserisca l'UID di un altro pulsante (ovvero il Popup UID) nel campo “Popup UID” per riutilizzare quel popup altrove.
- Uso tipico: Condividere la stessa interfaccia utente e logica del popup tra più pagine/blocchi, evitando configurazioni duplicate.
- Quando si utilizza un popup esterno, alcune configurazioni non possono essere modificate (veda di seguito).

## Altre configurazioni correlate

- `Fonte dati / collezione`: Sola lettura. Indica la fonte dati e la collezione a cui il popup è collegato; per impostazione predefinita, utilizza la collezione del blocco corrente. In modalità popup esterno, segue la configurazione del popup di destinazione e non può essere modificato.
- `Nome associazione`: Opzionale. Utilizzato per aprire il popup da un campo di associazione; viene mostrato solo quando esiste un valore predefinito. In modalità popup esterno, segue la configurazione del popup di destinazione e non può essere modificato.
- `Source ID`: Appare solo quando è impostato il `Nome associazione`; per impostazione predefinita, utilizza il `sourceId` del contesto attuale; può essere modificato in una variabile o in un valore fisso, a seconda delle necessità.
- `filterByTk`: Può essere vuoto, una variabile opzionale o un valore fisso, utilizzato per limitare i record di dati caricati dal popup.

![popup-config-20251102](https://static-docs.nocobase.com/popup-config-20251102.png)