---
pkg: "@nocobase/plugin-ai"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Textchatt

## Introduktion

Genom att använda LLM-noden i ett arbetsflöde kan ni starta en konversation med en online LLM-tjänst. Detta gör att ni kan utnyttja de stora modellernas kapacitet för att automatisera och slutföra en rad affärsprocesser.

![](https://static-docs.nocobase.com/202503041012091.png)

## Skapa LLM-nod

Eftersom konversationer med LLM-tjänster ofta är tidskrävande, kan LLM-noden endast användas i asynkrona arbetsflöden.

![](https://static-docs.nocobase.com/202503041013363.png)

## Välj modell

Välj först en ansluten LLM-tjänst. Om ni ännu inte har anslutit någon LLM-tjänst behöver ni först lägga till en konfiguration för LLM-tjänsten. Se: [Hantera LLM-tjänster](/ai-employees/quick-start/llm-service)

Efter att ni har valt en tjänst kommer applikationen att försöka hämta en lista över tillgängliga modeller från LLM-tjänsten som ni kan välja mellan. Vissa online LLM-tjänster kan ha API:er för att hämta modeller som inte följer standardiserade API-protokoll; i sådana fall kan användare även manuellt ange modell-ID:t.

![](https://static-docs.nocobase.com/202503041013084.png)

## Ställ in anropsparametrar

Ni kan justera parametrarna för att anropa LLM-modellen efter behov.

![](https://static-docs.nocobase.com/202503041014778.png)

### Svarsformat

Det är värt att notera inställningen **Svarsformat**. Denna inställning används för att ange vilket format den stora modellen ska svara i, antingen text eller JSON. Om ni väljer JSON-läge, tänk på följande:

- Den aktuella LLM-modellen måste stödja anrop i JSON-läge. Dessutom måste användaren uttryckligen ange i prompten att LLM:en ska svara i JSON-format, till exempel: "Tell me a joke about cats, respond in JSON with `setup` and `punchline` keys". Annars kan det hända att ni inte får något svar, vilket resulterar i felet `400 status code (no body)`.
- Svaret blir en JSON-sträng. Användaren behöver sedan tolka den med hjälp av andra noder i arbetsflödet för att kunna använda det strukturerade innehållet. Ni kan också använda funktionen [Strukturerad utdata](/ai-employees/workflow/nodes/llm/structured-output).

## Meddelanden

Meddelandearrayen som skickas till LLM-modellen kan innehålla en uppsättning historiska meddelanden. Meddelanden stöder tre typer:

- System – Används vanligtvis för att definiera LLM-modellens roll och beteende i konversationen.
- Användare – Innehållet som matas in av användaren.
- Assistent – Innehållet som modellen svarar med.

För användarmeddelanden kan ni, förutsatt att modellen stöder det, lägga till flera delar av innehåll i en enda prompt, vilket motsvarar parametern `content`. Om modellen ni använder endast stöder parametern `content` som en sträng (vilket är fallet för de flesta modeller som inte stöder multimodala konversationer), vänligen dela upp meddelandet i flera prompter, där varje prompt endast innehåller en del av innehållet. På så sätt skickar noden innehållet som en sträng.

![](https://static-docs.nocobase.com/202503041016140.png)

Ni kan använda variabler i meddelandeinnehållet för att referera till arbetsflödets kontext.

![](https://static-docs.nocobase.com/202503041017879.png)

## Använda LLM-nodens svarsinnehåll

Ni kan använda LLM-nodens svarsinnehåll som en variabel i andra noder.

![](https://static-docs.nocobase.com/202503041018508.png)