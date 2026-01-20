:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Funzionalità Avanzate

### Paginazione

#### 1. Aggiornamento dei numeri di pagina

##### Sintassi
Basta inserirli nel software Office.

##### Esempio
In Microsoft Word:
- Utilizzi la funzione "Inserisci → Numero di pagina"  
In LibreOffice:
- Utilizzi la funzione "Inserisci → Campo → Numero di pagina"

##### Risultato
Nel report generato, i numeri di pagina si aggiorneranno automaticamente su ogni pagina.

#### 2. Generazione dell'indice

##### Sintassi
Basta inserirlo nel software Office.

##### Esempio
In Microsoft Word:
- Utilizzi la funzione "Inserisci → Indice e sommario → Sommario"  
In LibreOffice:
- Utilizzi la funzione "Inserisci → Indice e sommario → Indice, sommario o bibliografia"

##### Risultato
L'indice del report si aggiornerà automaticamente in base al contenuto del documento.

#### 3. Ripetizione delle intestazioni di tabella

##### Sintassi
Basta inserirli nel software Office.

##### Esempio
In Microsoft Word:
- Clicchi con il tasto destro sull'intestazione della tabella → Proprietà tabella → Selezioni "Ripeti come riga di intestazione nella parte superiore di ogni pagina"  
In LibreOffice:
- Clicchi con il tasto destro sull'intestazione della tabella → Proprietà tabella → Scheda Flusso di testo → Selezioni "Ripeti intestazione"

##### Risultato
Quando una tabella si estende su più pagine, l'intestazione si ripeterà automaticamente nella parte superiore di ogni pagina.

### Internazionalizzazione (i18n)

#### 1. Traduzione di testo statico

##### Sintassi
Utilizzi il tag `{t(testo)}` per internazionalizzare il testo statico:
```
{t(meeting)}
```

##### Esempio
Nel template:
```
{t(meeting)} {t(apples)}
```
I dati JSON o un dizionario di localizzazione esterno (ad esempio, per "fr-fr") forniscono le traduzioni corrispondenti, come "meeting" → "rendez-vous" e "apples" → "Pommes".

##### Risultato
Durante la generazione del report, il testo verrà sostituito con la traduzione corrispondente in base alla lingua di destinazione.

#### 2. Traduzione di testo dinamico

##### Sintassi
Per il contenuto dei dati, può utilizzare il formattatore `:t`, ad esempio:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Esempio
Nel template:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
I dati JSON e il dizionario di localizzazione forniscono le traduzioni appropriate.

##### Risultato
In base alla condizione, l'output sarà "lundi" o "mardi" (utilizzando la lingua di destinazione come esempio).

### Mappatura chiave-valore

#### 1. Conversione di enumerazioni (:convEnum)

##### Sintassi
```
{dati:convEnum(nomeEnum)}
```
Ad esempio:
```
0:convEnum('ORDER_STATUS')
```

##### Esempio
In un esempio di opzioni API, viene fornito quanto segue:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Nel template:
```
0:convEnum('ORDER_STATUS')
```

##### Risultato
L'output sarà "pending"; se l'indice supera l'intervallo dell'enumerazione, verrà restituito il valore originale.

### Immagini dinamiche
:::info
Attualmente supporta i tipi di file XLSX e DOCX
:::
Può inserire "immagini dinamiche" nei template dei documenti. Ciò significa che le immagini segnaposto nel template verranno automaticamente sostituite con immagini reali durante il rendering, in base ai dati. Questo processo è molto semplice e richiede solo:

1. Inserire un'immagine temporanea come segnaposto
2. Modificare il "Testo alternativo" di tale immagine per impostare l'etichetta del campo
3. Effettuare il rendering del documento; il sistema la sostituirà automaticamente con l'immagine reale.

Di seguito, spiegheremo i metodi operativi per DOCX e XLSX attraverso esempi specifici.

#### Inserimento di immagini dinamiche nei file DOCX
##### Sostituzione di una singola immagine

1. Apra il suo template DOCX e inserisca un'immagine temporanea (può essere qualsiasi immagine segnaposto, come un'[immagine blu a tinta unita](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png))

:::info
**Istruzioni sul formato dell'immagine**

- Attualmente, le immagini segnaposto supportano solo il formato PNG. Le consigliamo di utilizzare la nostra immagine d'esempio fornita: un'[immagine blu a tinta unita](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Le immagini di destinazione per il rendering supportano solo i formati PNG, JPG, JPEG. Altri tipi di immagini potrebbero non essere renderizzati correttamente.

**Istruzioni sulle dimensioni dell'immagine**

Sia per DOCX che per XLSX, la dimensione finale dell'immagine renderizzata seguirà le dimensioni dell'immagine temporanea nel template. Ciò significa che l'immagine di sostituzione effettiva verrà automaticamente ridimensionata per corrispondere alla dimensione dell'immagine segnaposto che ha inserito. Se desidera che l'immagine renderizzata sia 150×150, utilizzi un'immagine temporanea nel template e la ridimensioni di conseguenza.
:::

2. Clicchi con il tasto destro su questa immagine, modifichi il suo "Testo alternativo" e inserisca l'etichetta del campo immagine che desidera inserire, ad esempio `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Utilizzi i seguenti dati d'esempio per il rendering:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Nel risultato del rendering, l'immagine temporanea verrà sostituita con l'immagine reale:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Sostituzione di più immagini in un ciclo

Se desidera inserire un gruppo di immagini nel template, come un elenco di prodotti, può farlo anche tramite cicli. I passaggi specifici sono i seguenti:
1. Supponiamo che i suoi dati siano i seguenti:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Imposti un'area di ciclo nel template DOCX e inserisca immagini temporanee in ogni elemento del ciclo con il Testo alternativo impostato su `{d.products[i].imageUrl}`, come mostrato di seguito:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Dopo il rendering, tutte le immagini temporanee verranno sostituite con le rispettive immagini dai dati:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Inserimento di immagini dinamiche nei file XLSX

Il metodo operativo nei template Excel (XLSX) è sostanzialmente lo stesso, ma tenga presente i seguenti punti:

1. Dopo aver inserito un'immagine, si assicuri di selezionare "immagine all'interno della cella" anziché avere l'immagine fluttuante sopra la cella.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Dopo aver selezionato la cella, clicchi per visualizzare il "Testo alternativo" e inserisca l'etichetta del campo, ad esempio `{d.imageUrl}`.

### Codici a barre
:::info
Attualmente supporta i tipi di file XLSX e DOCX
:::

#### Generazione di codici a barre (come i codici QR)

La generazione dei codici a barre funziona allo stesso modo delle immagini dinamiche, richiedendo solo tre passaggi:

1. Inserire un'immagine temporanea nel template per contrassegnare la posizione del codice a barre.

2. Modificare il "Testo alternativo" dell'immagine e inserire l'etichetta del campo del formato del codice a barre, ad esempio `{d.code:barcode(qrcode)}`, dove `qrcode` è il tipo di codice a barre (veda l'elenco supportato di seguito).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Dopo il rendering, l'immagine segnaposto verrà automaticamente sostituita con l'immagine del codice a barre corrispondente:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Tipi di codici a barre supportati

| Nome del codice a barre | Tipo   |
| ----------------------- | ------ |
| Codice QR               | qrcode |