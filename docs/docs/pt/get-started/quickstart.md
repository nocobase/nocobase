---
versions:
  - label: Mais Recente (Estável)
    features: Recursos estáveis, bem testados, apenas correções de bugs.
    audience: Usuários que buscam uma experiência estável e implantações em produção.
    stability: ★★★★★
    production_recommendation: Recomendado
  - label: Beta
    features: Inclui novos recursos que serão lançados, com testes iniciais, podendo apresentar alguns problemas.
    audience: Usuários que desejam experimentar novos recursos antecipadamente e fornecer feedback.
    stability: ★★★★☆
    production_recommendation: Usar com cautela
  - label: Alpha (Desenvolvimento)
    features: Versão em desenvolvimento, com os recursos mais recentes, mas que podem estar incompletos ou instáveis.
    audience: Usuários técnicos e contribuidores interessados em desenvolvimento de ponta.
    stability: ★★☆☆☆
    production_recommendation: Usar com cautela

install_methods:
  - label: Instalação Docker (Recomendado)
    features: Não exige código, instalação simples, ideal para testes rápidos.
    scenarios: Usuários sem código, usuários que desejam implantar rapidamente em um servidor.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Puxe a imagem mais recente e reinicie o contêiner.
  - label: Instalação via create-nocobase-app
    features: Código da aplicação independente, suporta extensões de plugins e personalização da interface.
    scenarios: Desenvolvedores front-end/full-stack, projetos em equipe, desenvolvimento low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Atualize as dependências com yarn.
  - label: Instalação via Código Fonte Git
    features: Obtenha o código fonte mais recente, ideal para contribuir e depurar.
    scenarios: Desenvolvedores técnicos, usuários que desejam experimentar versões não lançadas.
    technical_requirement: ★★★★★
    upgrade_method: Sincronize as atualizações através do fluxo Git.
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Comparação de Métodos de Instalação e Versões

Você pode instalar o NocoBase de diferentes maneiras.

## Comparação de Versões

| Item | **Mais Recente (Estável)** | **Beta** | **Alpha (Desenvolvimento)** |
|------|------------------------|----------------------|-----------------------|
| **Características** | Recursos estáveis, bem testados, apenas correções de bugs. | Inclui novos recursos que serão lançados, com testes iniciais, podendo apresentar alguns problemas. | Versão em desenvolvimento, com os recursos mais recentes, mas que podem estar incompletos ou instáveis. |
| **Público-alvo** | Usuários que buscam uma experiência estável e implantações em produção. | Usuários que desejam experimentar novos recursos antecipadamente e fornecer feedback. | Usuários técnicos e contribuidores interessados em desenvolvimento de ponta. |
| **Estabilidade** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Recomendado para Produção** | Recomendado | Usar com cautela | Usar com cautela |

## Comparação de Métodos de Instalação

| Item | **Instalação Docker (Recomendado)** | **Instalação via create-nocobase-app** | **Instalação via Código Fonte Git** |
|------|--------------------------|------------------------------|------------------|
| **Características** | Não exige código, instalação simples, ideal para testes rápidos. | Código da aplicação independente, suporta extensões de plugins e personalização da interface. | Obtenha o código fonte mais recente, ideal para contribuir e depurar. |
| **Cenários de Uso** | Usuários sem código, usuários que desejam implantar rapidamente em um servidor. | Desenvolvedores front-end/full-stack, projetos em equipe, desenvolvimento low-code. | Desenvolvedores técnicos, usuários que desejam experimentar versões não lançadas. |
| **Requisito Técnico** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Método de Atualização** | Puxe a imagem mais recente e reinicie o contêiner. | Atualize as dependências com yarn. | Sincronize as atualizações através do fluxo Git. |
| **Tutoriais** | [<code>Instalação</code>](#) [<code>Atualização</code>](#) [<code>Implantação</code>](#) | [<code>Instalação</code>](#) [<code>Atualização</code>](#) [<code>Implantação</code>](#) | [<code>Instalação</code>](#) [<code>Atualização</code>](#) [<code>Implantação</code>](#) |