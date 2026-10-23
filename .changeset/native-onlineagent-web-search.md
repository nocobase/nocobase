---
'@nocobase/app-plugin-agents': minor
'@nocobase/app-template-examples': patch
---

Add opt-in native OnlineAgent web search with provider-level admission for configured OpenAI, Anthropic, Google and Alibaba chat models on official endpoints, using the selected model service with isolated retrieval, execution budgets, cancellation and usage recording. Remove model-name allowlists without claiming universal vendor compatibility. Alibaba uses its existing Chat Completions SDK with an instance-scoped search flag; source-free answers are explicitly unverified, not fabricated evidence, and display no source list. Other platforms retain strict search/source evidence requirements. Incompatible calls fail safely without fallback; other providers and compatible/custom endpoints remain unsupported.

Expose derived model capabilities and published web-search contracts, preserve the existing configuration and SDK message lifecycle, and add localized search controls and overridable result cards to the Examples chat. Include locked-SDK offline provider fixtures and desktop/mobile compiled-deployment regression coverage; real provider acceptance is not implied.


Align an unset Alibaba service endpoint with the Beijing default shown by the model-service editor instead of the SDK's implicit Singapore endpoint. Preserve explicitly configured regional endpoints and credentials.


Present web search as a full-width segmented card with independent four-line result previews and Expand/Collapse controls. Pulse the globe only while searching, omit verification labels and disclaimers from the card, and preserve evidence states and safeguards in model output and persistence.

Use one retrieval-only prompt across the four providers, returning concise facts and specific evidence gaps instead of polished answers or generic website recommendations. Guide the main model to batch distinct queries and avoid unnecessary repeated searches, while preserving structured source validation and the Alibaba-only unverified policy.

Require forced search on Alibaba's isolated retrieval calls by sending both enable_search and search_options.forced_search. Keep ordinary chat requests unchanged and retain the unverified classification for source-free answers.
