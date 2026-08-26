---
title: "Proxy de recursos estáticos com Nginx"
description: "Use o Nginx como proxy dos recursos estáticos do NocoBase para melhorar o desempenho e a estabilidade em produção."
keywords: "Nginx,proxy de recursos estáticos,reverse proxy,implantação em produção,NocoBase"
---

# Nginx

Se você quer configurar hoje o proxy de produção para uma aplicação NocoBase, o melhor ponto de partida é [Reverse proxy em produção](../../../nocobase-cli/production/reverse-proxy/index.md) e, em seguida, a página [Nginx](../../../nocobase-cli/production/reverse-proxy/nginx.md).

Esta seção mais antiga servia principalmente como entrada para o proxy de recursos estáticos. A documentação atual foi reorganizada em torno de `nb proxy nginx`, que cobre de forma unificada a geração de configuração, a execução local ou com Docker, e as rotas `uploads`, `dist`, `api`, `ws` e SPA.
