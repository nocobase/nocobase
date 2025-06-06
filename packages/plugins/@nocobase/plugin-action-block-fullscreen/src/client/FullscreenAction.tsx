/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Action, ActionContextProvider } from '@nocobase/client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { DEFAULT_BLOCKSTYLECLASS, DEFAULT_TARGETSTYLECLASS, NAMESPACE } from './constants';
import { App } from 'antd';

// Types
interface StyleProperties {
  position?: string;
  top?: string;
  left?: string;
  width?: string;
  height?: string;
  zIndex?: string;
  background?: string;
  overflow?: string;
  margin?: string;
  padding?: string;
  marginBottom?: string;
  boxSizing?: string;
  maxHeight?: string;
  display?: string;
}

interface ElementState {
  originalStyles: StyleProperties;
  hiddenElements: Array<{
    element: HTMLElement;
    originalDisplay: string;
  }>;
}

interface FullscreenActionProps {
  custom?: {
    blockStyleClass?: string;
    targetStyleClass?: string;
    fullscreenStyle?: string;
  };
  onClick?: (e: React.MouseEvent) => void;
}

type StyleElement = HTMLStyleElement;

// Constants
const ELEMENT_STATES = new Map<string, ElementState>();
const FULLSCREEN_ATTRIBUTE = 'is-fullscreen';
const ID_PREFIX = {
  BLOCK: 'nb-fullscreen-block-',
  TARGET: 'nb-fullscreen-target-',
} as const;

let fullscreenStyleElement = document.createElement('style');

// Utility functions
function processFullscreenStyle(style: string, targetId: string, blockId: string): string {
  return style.replaceAll('${targetId}', `#${targetId} `).replaceAll('${blockId}', `#${blockId} `);
}

function generateElementId(prefix: string): string {
  return `${prefix}${Date.now()}`;
}

function addScopedStyle(cssString: string): StyleElement {
  const styleElement = document.createElement('style');
  styleElement.textContent = cssString;
  document.head.appendChild(styleElement);
  return styleElement;
}

function removeAddedStyle(styleElementToRemove: StyleElement | null): void {
  if (styleElementToRemove?.parentNode) {
    styleElementToRemove.parentNode.removeChild(styleElementToRemove);
  }
}

const FULLSCREEN_STYLES: StyleProperties = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100vw',
  height: '100vh',
  zIndex: '9999',
  background: '#fff',
  overflow: 'auto',
  margin: '0',
  padding: '0',
  marginBottom: '0',
  boxSizing: 'border-box',
  maxHeight: '100vh',
};

const STYLES_TO_SAVE = Object.keys(FULLSCREEN_STYLES);

function saveElementState(element: HTMLElement): ElementState {
  const state: ElementState = {
    originalStyles: {},
    hiddenElements: [],
  };

  // Save original styles
  STYLES_TO_SAVE.forEach((prop) => {
    state.originalStyles[prop as keyof StyleProperties] = element.style[prop as any] || '';
  });

  // Hide siblings and save their states
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    if (current.parentElement) {
      Array.from(current.parentElement.children).forEach((sibling) => {
        if (sibling !== current && !current!.contains(sibling) && !sibling.contains(current!)) {
          const siblingElement = sibling as HTMLElement;
          const originalDisplay = window.getComputedStyle(siblingElement).display;
          state.hiddenElements.push({
            element: siblingElement,
            originalDisplay,
          });
          siblingElement.style.display = 'none';
        }
      });
    }
    current = current.parentElement;
  }

  return state;
}

function restoreElementState(element: HTMLElement, state: ElementState): void {
  // Clear fullscreen styles
  Object.keys(FULLSCREEN_STYLES).forEach((prop) => {
    element.style[prop as any] = '';
  });

  // Restore original styles
  Object.entries(state.originalStyles).forEach(([prop, value]) => {
    if (value !== undefined && value !== null) {
      element.style[prop as any] = value;
    }
  });

  // Restore hidden elements
  state.hiddenElements.forEach(({ element: hiddenElement, originalDisplay }) => {
    try {
      if (hiddenElement?.nodeType === Node.ELEMENT_NODE) {
        hiddenElement.style.display = originalDisplay;
      }
    } catch (e) {
      console.warn('Failed to restore element display:', e);
    }
  });
}

