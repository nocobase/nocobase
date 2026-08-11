/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { useEffect, useState } from 'react';
import { stripMarkdownIframes } from '../../../../utils/markdownSanitize';

let mermaidRenderSequence = 0;

async function renderMermaidDiagrams(html: string): Promise<string> {
  const htmlContainer = document.createElement('div');
  htmlContainer.innerHTML = html;
  const sourceElements = Array.from(htmlContainer.querySelectorAll<HTMLElement>('pre.mermaid'));
  if (!sourceElements.length) {
    return html;
  }

  const { default: Mermaid } = await import('mermaid');
  Mermaid.initialize({ securityLevel: 'loose' });

  for (const sourceElement of sourceElements) {
    const renderContainer = document.createElement('div');
    document.body.appendChild(renderContainer);
    try {
      mermaidRenderSequence += 1;
      const { svg } = await Mermaid.render(
        `mermaid-container-${mermaidRenderSequence}`,
        sourceElement.textContent || '',
        renderContainer,
      );
      const svgContainer = document.createElement('div');
      svgContainer.innerHTML = svg;
      const svgElement = svgContainer.querySelector<SVGElement>('svg');
      const image = document.createElement('img');
      image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      if (svgElement?.style.maxWidth) {
        image.style.maxWidth = svgElement.style.maxWidth;
      }
      if (svgElement?.style.maxHeight) {
        image.style.maxHeight = svgElement.style.maxHeight;
      }
      sourceElement.replaceWith(image);
    } catch (error) {
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger';
      alert.textContent = String(error);
      sourceElement.replaceWith(alert);
    } finally {
      renderContainer.remove();
    }
  }

  return htmlContainer.innerHTML;
}

export const parseMarkdown = _.memoize(async (text: string): Promise<string> => {
  if (!text) {
    return text;
  }
  const m = await import('./md');
  return stripMarkdownIframes(await renderMermaidDiagrams(m.default.render(text)));
});

export function useParseMarkdown(text: string) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    setLoading(true);
    const updateHtml = async () => {
      try {
        const result = await parseMarkdown(text);
        if (current) {
          setHtml(result);
        }
      } catch (error) {
        if (current) {
          console.log(error);
        }
      } finally {
        if (current) {
          setLoading(false);
        }
      }
    };

    updateHtml();

    return () => {
      current = false;
    };
  }, [text]);

  return { html, loading };
}

export function convertToText(markdownText: string) {
  const content = markdownText;
  let temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.innerText;
  temp = null;
  return text?.replace(/[\n\r]/g, '') || '';
}
