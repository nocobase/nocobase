---
pkg: "@nocobase/plugin-ai-ee"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Conversa Multimodal

## Imagens

Se o modelo suportar, o nó LLM pode enviar imagens para o modelo. Ao usar, você precisa selecionar um campo de anexo ou um registro de **coleção** de arquivos associado através de uma variável. Ao selecionar um registro de **coleção** de arquivos, você pode selecioná-lo no nível do objeto ou selecionar o campo URL.

![](https://static-docs.nocobase.com/202503041034858.png)

Há duas opções para o formato de envio de imagens:

- Enviar via URL - Todas as imagens, exceto as armazenadas localmente, serão enviadas como URLs. Imagens armazenadas localmente serão convertidas para o formato base64 antes do envio.
- Enviar via base64 - Todas as imagens, sejam armazenadas localmente ou na nuvem, serão enviadas no formato base64. Isso é adequado para casos em que a URL da imagem não pode ser acessada diretamente pelo serviço LLM online.

![](https://static-docs.nocobase.com/202503041200638.png)