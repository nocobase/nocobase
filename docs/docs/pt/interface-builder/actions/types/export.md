---
pkg: "@nocobase/plugin-action-export"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Exportar

## Introdução

A funcionalidade de exportação permite que você exporte registros filtrados no formato **Excel**, com suporte para configurar os campos a serem exportados. Você pode selecionar os campos que precisa exportar para análise, processamento ou arquivamento de dados futuros. Essa funcionalidade aumenta a flexibilidade das operações de dados, especialmente em cenários onde os dados precisam ser transferidos para outras plataformas ou processados posteriormente.

### Destaques da Funcionalidade:
- **Seleção de Campos**: Você pode configurar e selecionar os campos a serem exportados, garantindo que os dados exportados sejam precisos e concisos.
- **Suporte a Formato Excel**: Os dados exportados serão salvos como um arquivo Excel padrão, facilitando a integração e análise com outros dados.

Com essa funcionalidade, você pode facilmente exportar dados importantes do seu trabalho para uso externo, aumentando a eficiência.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)
## Configuração da Ação

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Campos Exportáveis

- Primeiro nível: Todos os campos da **coleção** atual;
- Segundo nível: Se for um campo de relacionamento, você precisa selecionar os campos da **coleção** associada;
- Terceiro nível: Apenas três níveis são processados; os campos de relacionamento do último nível não são exibidos;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Regra de Vinculação](/interface-builder/actions/action-settings/linkage-rule): Exibe/oculta o botão dinamicamente;
- [Editar Botão](/interface-builder/actions/action-settings/edit-button): Edite o título, tipo e ícone do botão;