:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Anteprima e Salvataggio

*   **Anteprima**: Permette di visualizzare temporaneamente le modifiche apportate nel pannello di configurazione all'interno del grafico della pagina, per verificarne l'effetto.
*   **Salva**: Salva in modo permanente le modifiche apportate nel pannello di configurazione nel database.

## Punti di accesso

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   Nella modalità di configurazione grafica (Basic), le modifiche vengono applicate automaticamente all'anteprima per impostazione predefinita.
*   Nelle modalità SQL e Custom, dopo aver apportato le modifiche, può cliccare sul pulsante `Anteprima` a destra per visualizzarle.
*   Nella parte inferiore dell'intero pannello di configurazione, è disponibile un pulsante `Anteprima` unificato.

## Comportamento dell'anteprima
*   Visualizza temporaneamente la configurazione sulla pagina senza scriverla nel database. Dopo un aggiornamento della pagina o un'operazione di annullamento, il risultato dell'anteprima non viene mantenuto.
*   **Debounce integrato**: se vengono attivati più aggiornamenti in un breve periodo, viene eseguito solo l'ultimo, evitando richieste frequenti.
*   Cliccando nuovamente su `Anteprima`, il risultato dell'anteprima precedente verrà sovrascritto.

## Messaggi di errore
*   **Errori di query o fallimenti di validazione**: le informazioni di errore vengono visualizzate nell'area `Visualizza dati`.
*   **Errori di configurazione del grafico** (mappatura Basic mancante, errori da Custom JS): gli errori vengono mostrati nell'area del grafico o nella console, mantenendo la pagina operativa.
*   Confermare prima i nomi delle colonne e i tipi di dati in `Visualizza dati`, e solo successivamente procedere con la mappatura dei campi o la scrittura del codice Custom, per ridurre efficacemente gli errori.

## Salva e Annulla
*   **Salva**: Scrive le modifiche attuali nella configurazione del blocco e le applica immediatamente alla pagina.
*   **Annulla**: Annulla le modifiche non salvate del pannello corrente, ripristinando lo stato dell'ultimo salvataggio.
*   **Ambito di salvataggio**:
    *   **Query dati**: I parametri di query del Builder; in modalità SQL, viene salvato anche il testo SQL.
    *   **Opzioni del grafico**: Il tipo Basic, la mappatura dei campi e le proprietà; il testo JS di Custom.
    *   **Eventi di interazione**: Il testo JS e la logica di binding degli eventi.
*   Dopo il salvataggio, il blocco diventa effettivo per tutti i visitatori (a seconda delle impostazioni dei permessi della pagina).

## Percorso operativo consigliato
Configuri la query dati → Esegua la query → `Visualizza dati` per confermare nomi e tipi delle colonne → Configuri le opzioni del grafico per mappare i campi principali → Anteprima per la validazione → Salva per applicare le modifiche.