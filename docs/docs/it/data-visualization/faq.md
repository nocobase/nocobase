:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Domande Frequenti

## Selezione del Grafico
### Come scelgo il grafico più adatto?
Risposta: Scelga in base ai suoi dati e ai suoi obiettivi:
- Tendenze e cambiamenti: grafico a linee o grafico ad area
- Confronto di valori: grafico a barre verticali o grafico a barre orizzontali
- Composizione o proporzioni: grafico a torta o grafico ad anello
- Correlazione e distribuzione: grafico a dispersione
- Struttura gerarchica e avanzamento delle fasi: grafico a imbuto

Per ulteriori tipi di grafico, consulti gli [esempi di ECharts](https://echarts.apache.org/examples).

### Quali tipi di grafico supporta NocoBase?
Risposta: La modalità di configurazione visuale include i grafici comuni (grafico a linee, grafico ad area, grafico a barre verticali, grafico a barre orizzontali, grafico a torta, grafico ad anello, grafico a imbuto, grafico a dispersione, ecc.). La modalità di configurazione personalizzata supporta tutti i tipi di grafico di ECharts.

## Problemi di Query sui Dati
### Le configurazioni delle modalità Visuale e SQL sono interscambiabili?
Risposta: No, non sono interscambiabili. Le loro configurazioni sono archiviate separatamente. La modalità di configurazione utilizzata al momento dell'ultimo salvataggio sarà quella effettiva.

## Opzioni del Grafico
### Come si configurano i campi del grafico?
Risposta: Nella modalità di configurazione visuale, selezioni i campi dati corrispondenti al tipo di grafico. Ad esempio, i grafici a linee o a barre verticali richiedono la configurazione dei campi dell'asse X e dell'asse Y, mentre i grafici a torta richiedono un campo di categoria e un campo di valore.
Si consiglia di eseguire prima "Esegui query" per verificare che i dati siano conformi alle aspettative; per impostazione predefinita, i campi del grafico verranno abbinati automaticamente.

## Problemi di Anteprima e Salvataggio
### Devo visualizzare l'anteprima delle modifiche manualmente?
Risposta: Nella modalità di configurazione visuale, le modifiche vengono visualizzate automaticamente in anteprima. Nelle modalità SQL e di configurazione personalizzata, per evitare aggiornamenti frequenti, completi la scrittura e clicchi manualmente su "Anteprima".

### Perché l'anteprima del grafico scompare dopo aver chiuso la finestra di dialogo?
Risposta: L'effetto dell'anteprima è solo per una visualizzazione temporanea. Dopo aver modificato la configurazione, salvi prima di chiudere; le modifiche non salvate non verranno mantenute.