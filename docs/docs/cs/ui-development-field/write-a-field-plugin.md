:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Pracovní postup: HTTP požadavek



# Pracovní postup: HTTP požadavek

Uzel HTTP požadavek odešle HTTP požadavek na zadanou URL adresu a získá z ní odpověď.

## Konfigurace uzlu

### URL požadavku

Zadejte URL adresu, na kterou chcete odeslat požadavek.

### Metoda požadavku

Podporuje různé metody požadavků, jako jsou GET, POST, PUT, PATCH a DELETE.

### Hlavičky (Headers)

Můžete přidat vlastní hlavičky požadavku, například `Content-Type`, `Authorization` a další.

### Tělo požadavku (Body)

U požadavků typu POST, PUT nebo PATCH můžete nastavit tělo požadavku. Je podporováno několik formátů:
- `form-data`
- `x-www-form-urlencoded`
- `raw` (JSON, Text, XML atd.)
- `binary`

### Odpověď (Response)

Po vykonání požadavku se výsledek odpovědi uloží do výstupu uzlu. Na tento výstup se pak můžete odkazovat v následujících uzlech.