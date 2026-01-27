:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pole přílohy

## Úvod

Systém má vestavěné pole typu "Příloha", které slouží k podpoře nahrávání souborů uživateli do vlastních kolekcí.

Interně je pole přílohy polem vztahu mnoho k mnoha, které odkazuje na vestavěnou kolekci systému "Přílohy" (`attachments`). Když vytvoříte pole přílohy v jakékoli kolekci, automaticky se vygeneruje spojovací tabulka vztahu mnoho k mnoha. Metadata nahraných souborů se ukládají do kolekce "Přílohy" a informace o souborech odkazované ve vaší kolekci jsou propojeny prostřednictvím této spojovací tabulky.

## Konfigurace pole

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

### Omezení typu MIME

Slouží k omezení povolených typů souborů pro nahrávání, a to pomocí syntaxe [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Například: `image/*` představuje soubory obrázků. Více typů lze oddělit čárkami, například `image/*,application/pdf`, což povoluje soubory obrázků i PDF.

### Úložný engine

Vyberte úložný engine pro nahrané soubory. Pokud nevyplníte, použije se výchozí úložný engine systému.