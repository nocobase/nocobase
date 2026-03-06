:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/get-started/translations).
:::

# Contribuire alla traduzione

La lingua predefinita di NocoBase è l'inglese. Attualmente, l'applicazione principale supporta inglese, italiano, olandese, cinese semplificato e giapponese. La invitiamo cordialmente a contribuire con traduzioni per altre lingue, permettendo agli utenti di tutto il mondo di godere di un'esperienza NocoBase ancora più accessibile.

---

## I. Localizzazione del sistema

### 1. Traduzione dell'interfaccia di sistema e dei plugin

#### 1.1 Ambito della traduzione
Questa sezione si applica esclusivamente alla localizzazione dell'interfaccia di sistema di NocoBase e dei plugin, e non copre altri contenuti personalizzati (come tabelle dati o blocchi Markdown).

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 Panoramica dei contenuti di localizzazione
NocoBase utilizza Git per gestire i propri contenuti di localizzazione. Il repository principale è:
https://github.com/nocobase/nocobase/tree/main/locales

Ogni lingua è rappresentata da un file JSON denominato in base al proprio codice lingua (ad esempio, de-DE.json, fr-FR.json). La struttura del file è organizzata per moduli plugin, utilizzando coppie chiave-valore per memorizzare le traduzioni. Per esempio:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...altre coppie chiave-valore
  },
  "@nocobase/plugin-acl": {
    // Coppie chiave-valore per questo plugin
  }
  // ...altri moduli plugin
}
```

Durante la traduzione, La preghiamo di convertirlo gradualmente in una struttura simile alla seguente:

```json
{
  // Plugin client
  "@nocobase/client": {
    "(Fields only)": "(Solo campi - tradotto)",
    "12 hour": "12 ore",
    "24 hour": "24 ore"
    // ...altre coppie chiave-valore
  },
  "@nocobase/plugin-acl": {
    // Coppie chiave-valore per questo plugin
  }
  // ...altri moduli plugin
}
```

#### 1.3 Test e sincronizzazione della traduzione
- Dopo aver completato la traduzione, La preghiamo di testare e verificare che tutti i testi siano visualizzati correttamente.
Abbiamo inoltre rilasciato un plugin per la verifica della traduzione: cerchi `Locale tester` nel marketplace dei plugin.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
Dopo l'installazione, copi il contenuto JSON dal file di localizzazione corrispondente nel repository git, lo incolli all'interno e clicchi su OK per verificare se il contenuto della traduzione è efficace.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- Una volta inviata, gli script di sistema sincronizzeranno automaticamente il contenuto della localizzazione nel repository del codice.

#### 1.4 Plugin di localizzazione NocoBase 2.0

> **Nota:** Questa sezione è in fase di sviluppo. Il plugin di localizzazione per NocoBase 2.0 presenta alcune differenze rispetto alla versione 1.x. I dettagli saranno forniti in un prossimo aggiornamento.

<!-- TODO: Aggiungere dettagli sulle differenze del plugin di localizzazione 2.0 -->

## II. Localizzazione della documentazione (NocoBase 2.0)

La documentazione di NocoBase 2.0 è gestita con una nuova struttura. I file sorgente della documentazione si trovano nel repository principale di NocoBase:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 Struttura della documentazione

La documentazione utilizza [Rspress](https://rspress.dev/) come generatore di siti statici e supporta 22 lingue. La struttura è organizzata come segue:

```
docs/
├── docs/
│   ├── en/                    # Inglese (lingua sorgente)
│   ├── cn/                    # Cinese semplificato
│   ├── ja/                    # Giapponese
│   ├── ko/                    # Coreano
│   ├── de/                    # Tedesco
│   ├── fr/                    # Francese
│   ├── es/                    # Spagnolo
│   ├── pt/                    # Portoghese
│   ├── ru/                    # Russo
│   ├── it/                    # Italiano
│   ├── tr/                    # Turco
│   ├── uk/                    # Ucraino
│   ├── vi/                    # Vietnamita
│   ├── id/                    # Indonesiano
│   ├── th/                    # Tailandese
│   ├── pl/                    # Polacco
│   ├── nl/                    # Olandese
│   ├── cs/                    # Ceco
│   ├── ar/                    # Arabo
│   ├── he/                    # Ebraico
│   ├── hi/                    # Hindi
│   ├── sv/                    # Svedese
│   └── public/                # Risorse condivise (immagini, ecc.)
├── theme/                     # Tema personalizzato
├── rspress.config.ts          # Configurazione Rspress
└── package.json
```

### 2.2 Flusso di lavoro per la traduzione

1. **Sincronizzazione con la sorgente inglese**: Tutte le traduzioni devono basarsi sulla documentazione inglese (`docs/en/`). Quando la documentazione inglese viene aggiornata, le traduzioni devono essere aggiornate di conseguenza.

2. **Strategia dei rami (branch)**:
   - Utilizzi il ramo `develop` o `next` come riferimento per i contenuti inglesi più recenti
   - Crei il Suo ramo di traduzione partendo dal ramo di destinazione

3. **Struttura dei file**: Ogni directory linguistica deve rispecchiare la struttura della directory inglese. Per esempio:
   ```
   docs/en/get-started/index.md    →    docs/it/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/it/api/acl/acl.md
   ```

### 2.3 Contribuire alle traduzioni

1. Esegua il fork del repository: https://github.com/nocobase/nocobase
2. Cloni il Suo fork ed effettui il checkout del ramo `develop` o `next`
3. Navighi nella directory `docs/docs/`
4. Trovi la directory della lingua a cui desidera contribuire (ad esempio, `it/` per l'italiano)
5. Traduca i file markdown, mantenendo la stessa struttura di file della versione inglese
6. Testi le modifiche localmente:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. Invii una Pull Request al repository principale

### 2.4 Linee guida per la traduzione

- **Mantenere la coerenza della formattazione**: Mantenga la stessa struttura markdown, intestazioni, blocchi di codice e collegamenti della sorgente.
- **Preservare il frontmatter**: Mantenga invariato qualsiasi frontmatter YAML all'inizio dei file, a meno che non contenga contenuti traducibili.
- **Riferimenti alle immagini**: Utilizzi gli stessi percorsi delle immagini da `docs/public/` - le immagini sono condivise tra tutte le lingue.
- **Collegamenti interni**: Aggiorni i collegamenti interni affinché puntino al percorso della lingua corretta.
- **Esempi di codice**: In genere, gli esempi di codice non devono essere tradotti, ma i commenti all'interno del codice possono essere tradotti.

### 2.5 Configurazione della navigazione

La struttura di navigazione per ogni lingua è definita nei file `_nav.json` e `_meta.json` all'interno di ogni directory linguistica. Quando aggiunge nuove pagine o sezioni, si assicuri di aggiornare questi file di configurazione.

## III. Localizzazione del sito ufficiale

Le pagine del sito web e tutti i contenuti sono memorizzati in:
https://github.com/nocobase/website

### 3.1 Risorse iniziali e di riferimento

Quando aggiunge una nuova lingua, faccia riferimento alle pagine delle lingue esistenti:
- Inglese: https://github.com/nocobase/website/tree/main/src/pages/en
- Cinese: https://github.com/nocobase/website/tree/main/src/pages/cn
- Giapponese: https://github.com/nocobase/website/tree/main/src/pages/ja

![Diagramma localizzazione sito web](https://static-docs.nocobase.com/20250319121600.png)

Le modifiche allo stile globale si trovano in:
- Inglese: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- Cinese: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- Giapponese: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![Diagramma stile globale](https://static-docs.nocobase.com/20250319121501.png)

La localizzazione dei componenti globali del sito web è disponibile in:
https://github.com/nocobase/website/tree/main/src/components

![Diagramma componenti sito web](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 Struttura dei contenuti e metodo di localizzazione

Utilizziamo un approccio di gestione dei contenuti misto. I contenuti e le risorse in inglese, cinese e giapponese vengono regolarmente sincronizzati dal sistema CMS e sovrascritti, mentre le altre lingue possono essere modificate direttamente nei file locali. I contenuti locali sono memorizzati nella directory `content`, organizzata come segue:

```
/content
  /articles        # Articoli del blog
    /article-slug
      index.md     # Contenuto inglese (predefinito)
      index.cn.md  # Contenuto cinese
      index.ja.md  # Contenuto giapponese
      metadata.json # Metadati e altre proprietà di localizzazione
  /tutorials       # Tutorial
  /releases        # Informazioni sulle release
  /pages           # Alcune pagine statiche
  /categories      # Informazioni sulle categorie
    /article-categories.json  # Elenco categorie articoli
    /category-slug            # Dettagli singola categoria
      /category.json
  /tags            # Informazioni sui tag
    /article-tags.json        # Elenco tag articoli
    /release-tags.json        # Elenco tag release
    /tag-slug                 # Dettagli singolo tag
      /tag.json
  /help-center     # Contenuti del centro assistenza
    /help-center-tree.json    # Struttura di navigazione del centro assistenza
  ....
