:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Tipi di campo Data/Ora

I tipi di campo Data/Ora includono i seguenti:

- **Data/Ora (con fuso orario)** - I valori Data/Ora vengono convertiti in UTC (Tempo Coordinato Universale) e, se necessario, vengono applicate le conversioni di fuso orario;
- **Data/Ora (senza fuso orario)** - Memorizza i dati di data e ora senza includere alcuna informazione sul fuso orario;
- **Data (senza ora)** - Memorizza esclusivamente le informazioni sulla data, omettendo qualsiasi componente oraria;
- **Ora** - Memorizza solo le informazioni sull'ora, escludendo la data;
- **Timestamp Unix** - Rappresenta il numero di secondi trascorsi dal 1° gennaio 1970 ed è memorizzato come timestamp Unix.

Ecco alcuni esempi per ciascun tipo di campo Data/Ora:

| **Tipo di campo**         | **Valore di esempio**      | **Descrizione**                                       |
|---------------------------|----------------------------|-------------------------------------------------------|
| Data/Ora (con fuso orario) | 2024-08-24T07:30:00.000Z   | Convertito in UTC e può essere adattato per i fusi orari    |
| Data/Ora (senza fuso orario) | 2024-08-24 15:30:00        | Memorizza data e ora senza considerare il fuso orario  |
| Data (senza ora)          | 2024-08-24                 | Cattura solo la data, senza informazioni sull'ora       |
| Ora                       | 15:30:00                   | Cattura solo l'ora, escludendo i dettagli della data     |
| Timestamp Unix            | 1724437800                 | Rappresenta i secondi trascorsi dal 1970-01-01 00:00:00 UTC |

## Confronto tra fonti dati

Di seguito una tabella di confronto per NocoBase, MySQL e PostgreSQL:

| **Tipo di campo**         | **NocoBase**               | **MySQL**                  | **PostgreSQL**                         |
|---------------------------|----------------------------|----------------------------|----------------------------------------|
| Data/Ora (con fuso orario) | Datetime with timezone     | TIMESTAMP<br/> DATETIME    | TIMESTAMP WITH TIME ZONE               |
| Data/Ora (senza fuso orario) | Datetime without timezone  | DATETIME                   | TIMESTAMP WITHOUT TIME ZONE            |
| Data (senza ora)          | Date                       | DATE                       | DATE                                   |
| Ora                       | Time                       | TIME                       | TIME WITHOUT TIME ZONE                 |
| Timestamp Unix            | Unix timestamp             | INTEGER<br/>BIGINT         | INTEGER<br/>BIGINT                     |
| Ora (con fuso orario)     | -                          | -                          | TIME WITH TIME ZONE                    |

**Nota:**
- Il tipo TIMESTAMP di MySQL copre un intervallo tra `1970-01-01 00:00:01 UTC` e `2038-01-19 03:14:07 UTC`. Per date e orari al di fuori di questo intervallo, si consiglia di utilizzare DATETIME o BIGINT per memorizzare i timestamp Unix.

## Flusso di elaborazione per la memorizzazione di Data/Ora

### Con fuso orario

Questo include `Data/Ora (con fuso orario)` e `Timestamp Unix`.

![20240824191933](https://static-docs.nocobase.com/20240824191933.png)

**Nota:**
- Per supportare un intervallo di date più ampio, NocoBase utilizza il tipo DATETIME in MySQL per i campi Data/Ora (con fuso orario). Il valore della data memorizzato viene convertito in base alla variabile d'ambiente TZ del server, il che significa che se la variabile d'ambiente TZ cambia, anche il valore Data/Ora memorizzato cambierà.
- Poiché esiste una differenza di fuso orario tra l'ora UTC e l'ora locale, la visualizzazione diretta del valore UTC grezzo potrebbe indurre in errore l'utente.

### Senza fuso orario

![20240824185600](https://static-docs.nocobase.com/20240824185600.png)

## UTC

UTC (Tempo Coordinato Universale) è lo standard orario globale utilizzato per coordinare e sincronizzare l'ora in tutto il mondo. È uno standard orario ad alta precisione, mantenuto da orologi atomici e sincronizzato con la rotazione terrestre.

La differenza tra l'ora UTC e l'ora locale può generare confusione quando si visualizzano i valori UTC grezzi. Ad esempio:

| **Fuso orario** | **Data/Ora**                      |
|-----------------|-----------------------------------|
| UTC             | 2024-08-24T07:30:00.000Z          |
| UTC+8           | 2024-08-24 15:30:00               |
| UTC+5           | 2024-08-24 12:30:00               |
| UTC-5           | 2024-08-24 02:30:00               |
| UTC+0           | 2024-08-24 07:30:00               |
| UTC-6           | 2024-08-23 01:30:00               |

Questi orari diversi corrispondono tutti allo stesso momento, semplicemente espressi in vari fusi orari.