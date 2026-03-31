---
pkg: "@nocobase/plugin-ai-ee"
---

# Multimodal Conversation

## Images

If the model supports it, the LLM node can send images to the model. When using it, you need to select an attachment field or an associated file collection record via a variable. When selecting a file collection record, you can select it at the object level or select the URL field.


![](https://static-docs.nocobase.com/202503041034858.png)


There are two options for the image sending format:

- Send via URL - All images, except for those stored locally, will be sent as URLs. Locally stored images will be converted to base64 format before sending.
- Send via base64 - All images, whether stored locally or in the cloud, will be sent in base64 format. This is suitable for cases where the image URL cannot be directly accessed by the online LLM service.


![](https://static-docs.nocobase.com/202503041200638.png)