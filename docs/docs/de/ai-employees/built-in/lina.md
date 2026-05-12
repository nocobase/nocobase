---
title: 'Lina: Localization Engineer'
description: 'Lina is the built-in AI Employee of the Localization plugin, used to translate NocoBase system localization entries and plugin UI text.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Localization Engineer

## Role

Lina is the built-in AI Employee registered by the Localization plugin. It focuses on system localization translation, translating localization entries into the target language while preserving variables, placeholders, tags, formatting, and concise UI wording.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Tip}
Lina is a dedicated AI Employee for localization scenarios and does not use general Skills or Tools.
:::

## Scenarios

- Batch translate system and plugin entries.
- Translate localization content for collections, fields, and menus.
- Quickly generate an initial translation for a newly enabled language.
- Incrementally translate entries that already exist but are not translated yet.
- Translate only selected entries in the table.

## Prerequisites

Before using Lina, complete the following setup:

- Enable the **Localization Management** plugin.
- Configure an available LLM service and assign a default model to Lina. See [Configure AI Employee Models](/ai-employees/features/model-settings) and [Model Recommendations](#model-recommendations).
- Enable the target language in system settings.
- Synchronize the entries to translate on the Localization Management page.

:::info{title=Tip}
Lina creates translation tasks for the current locale. For example, if the current UI locale is Thai, the task generates Thai translations.
:::

## Usage

On the Localization Management page, click Lina's avatar and choose one of the AI translation task scopes.

### Incremental Translation

Only translate entries that do not have a translation for the current language. This is suitable for daily maintenance after adding plugins, fields, or menus.

### Selected Translation

Select records in the entries table first, then choose selected translation. This is suitable for retranslating a small set of entries or entries that need manual correction.

If no entry is selected, the system prompts you to select records first.

### Full Translation

Translate all eligible entries in the current language. This is suitable when generating the first version of a newly enabled language.

:::warning{title=Note}
Full translation may overwrite existing translations. Confirm the target language, entry count, and model service before starting.
:::

## Task Confirmation

Before creating the task, the system displays a confirmation dialog with:

- Number of entries to translate.
- Provider to use.
- Model to use.

After confirmation, the system creates a background task. You can view progress in async tasks. When the task completes, translations are written to the corresponding language.

![](https://static-docs.nocobase.com/202605121233608.png)

## Translation Strategy

Lina follows these rules when translating localization entries:

- Return only the translated text without explanation, summary, Markdown, or extra content.
- Preserve variables, placeholders, HTML tags, ICU syntax, code-like tokens, and formatting symbols.
- Preserve meaningful line breaks.
- Keep UI text concise and natural for buttons, fields, menus, and prompts.
- Return text unchanged if it should not be translated.

## Reference Translations

Some entries are short, such as field names, button labels, and statuses. Lina uses existing reference translations when possible to improve consistency.

- Built-in entries prefer Chinese translations as references.
- Non-built-in entries prefer the system default language as references.
- If the system default language is English, the English entry is used directly as the source.

When a reference is available, Lina uses a prompt with semantics similar to:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Model Recommendations

Localization translation usually processes many entries in one task. If possible, use a locally deployed translation-specific small model first, because online models often have API rate limits, concurrency limits, or token-per-minute limits. When many entries are translated, rate limiting can make tasks much slower or cause some requests to wait or fail.

If local deployment is not possible, use a translation-specific model rather than a general chat model. Translation models are usually better for short entries, UI text, and batch translation. If the model service supports dedicated translation parameters, the system passes source text, source language, target language, and terminology information according to the model rules.

You can adjust request concurrency according to model capability to better control throughput, response time, and cost.

:::info{title=Tip}
The concurrency of localization translation tasks is controlled by `AI_LOCALIZATION_CONCURRENCY`. The default is `10`, the allowed range is `1` to `20`, and values outside the range use the default.
:::

## Progress and Failure Handling

Lina translation tasks run as background async tasks. The task writes translation results entry by entry and updates progress.

![](https://static-docs.nocobase.com/202605121235761.png)

If an entry fails to translate, the task records the failure and stops to avoid continuing to write uncontrolled results when model calls, model output, or configuration is abnormal. Common causes include:

- AI plugin or Async Task Manager plugin is not enabled.
- Lina does not have an available model configured.
- Model service is unavailable or times out.
- Model service does not support the current request format.
- Model returns empty content.

Check async task details and server logs for provider, model, target language, failed entry ID, and model call duration.

## Review Before Publishing

After AI translation finishes, review before publishing:

- Check whether short entries such as menus, buttons, and field names fit the product context.
- Check whether variables, placeholders, and HTML tags are preserved.
- Check business terminology consistency.
- Check important pages and user-facing text for natural wording.
- If built-in entry translations are overwritten, return to Localization Management and select `Reset system built-in entry translations` during synchronization to restore defaults. To contribute default translations for the system and official plugins, see [Translation Contribution](/get-started/translations).
- Publish translations after review.