function toggleFullscreen(element: HTMLElement, isFullscreen: boolean, fullscreenStyle: string): void {
  try {
    if (isFullscreen) {
      // Save state and apply fullscreen styles
      const state = saveElementState(element);
      ELEMENT_STATES.set(element.id, state);

      // Apply fullscreen styles
      Object.entries(FULLSCREEN_STYLES).forEach(([prop, value]) => {
        element.style[prop as any] = value;
      });

      // Add scoped styles
      fullscreenStyleElement = addScopedStyle(fullscreenStyle);
    } else {
      // Get and restore state
      const state = ELEMENT_STATES.get(element.id);
      if (!state) {
        console.warn('No saved state found for element', element.id);
        return;
      }

      restoreElementState(element, state);
      ELEMENT_STATES.delete(element.id);

      // Remove scoped styles
      if (fullscreenStyleElement) {
        removeAddedStyle(fullscreenStyleElement);
        fullscreenStyleElement = null;
      }
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error);
  }
}

/**
 * Find the first parent element with the specified class name
 * @param element - The starting element
 * @param className - The class name to search for
 * @returns The first parent element with the class or null if not found
 */
function findParentByClassName(element: HTMLElement, className: string): HTMLElement | null {
  // Start with the current element's parent
  let currentElement = element.parentElement;

  // Loop until we reach the top of the DOM or find the matching element
  while (currentElement) {
    // Check if the current element has the specified class
    if (currentElement.classList.contains(className)) {
      return currentElement;
    }

    // Move up to the next parent
    currentElement = currentElement.parentElement;
  }

  // Return null if no matching parent is found
  return null;
}

export const FullscreenAction: React.FC<FullscreenActionProps> = (props) => {
  const { message } = App.useApp();
  const { t } = useTranslation(NAMESPACE);
  const [title, setTitle] = useState(t('Fullscreen'));
  const [icon, setIcon] = useState(<FullscreenOutlined />);

  const handleClick = (e: React.MouseEvent) => {
    const blockStyleClass = props?.custom?.blockStyleClass || DEFAULT_BLOCKSTYLECLASS;
    const blockElement = findParentByClassName(e.target as HTMLElement, blockStyleClass);

    if (!blockElement) {
      message.error(t('{{blockStyleClass}} not found', { blockStyleClass }));
      return;
    }

    const blockId = blockElement.id || generateElementId(ID_PREFIX.BLOCK);
    blockElement.id = blockId;

    const targetStyleClass = props?.custom?.targetStyleClass || DEFAULT_TARGETSTYLECLASS;
    const targetElement = blockElement.querySelector(`.${targetStyleClass}`) as HTMLElement;

    if (!targetElement) {
      message.error(t('{{targetStyleClass}} not found', { targetStyleClass }));
      return;
    }

    const targetId = targetElement.id || generateElementId(ID_PREFIX.TARGET);
    targetElement.id = targetId;

    const fullscreenStyle = processFullscreenStyle(props?.custom?.fullscreenStyle || '', targetId, blockId);

    const currentState = targetElement.getAttribute(FULLSCREEN_ATTRIBUTE) === 'true';
    const targetState = !currentState;

    targetElement.setAttribute(FULLSCREEN_ATTRIBUTE, targetState.toString());
    setTitle(targetState ? t('Exit Fullscreen') : t('Fullscreen'));
    setIcon(targetState ? <FullscreenExitOutlined /> : <FullscreenOutlined />);

    toggleFullscreen(targetElement, targetState, fullscreenStyle);
  };

  return (
    <ActionContextProvider value={{ ...props }}>
      <Action icon={icon} title={title} {...props} onClick={handleClick} />
    </ActionContextProvider>
  );
};
