---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/ai-employees/workflow/nodes/llm/chat).
:::

# Textová konverzace

## Úvod

Pomocí LLM uzlu v pracovním postupu můžete zahájit konverzaci s online službou LLM a využít schopnosti velkých modelů k asistenci při dokončování řady obchodních procesů.

![](https://static-docs.nocobase.com/202503041012091.png)

## Vytvoření nového LLM uzlu

Protože konverzace se službou LLM obvykle trvá delší dobu, lze LLM uzel použít pouze v asynchronních pracovních postupech.

![](https://static-docs.nocobase.com/202503041013363.png)

## Výběr modelu

Nejprve vyberte již připojenou službu LLM. Pokud ještě nemáte připojenou žádnou službu LLM, musíte nejprve přidat konfiguraci služby LLM. Viz: [Správa služeb LLM](/ai-employees/features/llm-service)

Po výběru služby se aplikace pokusí získat seznam dostupných modelů ze služby LLM pro výběr. Rozhraní některých online služeb LLM pro získávání modelů nemusí odpovídat standardním API protokolům, uživatelé mohou také ručně zadat ID modelu.

![](https://static-docs.nocobase.com/202503041013084.png)

## Nastavení parametrů volání

Parametry volání LLM modelu můžete upravit podle potřeby.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Za zmínku stojí nastavení **Response format**, které slouží k určení formátu obsahu odpovědi velkého modelu, což může být text nebo JSON. Pokud zvolíte režim JSON, je třeba vzít v úvahu:

- Odpovídající LLM model musí podporovat volání v režimu JSON a zároveň musí uživatel v Promptu jasně instruovat LLM k odpovědi ve formátu JSON, například: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". V opačném případě nemusí dojít k žádné odpovědi a zobrazí se chyba `400 status code (no body)`.
- Výsledek odpovědi je JSON řetězec, který musí uživatel analyzovat pomocí schopností jiných uzlů pracovního postupu, než bude moci použít jeho strukturovaný obsah. Můžete také použít funkci [Strukturovaný výstup](/ai-employees/workflow/nodes/llm/structured-output).

## Zprávy

Pole zpráv odesílaných LLM modelu, které může obsahovat sadu historických zpráv. Zprávy podporují tři typy:

- System – Obvykle se používá k definování role a chování LLM modelu v konverzaci.
- User – Obsah zadaný uživatelem.
- Assistant – Obsah, kterým model odpověděl.

U uživatelských zpráv můžete, pokud to model podporuje, přidat do jednoho promptu více položek obsahu, což odpovídá parametru `content`. Pokud používaný model podporuje pouze parametr `content` ve formě řetězce (což je případ většiny modelů, které nepodporují multimodální konverzace), rozdělte prosím zprávu do více promptů, přičemž každý prompt bude obsahovat pouze jednu položku obsahu. Tímto způsobem uzel odešle obsah jako řetězec.

![](https://static-docs.nocobase.com/202503041016140.png)

V obsahu zprávy můžete použít proměnné k odkazování na kontext pracovního postupu.

![](https://static-docs.nocobase.com/202503041017879.png)

## Použití obsahu odpovědi LLM uzlu

Obsah odpovědi LLM uzlu můžete použít jako proměnnou v jiných uzlech.

![](https://static-docs.nocobase.com/202503041018508.png)