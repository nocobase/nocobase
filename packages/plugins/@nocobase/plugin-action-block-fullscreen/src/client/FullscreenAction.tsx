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
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import { useBlockFullscreenTranslation } from './locale';
import { DEFAULT_BLOCKSTYLECLASS, DEFAULT_TARGETSTYLECLASS } from './constants';
import { App } from 'antd';

interface StoredElement {
  element: HTMLElement;
  originalDisplay: string;
}

interface ElementState {
  originalStyles: Record<string, string>;
  hiddenElements: StoredElement[];
}

// Store element states locally instead of in window
const elementStates = new Map<string, ElementState>();

let fullscreenStyleElement = document.createElement('style');

/**
 * Add scoped styles to the document head
 * @param elementId - The ID of the element to scope styles to
 * @param cssString - The CSS as a string
 */
function addScopedStyle(cssString) {
  const styleElement = document.createElement('style');

  styleElement.textContent = cssString;
  document.head.appendChild(styleElement);

  // 如果需要，可以返回 style 元素，以便将来移除
  return styleElement;
}

/**
 * Remove the added style element from the document head
 * @param styleElementToRemove - The style element to remove
 */
function removeAddedStyle(styleElementToRemove) {
  if (styleElementToRemove && styleElementToRemove.parentNode) {
    styleElementToRemove.parentNode.removeChild(styleElementToRemove);
  }
}

/**
 * Toggle fullscreen by hiding siblings at each level up to the body
 * @param element - The element to toggle fullscreen
 * @param isFullscreen - Whether to enter or exit fullscreen
 */
function toggleFullscreen(element: HTMLElement, isFullscreen: boolean, fullscreenStyle: string): void {
  if (isFullscreen) {
    // Step 1: Create state storage
    const state: ElementState = {
      originalStyles: {},
      hiddenElements: [],
    };

    // Step 2: Save original styles as simple key-value pairs
    const stylesToSave = [
      'position',
      'top',
      'left',
      'width',
      'height',
      'display',
      'margin',
      'padding',
      'zIndex',
      'background',
      'overflow',
      'boxSizing',
    ];

    stylesToSave.forEach((prop) => {
      state.originalStyles[prop] = element.style[prop as any] || '';
    });

    // Step 3: Apply fullscreen styles
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.width = '100vw';
    element.style.height = '100vh';
    element.style.zIndex = '9999';
    element.style.background = '#fff';
    element.style.overflow = 'auto';
    element.style.margin = '0';
    element.style.padding = '0';
    element.style.marginBottom = '0';
    element.style.boxSizing = 'border-box';
    element.style.maxHeight = '100vh';

    // Step 4: Hide siblings at each level
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (current.parentElement) {
        Array.from(current.parentElement.children).forEach((sibling) => {
          if (sibling !== current && !current!.contains(sibling) && !sibling.contains(current!)) {
            const siblingElement = sibling as HTMLElement;
            const originalDisplay = window.getComputedStyle(siblingElement).display;

            // Store reference and original display
            state.hiddenElements.push({
              element: siblingElement,
              originalDisplay,
            });

            // Hide the element
            siblingElement.style.display = 'none';
          }
        });
      }
      current = current.parentElement;
    }

    // Step 5: Store the state
    elementStates.set(element.id, state);

    // Add scoped styles
    fullscreenStyleElement = addScopedStyle(fullscreenStyle);
  } else {
    // Step 1: Get stored state
    const state = elementStates.get(element.id);

    if (!state) {
      console.warn('No saved state found for element', element.id);
      return;
    }

    try {
      // Step 2: Restore original styles
      const { originalStyles, hiddenElements } = state;

      // Clear fullscreen styles
      element.style.position = '';
      element.style.top = '';
      element.style.left = '';
      element.style.width = '';
      element.style.height = '';
      element.style.zIndex = '';
      element.style.background = '';
      element.style.overflow = '';
      element.style.margin = '';
      element.style.padding = '';
      element.style.marginBottom = '';
      element.style.boxSizing = '';
      element.style.maxHeight = '';

      // Apply original styles
      Object.entries(originalStyles).forEach(([prop, value]) => {
        if (value !== undefined && value !== null) {
          element.style[prop as any] = value;
        }
      });

      // Step 3: Restore hidden elements
      hiddenElements.forEach(({ element: hiddenElement, originalDisplay }) => {
        try {
          if (hiddenElement && hiddenElement.nodeType === Node.ELEMENT_NODE) {
            hiddenElement.style.display = originalDisplay;
          }
        } catch (e) {
          console.warn('Failed to restore element display:', e);
        }
      });
    } catch (error) {
      console.error('Error restoring from fullscreen:', error);
    } finally {
      // Step 4: Clean up
      elementStates.delete(element.id);

      // Remove the scoped style element
      if (fullscreenStyleElement) {
        removeAddedStyle(fullscreenStyleElement);
        fullscreenStyleElement = null;
      }
    }
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

export const FullscreenAction = (props) => {
  const { message } = App.useApp();
  const { t } = useBlockFullscreenTranslation();
  const [title, setTitle] = useState(t('Fullscreen'));
  const [icon, setIcon] = useState(<FullscreenOutlined />);

  return (
    <ActionContextProvider value={{ ...props }}>
      <Action
        icon={icon}
        title={title}
        {...props}
        onClick={(e) => {
          // Find the first parent with blockStyleClass
          const blockStyleClass = props?.custom?.blockStyleClass || DEFAULT_BLOCKSTYLECLASS;
          const blockElement = findParentByClassName(e.target as HTMLElement, blockStyleClass);
          if (!blockElement) {
            message.error(t('{{blockStyleClass}} not found', { blockStyleClass }));
            return; // Exit if no matching parent found
          }
          const blockId = blockElement?.id || `nb-fullscreen-block-${Date.now()}`;
          blockElement.id = blockId;

          // Find the target element with targetStyleClass
          const targetStyleClass = props?.custom?.targetStyleClass || DEFAULT_TARGETSTYLECLASS;
          const targetElement = blockElement.querySelector(`.${targetStyleClass}`) as HTMLElement;
          if (!targetElement) {
            message.error(t('{{targetStyleClass}} not found', { targetStyleClass }));
            return; // Exit if no target element found
          }
          const targetId = targetElement?.id || `nb-fullscreen-target-${Date.now()}`;
          targetElement.id = targetId;

          let fullscreenStyle = props?.custom?.fullscreenStyle || '';
          fullscreenStyle = fullscreenStyle.replaceAll('${targetId}', `#${targetId} `);
          fullscreenStyle = fullscreenStyle.replaceAll('${blockId}', `#${blockId} `);

          // Check if the target element is already in fullscreen mode
          const currentState = targetElement.getAttribute('is-fullscreen') === 'true';
          const targetState = !currentState;
          targetElement.setAttribute('is-fullscreen', targetState.toString());
          setTitle(targetState ? t('Exit Fullscreen') : t('Fullscreen'));
          setIcon(targetState ? <FullscreenExitOutlined /> : <FullscreenOutlined />);

          // Toggle fullscreen state
          toggleFullscreen(targetElement, targetState, fullscreenStyle);
        }}
      />
    </ActionContextProvider>
  );
};
