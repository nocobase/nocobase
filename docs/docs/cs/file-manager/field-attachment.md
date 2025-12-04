:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pole Příloha

## Úvod

Systém obsahuje vestavěné pole typu „Příloha“, které umožňuje uživatelům nahrávat soubory do vlastních kolekcí.

Pole Příloha je v základu pole pro vztah typu Mnoho k mnoha, které odkazuje na vestavěnou kolekci „Přílohy“ (`attachments`). Jakmile vytvoříte pole Příloha v jakékékoli kolekci, automaticky se vygeneruje spojovací tabulka pro tento vztah Mnoho k mnoha. Metadata nahraných souborů se ukládají do kolekce „Přílohy“ a informace o souborech odkazované z vaší kolekce jsou propojeny právě prostřednictvím této spojovací tabulky.

## Konfigurace pole

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Omezení typu MIME

Slouží k omezení typů souborů, které lze nahrát. Používá se formát popisu se syntaxí [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Například: `image/*` představuje soubory obrázků. Více typů lze oddělit čárkou, například: `image/*,application/pdf` povoluje soubory typu obrázek i PDF.

### Úložný engine

Zde vyberte úložný engine pro ukládání nahraných souborů. Pokud toto pole necháte prázdné, použije se výchozí úložný engine systému.