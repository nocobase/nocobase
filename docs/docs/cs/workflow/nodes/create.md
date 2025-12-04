:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Vytvořit záznam

Slouží k přidání nového záznamu do kolekce.

Hodnoty polí pro nový záznam mohou využívat proměnné z kontextu pracovního postupu. Pro přiřazení hodnot asociačním polím můžete přímo odkazovat na odpovídající datové proměnné v kontextu, které mohou být buď objektem, nebo hodnotou cizího klíče. Pokud nepoužíváte proměnné, je třeba hodnoty cizích klíčů zadat ručně. Pro více hodnot cizích klíčů u vztahů s více hodnotami je nutné je oddělit čárkami.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku, abyste přidali uzel „Vytvořit záznam“:

![Přidat uzel 'Vytvořit záznam'](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Konfigurace uzlu

![Uzel Vytvořit záznam_Příklad_Konfigurace uzlu](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Kolekce

Vyberte kolekci, do které chcete přidat nový záznam.

### Hodnoty polí

Přiřaďte hodnoty polím kolekce. Můžete použít proměnné z kontextu pracovního postupu nebo ručně zadat statické hodnoty.

:::info{title="Poznámka"}
Data vytvořená uzlem „Vytvořit záznam“ v pracovním postupu automaticky nezpracovávají uživatelská data, jako jsou „Vytvořil“ a „Naposledy upravil“. Hodnoty těchto polí je třeba podle potřeby nakonfigurovat ručně.
:::

### Přednačtení asociačních dat

Pokud pole nového záznamu obsahují asociační pole a chcete použít odpovídající asociační data v následných krocích pracovního postupu, můžete zaškrtnout odpovídající asociační pole v konfiguraci přednačtení. Tímto způsobem, po vytvoření nového záznamu, budou odpovídající asociační data automaticky načtena a uložena společně ve výsledných datech uzlu.

## Příklad

Například, když je záznam v kolekci „Příspěvky“ vytvořen nebo aktualizován, je potřeba automaticky vytvořit záznam „Verze příspěvků“, aby se zaznamenala historie změn příspěvku. K dosažení tohoto cíle můžete použít uzel „Vytvořit záznam“:

![Uzel Vytvořit záznam_Příklad_Konfigurace pracovního postupu](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Uzel Vytvořit záznam_Příklad_Konfigurace uzlu](https://static-docs.nocobase.com/1a0972e66170be12a068da6503298868.png)

Po povolení pracovního postupu s touto konfigurací, když se změní záznam v kolekci „Příspěvky“, automaticky se vytvoří záznam „Verze příspěvků“, který zaznamená historii změn příspěvku.