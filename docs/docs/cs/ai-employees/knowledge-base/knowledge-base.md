:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Znalostní báze

## Úvod

Znalostní báze tvoří základ pro RAG (Retrieval-Augmented Generation) vyhledávání. Organizuje dokumenty do kategorií a vytváří index. Když AI zaměstnanec odpovídá na otázku, bude prioritně vyhledávat odpovědi právě ve znalostní bázi.

## Správa znalostní báze

Přejděte na stránku konfigurace **pluginu** AI zaměstnanců a klikněte na záložku `Knowledge base`. Tím se dostanete na stránku správy znalostní báze.

![20251023095649](https://static-docs.nocobase.com/20251023095649.png)

Klikněte na tlačítko `Add new` v pravém horním rohu a přidejte novou `Local` znalostní bázi.

![20251023095826](https://static-docs.nocobase.com/20251023095826.png)

Zadejte potřebné informace pro novou znalostní bázi:

- Do pole `Name` zadejte název znalostní báze;
- V `File storage` vyberte umístění pro ukládání souborů;
- V `Vector store` vyberte vektorové úložiště, viz [Vektorové úložiště](/ai-employees/knowledge-base/vector-store);
- Do pole `Description` zadejte popis znalostní báze;

Klikněte na tlačítko `Submit` pro vytvoření znalostní báze.

![20251023095909](https://static-docs.nocobase.com/20251023095909.png)

## Správa dokumentů ve znalostní bázi

Po vytvoření znalostní báze klikněte na stránce seznamu znalostních bází na tu, kterou jste právě vytvořili. Tím se dostanete na stránku správy dokumentů znalostní báze.

![20251023100458](https://static-docs.nocobase.com/20251023100458.png)

![20251023100527](https://static-docs.nocobase.com/20251023100527.png)

Klikněte na tlačítko `Upload` pro nahrání dokumentů. Po nahrání dokumentů se automaticky spustí vektorizace. Počkejte, dokud se `Status` nezmění ze stavu `Pending` na `Success`.

V současné době znalostní báze podporuje následující typy dokumentů: txt, pdf, doc, docx, ppt, pptx; soubory PDF podporují pouze prostý text.

![20251023100901](https://static-docs.nocobase.com/20251023100901.png)

## Typy znalostních bází

### Lokální znalostní báze

Lokální znalostní báze je typ znalostní báze, která je uložena přímo v NocoBase. Dokumenty i jejich vektorová data jsou kompletně uložena lokálně systémem NocoBase.

![20251023101620](https://static-docs.nocobase.com/20251023101620.png)

### Znalostní báze pouze pro čtení (Readonly)

Znalostní báze pouze pro čtení (Readonly) je typ znalostní báze, kde jsou dokumenty a vektorová data udržována externě. V NocoBase je vytvořeno pouze připojení k vektorové databázi (v současné době je podporován pouze PGVector).

![20251023101743](https://static-docs.nocobase.com/20251023101743.png)

### Externí znalostní báze

Externí znalostní báze je typ znalostní báze, kde jsou dokumenty a vektorová data udržována externě. Vyhledávání ve vektorové databázi vyžaduje rozšíření ze strany vývojářů, což umožňuje použití vektorových databází, které NocoBase aktuálně nepodporuje.

![20251023101949](https://static-docs.nocobase.com/20251023101949.png)