```

### 3.3 Linee guida per la traduzione dei contenuti

- Traduzione dei contenuti Markdown

1. Crei un nuovo file di lingua basato sul file predefinito (ad esempio, da `index.md` a `index.it.md`)
2. Aggiunga le proprietà localizzate nei campi corrispondenti nel file JSON
3. Mantenga la coerenza nella struttura dei file, nei collegamenti e nei riferimenti alle immagini

- Traduzione dei contenuti JSON
Molti metadati dei contenuti sono memorizzati in file JSON, che in genere contengono campi multilingue:

```json
{
  "id": 123,
  "title": "English Title",       // Titolo inglese (predefinito)
  "title_cn": "中文标题",          // Titolo cinese
  "title_ja": "日本語タイトル",    // Titolo giapponese
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // Percorso URL (solitamente non tradotto)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**Note sulla traduzione:**

1. **Convenzione di denominazione dei campi**: I campi di traduzione utilizzano in genere il formato `{campo_originale}_{codice_lingua}`
   - Per esempio: title_it (titolo italiano), description_de (descrizione tedesca)

2. **Quando si aggiunge una nuova lingua**:
   - Aggiunga una versione con suffisso della lingua corrispondente per ogni campo che necessita di traduzione
   - Non modifichi i valori dei campi originali (come title, description, ecc.), poiché fungono da contenuto per la lingua predefinita (inglese)

3. **Meccanismo di sincronizzazione del CMS**:
   - Il sistema CMS aggiorna periodicamente i contenuti in inglese, cinese e giapponese
   - Il sistema aggiornerà/sovrascriverà solo i contenuti per queste tre lingue (alcune proprietà nel JSON) e **non eliminerà** i campi linguistici aggiunti da altri contributori
   - Per esempio: se ha aggiunto una traduzione italiana (title_it), la sincronizzazione del CMS non influirà su questo campo


### 3.4 Configurazione del supporto per una nuova lingua

Per aggiungere il supporto per una nuova lingua, è necessario modificare la configurazione `SUPPORTED_LANGUAGES` nel file `src/utils/index.ts`:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // Esempio di aggiunta di una nuova lingua:
  it: {
    code: 'it',
    locale: 'it-IT',
    name: 'Italian'
  }
};
```

### 3.5 File di layout e stili

Ogni lingua necessita dei corrispondenti file di layout:

1. Crei un nuovo file di layout (ad esempio, per l'italiano, crei `src/layouts/BaseIT.astro`)
2. Può copiare un file di layout esistente (come `BaseEN.astro`) e tradurlo
3. Il file di layout contiene le traduzioni per gli elementi globali come i menu di navigazione, i piè di pagina, ecc.
4. Si assicuri di aggiornare la configurazione del selettore di lingua per passare correttamente alla lingua appena aggiunta

### 3.6 Creazione delle directory delle pagine per la lingua

Crei directory di pagine indipendenti per la nuova lingua:

1. Crei una cartella denominata con il codice della lingua nella directory `src` (ad esempio, `src/it/`)
2. Copi la struttura delle pagine dalle altre directory linguistiche (ad esempio, `src/en/`)
3. Aggiorni il contenuto delle pagine, traducendo titoli, descrizioni e testi nella lingua di destinazione
4. Si assicuri che le pagine utilizzino il componente di layout corretto (ad esempio, `.layout: '@/layouts/BaseIT.astro'`)

### 3.7 Localizzazione dei componenti

Anche alcuni componenti comuni necessitano di traduzione:

1. Controlli i componenti nella directory `src/components/`
2. Presti particolare attenzione ai componenti con testo fisso (come barre di navigazione, piè di pagina, ecc.)
3. I componenti possono utilizzare il rendering condizionale per visualizzare i contenuti in diverse lingue:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/cn') && <p>中文内容</p>}
{Astro.url.pathname.startsWith('/it') && <p>Contenuto in italiano</p>}
```

