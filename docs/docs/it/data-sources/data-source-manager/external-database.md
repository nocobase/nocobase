:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Database Esterno

## Introduzione

Utilizzi un database esterno esistente come fonte dati. Attualmente, i database esterni supportati includono MySQL, MariaDB, PostgreSQL, MSSQL e Oracle.

## Istruzioni per l'uso

### Aggiungere un Database Esterno

Dopo aver attivato il plugin, può selezionarlo e aggiungerlo dal menu a discesa "Aggiungi nuovo" nella gestione delle fonti dati.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

Inserisca le informazioni del database a cui desidera connettersi.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### Sincronizzazione delle collezioni

Dopo aver stabilito una connessione con un database esterno, tutte le collezioni all'interno della fonte dati verranno lette direttamente. I database esterni non supportano l'aggiunta diretta di collezioni o la modifica della struttura delle tabelle. Se sono necessarie modifiche, può eseguirle tramite un client di database e quindi fare clic sul pulsante "Aggiorna" nell'interfaccia per sincronizzare.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### Configurazione dei Campi

Il database esterno leggerà e visualizzerà automaticamente i campi delle collezioni esistenti. Può visualizzare e configurare rapidamente il titolo del campo, il tipo di dati (Field type) e il tipo di interfaccia utente (Field interface). Può anche fare clic sul pulsante "Modifica" per modificare ulteriori configurazioni.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

Poiché i database esterni non supportano la modifica della struttura delle tabelle, l'unico tipo disponibile quando si aggiunge un nuovo campo è il campo di relazione (association field). I campi di relazione non sono campi reali, ma sono utilizzati per stabilire connessioni tra le collezioni.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

Per maggiori dettagli, consulti il capitolo [Campi delle collezioni/Panoramica](/data-sources/data-modeling/collection-fields).

### Mappatura del Tipo di Campo

NocoBase mappa automaticamente i tipi di campo del database esterno ai corrispondenti tipi di dati (Field type) e tipi di interfaccia utente (Field Interface).

- Tipo di dati (Field type): Definisce il tipo, il formato e la struttura dei dati che un campo può memorizzare;
- Tipo di interfaccia utente (Field interface): Si riferisce al tipo di controllo utilizzato nell'interfaccia utente per visualizzare e inserire i valori dei campi.

| PostgreSQL | MySQL/MariaDB | Tipo di dati NocoBase | Tipo di interfaccia NocoBase |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### Tipi di Campo Non Supportati

I tipi di campo non supportati vengono visualizzati separatamente. Questi campi richiedono un adattamento di sviluppo prima di poter essere utilizzati.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### Chiave di Filtro Target

Le collezioni visualizzate come blocchi devono avere una chiave di filtro target (Filter target key) configurata. La chiave di filtro target viene utilizzata per filtrare i dati in base a un campo specifico, e il valore del campo deve essere univoco. Per impostazione predefinita, la chiave di filtro target è il campo chiave primaria della collezione. Per le viste, le collezioni senza una chiave primaria o le collezioni con una chiave primaria composita, è necessario definire una chiave di filtro target personalizzata.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

Solo le collezioni che hanno una chiave di filtro target configurata possono essere aggiunte alla pagina.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)