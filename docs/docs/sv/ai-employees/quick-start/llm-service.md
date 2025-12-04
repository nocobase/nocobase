:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Snabbstart

## Introduktion

Innan ni kan använda AI-medarbetaren behöver ni ansluta till en online LLM-tjänst. NocoBase stöder för närvarande de flesta vanliga online LLM-tjänsterna, som till exempel OpenAI, Gemini, Claude, DepSeek, Qwen med flera.
Utöver online LLM-tjänster stöder NocoBase även anslutning till lokala Ollama-modeller.

## Konfigurera LLM-tjänsten

Gå till konfigurationssidan för AI-medarbetarens plugin, klicka på fliken `LLM service` för att komma till hanteringssidan för LLM-tjänster.

![20251021213122](https://static-docs.nocobase.com/20251021213122.png)

Håll muspekaren över knappen `Add New` i det övre högra hörnet av LLM-tjänstlistan och välj den LLM-tjänst ni vill använda.

![20251021213358](https://static-docs.nocobase.com/20251021213358.png)

Som exempel tar vi OpenAI. I popup-fönstret anger ni en lätt ihågkommen `title`, sedan fyller ni i den `API key` ni fått från OpenAI och klickar på `Submit` för att spara. Därmed är konfigurationen av LLM-tjänsten klar.

`Base URL` kan oftast lämnas tomt. Om ni använder en tredjeparts LLM-tjänst som är kompatibel med OpenAI API, vänligen fyll i motsvarande Base URL.

![20251021214549](https://static-docs.nocobase.com/20251021214549.png)

## Tillgänglighetstest

På konfigurationssidan för LLM-tjänsten klickar ni på knappen `Test flight`, anger namnet på den modell ni vill använda och klickar sedan på `Run`-knappen för att testa om LLM-tjänsten och modellen är tillgängliga.

![20251021214903](https://static-docs.nocobase.com/20251021214903.png)