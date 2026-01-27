:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Dotazování dat

Slouží k dotazování a získávání datových záznamů z kolekce, které splňují specifické podmínky.

Můžete jej nakonfigurovat pro dotazování jednoho záznamu nebo více záznamů. Výsledek dotazu lze použít jako proměnnou v následných uzlech. Při dotazování více záznamů je výsledek pole. Pokud je výsledek dotazu prázdný, můžete zvolit, zda se má pokračovat v provádění následných uzlů.

## Vytvoření uzlu

V rozhraní konfigurace pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „Dotazování dat“:

![Add Query Data Node](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Konfigurace uzlu

![Query Node Configuration](https://static-docs.nocobase.com/20240520131324.png)

### Kolekce

Vyberte kolekci, ze které chcete dotazovat data.

### Typ výsledku

Typ výsledku se dělí na „Jeden záznam“ a „Více záznamů“:

-   Jeden záznam: Výsledek je objekt, který představuje pouze první odpovídající záznam, nebo `null`.
-   Více záznamů: Výsledek bude pole obsahující záznamy, které odpovídají podmínkám. Pokud se žádné záznamy neshodují, bude to prázdné pole. Můžete je zpracovat jeden po druhém pomocí cyklického uzlu.

### Podmínky filtrování

Podobně jako u podmínek filtrování při běžném dotazování kolekce, můžete použít kontextové proměnné pracovního postupu.

### Řazení

Při dotazování jednoho nebo více záznamů můžete použít pravidla řazení k řízení požadovaného výsledku. Například pro dotazování nejnovějšího záznamu můžete řadit podle pole „Čas vytvoření“ v sestupném pořadí.

### Stránkování

Pokud může být sada výsledků velmi velká, můžete použít stránkování k řízení počtu výsledků dotazu. Například pro dotazování nejnovějších 10 záznamů můžete řadit podle pole „Čas vytvoření“ v sestupném pořadí a poté nastavit stránkování na 1 stránku s 10 záznamy.

### Zpracování prázdných výsledků

V režimu jednoho záznamu, pokud žádná data nesplňují podmínky, bude výsledek dotazu `null`. V režimu více záznamů to bude prázdné pole (`[]`). Můžete zvolit, zda zaškrtnout „Ukončit pracovní postup, pokud je výsledek dotazu prázdný“. Pokud je zaškrtnuto a výsledek dotazu je prázdný, následné uzly nebudou provedeny a pracovní postup se předčasně ukončí se stavem selhání.