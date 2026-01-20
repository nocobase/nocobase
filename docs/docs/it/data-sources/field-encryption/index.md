---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::


# Crittografia

## Introduzione

Alcuni dati aziendali sensibili, come numeri di telefono dei clienti, indirizzi email, numeri di carta, ecc., possono essere crittografati. Dopo la crittografia, questi dati vengono archiviati nel database sotto forma di testo cifrato.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Crittografia

:::warning
Il plugin genera automaticamente una `chiave applicazione`, che viene salvata nella directory `/storage/apps/main/encryption-field-keys`.

Il file della `chiave applicazione` prende il nome dall'ID della chiave e ha l'estensione `.key`. Si prega di non modificare il nome del file arbitrariamente.

Si prega di conservare con cura il file della `chiave applicazione`. Se questo file viene perso, i dati crittografati non potranno essere decifrati.

Se il plugin è abilitato da una sotto-applicazione, la chiave viene salvata di default nella directory `/storage/apps/${nome_sotto_applicazione}/encryption-field-keys`.
:::

### Come funziona

Utilizza la crittografia a busta (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Processo di creazione della chiave
1. La prima volta che viene creato un campo crittografato, il sistema genera automaticamente una `chiave applicazione` a 32 bit, che viene salvata nella directory di archiviazione predefinita con codifica Base64.
2. Ogni volta che viene creato un nuovo campo crittografato, viene generata una `chiave campo` casuale a 32 bit per quel campo. Questa viene quindi crittografata utilizzando la `chiave applicazione` e un `vettore di crittografia del campo` a 16 bit generato casualmente (algoritmo di crittografia `AES`), e infine salvata nel campo `options` della tabella `fields`.

### Processo di crittografia del campo
1. Ogni volta che si scrivono dati in un campo crittografato, si recuperano prima la `chiave campo` crittografata e il `vettore di crittografia del campo` dal campo `options` della tabella `fields`.
2. Si decifra la `chiave campo` crittografata utilizzando la `chiave applicazione` e il `vettore di crittografia del campo`. Successivamente, i dati vengono crittografati utilizzando la `chiave campo` e un `vettore di crittografia dei dati` a 16 bit generato casualmente (algoritmo di crittografia `AES`).
3. I dati vengono firmati utilizzando la `chiave campo` decifrata (algoritmo di digest `HMAC-SHA256`) e convertiti in una stringa con codifica Base64 (la `firma dei dati` risultante viene successivamente utilizzata per il recupero dei dati).
4. Si concatenano in binario il `vettore di crittografia dei dati` a 16 bit e il `testo cifrato` crittografato, quindi si converte il risultato in una stringa con codifica Base64.
5. Si concatenano la stringa con codifica Base64 della `firma dei dati` e la stringa con codifica Base64 del `testo cifrato` concatenato, separandole con un `.`.
6. Si salva la stringa finale concatenata nel database.

## Variabili d'ambiente

Se si desidera specificare una `chiave applicazione` personalizzata, è possibile utilizzare la variabile d'ambiente `ENCRYPTION_FIELD_KEY_PATH`. Il plugin caricherà il file presente in quel percorso come `chiave applicazione`.

Requisiti per il file della `chiave applicazione`:
1. L'estensione del file deve essere `.key`.
2. Il nome del file verrà utilizzato come ID della chiave; si raccomanda l'uso di un UUID per garantirne l'unicità.
3. Il contenuto del file deve essere costituito da 32 byte di dati binari codificati in Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configurazione del campo

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impatto della crittografia sul filtraggio

I campi crittografati supportano solo i seguenti operatori di filtro: uguale a, diverso da, esiste, non esiste.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Flusso di lavoro del filtraggio:
1. Si recupera la `chiave campo` del campo crittografato e la si decifra utilizzando la `chiave applicazione`.
2. Si utilizza la `chiave campo` per firmare il testo di ricerca inserito dall'utente (algoritmo di digest `HMAC-SHA256`).
3. Si concatena la firma con un separatore `.` e si esegue una ricerca per corrispondenza di prefisso sul campo crittografato nel database.

## Rotazione delle chiavi

:::warning
Prima di utilizzare il comando `nocobase key-rotation`, si assicuri che il plugin sia stato caricato dall'applicazione.
:::

Quando si migra un'applicazione a un nuovo ambiente e non si desidera continuare a utilizzare la stessa chiave del vecchio ambiente, è possibile usare il comando `nocobase key-rotation` per sostituire la `chiave applicazione`.

L'esecuzione del comando di rotazione delle chiavi richiede la specifica della `chiave applicazione` del vecchio ambiente. Dopo l'esecuzione, verrà generata una nuova `chiave applicazione`, che sostituirà la vecchia. La nuova `chiave applicazione` verrà salvata (codificata in Base64) nella directory predefinita.

```bash
# --key-path specifica la chiave applicazione del vecchio ambiente
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Se si desidera sostituire la `chiave applicazione` di una sotto-applicazione, è necessario aggiungere il parametro `--app-name` e specificare il `name` della sotto-applicazione.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```