### 3.8 Test e validazione

Dopo aver completato la traduzione, esegua test approfonditi:

1. Avvii il sito web localmente (solitamente usando `yarn dev`)
2. Controlli come vengono visualizzate tutte le pagine nella nuova lingua
3. Verifichi che la funzionalità di cambio lingua funzioni correttamente
4. Si assicuri che tutti i collegamenti puntino alle pagine della versione linguistica corretta
5. Controlli i layout responsive per assicurarsi che il testo tradotto non rovini il design della pagina

## IV. Come iniziare a tradurre

Se desidera contribuire con una nuova traduzione linguistica a NocoBase, segua questi passaggi:

| Componente | Repository | Ramo (Branch) | Note |
|------------|------------|---------------|------|
| Interfaccia di sistema | https://github.com/nocobase/nocobase/tree/main/locales | main | File JSON di localizzazione |
| Documentazione (2.0) | https://github.com/nocobase/nocobase | develop / next | Directory `docs/docs/<lang>/` |
| Sito ufficiale | https://github.com/nocobase/website | main | Vedere Sezione III |

Dopo aver completato la traduzione, invii una Pull Request a NocoBase. Le nuove lingue appariranno nella configurazione di sistema, permettendoLe di selezionare quali lingue visualizzare.

![Diagramma lingue abilitate](https://static-docs.nocobase.com/20250319123452.png)

## Documentazione NocoBase 1.x

Per la guida alla traduzione di NocoBase 1.x, faccia riferimento a:

https://docs.nocobase.com/welcome/community/translations