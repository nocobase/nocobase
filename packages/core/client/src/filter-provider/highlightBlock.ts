let container: HTMLElement | null = null;

export const highlightBlock = (clonedBlockDom: HTMLElement, boxRect: DOMRect) => {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    container.style.position = 'absolute';
    container.style.transition = 'opacity 0.3s ease';
    container.style.pointerEvents = 'none';
  }

  container.appendChild(clonedBlockDom);
  container.style.opacity = '1';
  container.style.width = `${boxRect.width}px`;
  container.style.height = `${boxRect.height}px`;
  container.style.top = `${boxRect.top}px`;
  container.style.left = `${boxRect.left}px`;
  container.style.zIndex = '2000';
}

export const unhighlightBlock = () => {
  if (container) {
    container.style.opacity = '0';
    container.innerHTML = '';
  }
}

export const startScrollEndTracking = (dom: HTMLElement & { _prevRect?: DOMRect; _timer?: any }, callback: () => void) => {
  dom._timer = setInterval(() => {
    const prevRect = dom._prevRect;
    const currentRect = dom.getBoundingClientRect();

    if (!prevRect || currentRect.top !== prevRect.top) {
      dom._prevRect = currentRect;
    } else {
      clearInterval(dom._timer);
      callback();
    }
  }, 100)
}

export const stopScrollEndTracking = (dom: HTMLElement & { _timer?: any }) => {
  if (dom._timer) {
    clearInterval(dom._timer);
    dom._timer = null;
  }
}
