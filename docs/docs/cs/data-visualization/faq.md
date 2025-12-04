:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Často kladené otázky

## Výběr grafu
### Jak vybrat vhodný graf?
Odpověď: Volte na základě vašich dat a cílů:
- Trendy a změny: spojnicový graf nebo plošný graf
- Porovnání hodnot: sloupcový graf nebo pruhový graf
- Poměrové složení: koláčový graf nebo prstencový graf
- Korelace a distribuce: bodový graf
- Hierarchická struktura a průběh fází: trychtýřový graf

Další typy grafů naleznete v [příkladech ECharts](https://echarts.apache.org/examples).

### Jaké typy grafů NocoBase podporuje?
Odpověď: Režim vizuální konfigurace obsahuje běžné grafy (spojnicový, plošný, sloupcový, pruhový, koláčový, prstencový, trychtýřový, bodový atd.). Režim vlastní konfigurace pak podporuje všechny typy grafů ECharts.

## Problémy s dotazováním dat
### Sdílí režimy vizuální konfigurace a SQL konfigurace své nastavení?
Odpověď: Nejsou. Jejich nastavení jsou uložena samostatně. Platí režim konfigurace, který byl použit při posledním uložení.

## Možnosti grafu
### Jak nastavit pole grafu?
Odpověď: V režimu vizuální konfigurace vyberte pole dat podle typu grafu. Například spojnicové/sloupcové grafy vyžadují konfiguraci polí osy X a osy Y, zatímco koláčové grafy potřebují pole pro kategorii a pole pro hodnotu.
Doporučujeme nejprve spustit „Spustit dotaz“ a zkontrolovat, zda data odpovídají očekávání. Ve výchozím nastavení se pole grafu automaticky spárují.

## Problémy s náhledem a uložením
### Je nutné ručně zobrazit náhled po úpravě konfigurace?
Odpověď: V režimu vizuální konfigurace se změny automaticky zobrazí v náhledu. V režimech SQL a vlastní konfigurace, abyste předešli častému obnovování, dokončete úpravy a poté ručně klikněte na „Náhled“.

### Proč se náhled grafu ztratil po zavření vyskakovacího okna?
Odpověď: Náhled slouží pouze k dočasnému zobrazení. Po úpravě konfigurace ji prosím nejprve uložte a teprve poté zavřete. Neuložené změny nebudou zachovány.