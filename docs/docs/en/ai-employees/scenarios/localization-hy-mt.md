---
pkg: '@nocobase/plugin-ai'
title: 'Use Lina and local HY-MT to translate localization entries'
description: 'Deploy the HY-MT1.5 GGUF translation model with llama-server and configure it for Lina to batch translate NocoBase localization entries.'
keywords: 'Lina,localization,HY-MT,GGUF,llama-server,OpenAI compatible,AI translation,NocoBase'
---

# Use Lina and local HY-MT1.5-1.8B to translate localization entries

This guide describes a localization translation practice: deploy a translation-specific small model locally, expose it as an OpenAI-compatible service, and configure it for Lina to translate localization entries in batches.

This approach is suitable for translating many system entries, plugin text, menus, collection titles, and field labels. Compared with online models, local models are not affected by external API RPM, TPM, or concurrency limits, and concurrency can be tuned according to machine and model capability.

## Overview

This guide uses:

- Model: `tencent/HY-MT1.5-1.8B-GGUF`
- Inference service: `llama-server`
- Integration: OpenAI-compatible API
- AI Employee: Lina
- Entry point: Localization Management page

:::info{title=Note}
HY-MT1.5-1.8B is a translation-specific small model. It is more suitable for short entries, UI text, and batch translation. General chat models are not recommended as the first choice for localization tasks.
:::

## Prerequisites

Before starting, prepare:

- The **Localization Management** plugin is enabled.
- Target language is enabled.
- Localization entries have been synchronized.
- The local machine or server can run [`llama-server`](https://github.com/ggml-org/llama.cpp).
- The NocoBase service can access the HTTP address of `llama-server`.

## Deploy HY-MT GGUF

### Install llama.cpp

On macOS, you can install it with Homebrew:

```bash
brew install llama.cpp
```

You can also use a prebuilt llama.cpp binary or build it from source. The final requirement is that `llama-server` is available.

### Start an OpenAI-compatible service

Start the service with the GGUF model from Hugging Face:

```bash
llama-server \
  -hf tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M \
  --host 0.0.0.0 \
  --port 8000 \
  -c 2048 \
  -np 4
```

| Parameter | Description |
| --- | --- |
| `-hf` | Load the model from Hugging Face. |
| `--host` | Listening address. Use `127.0.0.1` for local testing or `0.0.0.0` for container or remote access. |
| `--port` | HTTP service port. |
| `-c` | Context length. Localization entries are usually short, so `2048` is usually enough. |
| `-np` | Number of parallel slots. Adjust according to machine performance. |

:::info{title=Tip}
If server resources are limited, start with `-np 1` or `-np 2`, then increase gradually after verifying stability.
:::

## Test the Model Service

After `llama-server` starts, check service health:

```bash
curl http://127.0.0.1:8000/health
```

Then test translation through the OpenAI-compatible API:

```bash
curl http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M",
    "messages": [
      {
        "role": "user",
        "content": "Translate the following text into Chinese. Output only the translated result without any additional explanation:\n\nSave"
      }
    ]
  }'
```

If you start from a local model file, change `model` to the actual model name returned or configured by the service.

:::warning{title=Note}
If a request does not respond for a long time, the model may be too slow, concurrency may be too high, or context may be too large. Lower `-np` and NocoBase translation concurrency first, then observe response time.
:::

## Configure an LLM Service in NocoBase

Go to `System Settings -> AI Employees -> LLM service` and add an LLM service.

Example configuration:

| Setting | Example |
| --- | --- |
| Provider | OpenAI (completions) |
| Title | HY-MT Local |
| Base URL | `http://127.0.0.1:8000/v1` |
| API Key | If llama-server has no authentication, use a placeholder such as `dummy`. |
| Enabled Models | Select `tencent/HY-MT1.5-1.8B-GGUF:Q4_K_M`, or enter the actual model name. |

After configuration, use `Test flight` to verify the model.

:::info{title=Tip}
If NocoBase runs in Docker, `127.0.0.1` points to the container itself and may not access the host service. Use the host IP, container network address, or `host.docker.internal`.
:::

## Configure Lina's Dedicated Model

Go to `System Settings -> AI Employees -> AI employees`, open Lina, and switch to `Model settings`.

1. Enable `Enable dedicated model configuration`.
2. Select the HY-MT local model in `Models`.
3. Save the configuration.

After this, Lina uses this model for localization translation tasks, preventing users or tasks from switching to general chat models.

For details, see [Configure AI Employee Models](/ai-employees/features/model-settings).

## Configure Translation Concurrency

Localization translation task concurrency is controlled by `AI_LOCALIZATION_CONCURRENCY`:

```bash
AI_LOCALIZATION_CONCURRENCY=10
```

Rules:

- Default: `10`
- Minimum: `1`
- Maximum: `20`
- Values outside the range use the default

The best concurrency depends on CPU, GPU, memory, model quantization, and `llama-server -np`. If the default concurrency causes issues:

1. Start with `AI_LOCALIZATION_CONCURRENCY=1` and verify single-entry translation.
2. Set both `llama-server -np` and `AI_LOCALIZATION_CONCURRENCY` to `2` or `4`.
3. Observe response time, CPU/GPU usage, and task progress.
4. Increase concurrency gradually only if stable.

:::warning{title=Note}
Do not set concurrency too high at the beginning. If concurrency exceeds actual model capacity, tasks may become slower due to queuing, timeout, or service stalls.
:::

## Execute Localization Translation

Go to `System Management -> Localization Management`.

1. Switch to the target language.
2. Click `Synchronize` to ensure entries are synchronized.
3. Click Lina's avatar.
4. Choose a task scope:
   - `Incremental translation`: translate entries that do not have translations yet.
   - `Selected translation`: translate selected entries in the table.
   - `Full translation`: translate all entries in the current language.
5. Check entry count, provider, and model in the confirmation dialog.
6. If you choose incremental translation or full translation, select a translation scope:
   - `All`
   - `Built-in entries`: system and plugin entries.
   - `Custom entries`: route names, collection and field names, and UI content.
7. Adjust reference translation languages if needed. Incremental and full translation configure reference languages separately for built-in entries and custom entries. Selected translation shows only one general reference translation language configuration.
8. Confirm to create the async task.
9. Wait for completion, review translations, and publish.

Start with `Selected translation` for a few entries to verify output style and speed before running incremental or full translation.

## How Lina Builds Translation Requests

Lina builds requests from entries and reference translations. For short entries, existing references are used to improve consistency:

- Built-in entries use Chinese translations as the default reference and Japanese as the fallback reference.
- Custom entries use the system default language as the default reference and Chinese as the fallback reference.
- Users can adjust the default language and fallback language in the task confirmation dialog.
- The system first uses the reference translation in the default language. If it does not exist, it then tries the fallback language.
- Translation results are written to the target language but are not published automatically.

Prompt semantics are similar to:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Troubleshooting

### No progress after creating a task

Check whether `llama-server` received requests. View service logs or call `/v1/chat/completions` with `curl`.

If the model receives requests but does not return, reduce:

- `AI_LOCALIZATION_CONCURRENCY`
- `llama-server -np`
- `llama-server -c`

### The model returns explanations instead of translations

Local translation models are usually more stable than general chat models. If explanations still appear, test the same prompt with `curl` first to verify the model's output style.

You can also translate shorter entries first or reduce sampling parameters such as temperature.

### NocoBase cannot connect to the model service

Check:

- Whether Base URL includes `/v1`.
- Whether the NocoBase runtime environment can access the address.
- Whether firewall or container networking blocks the port.
- Whether `llama-server` is still running.

## Review Before Publishing

After AI translation finishes, review before publishing:

- Filter by module and check short entries such as menus, buttons, field names, and statuses.
- Check variables, placeholders, HTML tags, and formatting symbols.
- Check key business terminology consistency.
- If built-in entry translations are overwritten, resynchronize in Localization Management and select `Reset system built-in entry translations` to restore defaults. To contribute default translations for the system and official plugins, see [Translation Contribution](/get-started/translations).
- Publish in a test environment first, then sync to production.

## References

- [tencent/HY-MT1.5-1.8B-GGUF](https://huggingface.co/tencent/HY-MT1.5-1.8B-GGUF)
- [llama-server documentation](https://www.mintlify.com/ggml-org/llama.cpp/inference/server)
- [Lina: Localization Engineer](/ai-employees/built-in/lina)
