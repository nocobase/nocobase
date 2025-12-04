:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Pokročilé

## Úvod

Velké jazykové modely (LLM) obvykle trpí zastaralostí dat a postrádají nejnovější informace. Proto online platformy pro LLM služby často nabízejí funkci webového vyhledávání, která umožňuje AI vyhledávat informace pomocí nástrojů předtím, než odpoví, a následně reagovat na základě výsledků tohoto vyhledávání.

Pro AI zaměstnance byla adaptována funkce webového vyhledávání na různých online platformách LLM služeb. Tuto funkci webového vyhledávání můžete povolit v konfiguraci modelu AI zaměstnance i přímo v konverzacích.

## Povolení funkce webového vyhledávání

Přejděte na stránku konfigurace **pluginu** AI zaměstnanců, klikněte na záložku `AI employees` a dostanete se na stránku správy AI zaměstnanců.

![20251021225643](https://static-docs.nocobase.com/20251021225643.png)

Vyberte AI zaměstnance, pro kterého chcete povolit funkci webového vyhledávání, a klikněte na tlačítko `Edit` (Upravit), čímž se dostanete na stránku úprav AI zaměstnance.

![20251022114043](https://static-docs.nocobase.com/20251022114043.png)

Na záložce `Model settings` (Nastavení modelu) zapněte přepínač `Web Search` (Webové vyhledávání) a klikněte na tlačítko `Submit` (Odeslat) pro uložení změn.

![20251022114300](https://static-docs.nocobase.com/20251022114300.png)

## Používání funkce webového vyhledávání v konverzacích

Jakmile má AI zaměstnanec povolenou funkci webového vyhledávání, objeví se v textovém poli pro zadávání konverzace ikona „Web“. Webové vyhledávání je ve výchozím nastavení povoleno a kliknutím na ikonu jej můžete vypnout.

![20251022115110](https://static-docs.nocobase.com/20251022115110.png)

Pokud je webové vyhledávání aktivní, odpověď AI zaměstnance bude obsahovat výsledky webového vyhledávání.

![20251022115502](https://static-docs.nocobase.com/20251022115502.png)

## Rozdíly v nástrojích webového vyhledávání napříč platformami

Funkce webového vyhledávání AI zaměstnanců v současné době závisí na online platformě LLM služeb, takže uživatelský zážitek se může lišit. Konkrétní rozdíly jsou následující:

| Platforma | Webové vyhledávání | Nástroje | Odpověď v reálném čase s vyhledávacími výrazy | Vrací externí odkazy jako reference v odpovědi |
| --------- | ------------------ | -------- | --------------------------------------------- | ---------------------------------------------- |
| OpenAI    | ✅                 | ✅       | ✅                                            | ✅                                             |
| Gemini    | ✅                 | ❌       | ❌                                            | ✅                                             |
| Dashscope | ✅                 | ✅       | ❌                                            | ❌                                             |
| Deepseek  | ❌                 | ❌       | ❌                                            | ❌                                             |