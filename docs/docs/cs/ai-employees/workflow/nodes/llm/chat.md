---
pkg: "@nocobase/plugin-ai"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Textový chat

## Úvod

Pomocí LLM uzlu v pracovním postupu můžete zahájit konverzaci s online službou LLM. Využijete tak schopnosti velkých modelů k podpoře a dokončení řady obchodních procesů.

![](https://static-docs.nocobase.com/202503041012091.png)

## Vytvoření LLM uzlu

Vzhledem k tomu, že konverzace se službami LLM jsou často časově náročné, lze LLM uzel použít pouze v asynchronních pracovních postupech.

![](https://static-docs.nocobase.com/202503041013363.png)

## Výběr modelu

Nejprve vyberte připojenou službu LLM. Pokud ještě nemáte připojenou žádnou službu LLM, musíte nejprve přidat její konfiguraci. Viz: [Správa služeb LLM](/ai-employees/quick-start/llm-service)

Po výběru služby se aplikace pokusí získat seznam dostupných modelů ze služby LLM, abyste si mohli vybrat. Některé online služby LLM mohou mít API pro získávání modelů, která neodpovídají standardním API protokolům; v takových případech můžete ID modelu zadat i ručně.

![](https://static-docs.nocobase.com/202503041013084.png)

## Nastavení parametrů volání

Můžete upravit parametry pro volání LLM modelu podle potřeby.

![](https://static-docs.nocobase.com/202503041014778.png)

### Response format

Za zmínku stojí nastavení **Response format**. Tato volba slouží k určení formátu odpovědi velkého modelu, který může být textový nebo JSON. Pokud zvolíte režim JSON, mějte na paměti následující:

- Odpovídající LLM model musí podporovat volání v režimu JSON. Kromě toho musíte v promptu explicitně vyzvat LLM, aby odpověděl ve formátu JSON, například: "Tell me a joke about cats, respond in JSON with \`setup\` and \`punchline\` keys". Jinak nemusí být žádná odpověď, což povede k chybě `400 status code (no body)`.
- Odpověď bude JSON řetězec. Abyste mohli použít jeho strukturovaný obsah, musíte jej analyzovat pomocí schopností jiných uzlů pracovního postupu. Můžete také použít funkci [Strukturovaný výstup](/ai-employees/workflow/nodes/llm/structured-output).

## Zprávy

Pole zpráv odeslaných LLM modelu může zahrnovat sadu historických zpráv. Zprávy podporují tři typy:

- System – Obvykle se používá k definování role a chování LLM modelu v konverzaci.
- User – Obsah zadaný uživatelem.
- Assistant – Obsah, kterým model odpověděl.

U uživatelských zpráv, za předpokladu, že to model podporuje, můžete do jednoho promptu přidat více částí obsahu, odpovídajících parametru `content`. Pokud model, který používáte, podporuje parametr `content` pouze jako řetězec (což platí pro většinu modelů, které nepodporují multimodální konverzace), rozdělte zprávu do více promptů, přičemž každý prompt obsahuje pouze jednu část obsahu. Tímto způsobem uzel odešle obsah jako řetězec.

![](https://static-docs.nocobase.com/202503041016140.png)

V obsahu zprávy můžete použít proměnné k odkazování na kontext pracovního postupu.

![](https://static-docs.nocobase.com/202503041017879.png)

## Použití obsahu odpovědi LLM uzlu

Obsah odpovědi LLM uzlu můžete použít jako proměnnou v jiných uzlech.

![](https://static-docs.nocobase.com/202503041018508.png)