/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionPanelScanActionModel } from '../models/actions/ActionPanelScanActionModel';
import { QRCodeScannerInner } from '../models/actions/components/qrcode-scanner';

type StartCallback = (text: string) => void;

const qrMocks = vi.hoisted(() => ({
  instances: [] as Array<{
    elementId: string;
    getState: ReturnType<typeof vi.fn>;
    scanFileV2: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    success?: StartCallback;
  }>,
}));

vi.mock('html5-qrcode', () => {
  class Html5Qrcode {
    elementId: string;
    getState = vi.fn(() => 1);
    scanFileV2 = vi.fn();
    start = vi.fn((_cameraConfig, scanConfig, onSuccess: StartCallback) => {
      scanConfig.qrbox(320, 240);
      this.success = onSuccess;
      return Promise.resolve();
    });
    stop = vi.fn(() => Promise.resolve());
    success?: StartCallback;

    constructor(elementId: string) {
      this.elementId = elementId;
      qrMocks.instances.push(this);
    }
  }

  return {
    Html5Qrcode,
    Html5QrcodeSupportedFormats: {
      CODE_128: 'CODE_128',
      CODE_39: 'CODE_39',
      QR_CODE: 'QR_CODE',
    },
    Html5QrcodeScannerState: {
      PAUSED: 3,
      SCANNING: 2,
    },
  };
});

function getScanFlow() {
  const modelClass = ActionPanelScanActionModel as typeof ActionPanelScanActionModel & {
    globalFlowRegistry: {
      getFlow: (key: string) =>
        | {
            steps: {
              scanClick: {
                handler: (ctx: {
                  app?: unknown;
                  router: { navigate: (path: string) => void };
                  t: (key: string, options?: Record<string, unknown>) => string;
                }) => Promise<void>;
              };
            };
          }
        | undefined;
    };
  };
  const flow = modelClass.globalFlowRegistry.getFlow('actionPanelScanSettings');
  expect(flow).toBeDefined();
  return flow;
}

function createActionModel() {
  const flowEngine = new FlowEngine();
  flowEngine.registerModels({ ActionPanelScanActionModel });
  return flowEngine.createModel<ActionPanelScanActionModel>({
    use: 'ActionPanelScanActionModel',
  });
}

function appendCameraVideo() {
  document.body.appendChild(document.createElement('video'));
}

describe('ActionPanelScanActionModel', () => {
  beforeEach(() => {
    qrMocks.instances.length = 0;
    document.body.innerHTML = '';
    document.documentElement.style.overscrollBehavior = '';
    appendCameraVideo();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('dispatches click events with debounce enabled', () => {
    const action = createActionModel();
    const dispatchEvent = vi.spyOn(action, 'dispatchEvent');
    vi.spyOn(action, 'getInputArgs').mockReturnValue({ record: { id: 1 } });
    const event = new MouseEvent('click');

    action.onClick(event);

    expect(dispatchEvent).toHaveBeenCalledWith(
      'click',
      {
        event,
        record: { id: 1 },
      },
      {
        debounce: true,
      },
    );
  });

  it('renders scanner overlay and removes the container on close', async () => {
    const oldContainer = document.createElement('div');
    oldContainer.id = 'qr-scanner-container';
    oldContainer.dataset.old = 'true';
    document.body.appendChild(oldContainer);
    const navigate = vi.fn();

    await act(async () => {
      await getScanFlow()?.steps.scanClick.handler({
        app: { router: { basename: '/admin' } },
        router: { navigate },
        t: (key) => key,
      });
    });

    expect(document.querySelector('[data-old="true"]')).toBeNull();
    expect(await screen.findByText('Scan QR code')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('left'));
    });

    await waitFor(() => expect(document.getElementById('qr-scanner-container')).toBeNull());
  });
});

describe('QRCodeScannerInner', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    qrMocks.instances.length = 0;
    document.body.innerHTML = '';
    appendCameraVideo();
    document.documentElement.style.overscrollBehavior = '';
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 400 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    vi.restoreAllMocks();
  });

  it('starts the camera scanner and navigates relative QR codes', async () => {
    const setVisible = vi.fn();
    const navigate = vi.fn();
    const onClose = vi.fn();

    render(
      <QRCodeScannerInner
        setVisible={setVisible}
        app={{ router: { getBasename: () => '/admin/' } }}
        navigate={navigate}
        onClose={onClose}
        t={(key) => key}
      />,
    );

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalled());
    expect(qrMocks.instances[0].elementId).toBe('qrcode');
    qrMocks.instances[0].success?.('/admin/mobile/page');

    expect(navigate).toHaveBeenCalledWith('/mobile/page');
    expect(setVisible).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('redirects absolute camera QR codes without closing the scanner', async () => {
    const setVisible = vi.fn();
    const navigate = vi.fn();
    const onClose = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        href: '',
      },
    });

    render(
      <QRCodeScannerInner setVisible={setVisible} app={{}} navigate={navigate} onClose={onClose} t={(key) => key} />,
    );

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalled());
    qrMocks.instances[0].success?.('https://example.com/report');

    expect(window.location.href).toBe('https://example.com/report');
    expect(navigate).not.toHaveBeenCalled();
    expect(setVisible).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('scans uploaded images and navigates decoded relative paths', async () => {
    const setVisible = vi.fn();
    const navigate = vi.fn();
    const onClose = vi.fn();
    const file = new File(['qr'], 'qr.png', { type: 'image/png' });

    render(
      <QRCodeScannerInner
        setVisible={setVisible}
        app={{ router: { basename: '/admin' } }}
        navigate={navigate}
        onClose={onClose}
        t={(key) => key}
      />,
    );

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalled());
    qrMocks.instances[0].getState.mockReturnValue(2);
    qrMocks.instances[0].scanFileV2.mockResolvedValue({ decodedText: '/admin/dashboard' });
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard'));
    expect(qrMocks.instances[0].stop).toHaveBeenCalled();
    expect(setVisible).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalled();
  });

  it('redirects uploaded absolute QR codes without closing the scanner', async () => {
    const setVisible = vi.fn();
    const navigate = vi.fn();
    const onClose = vi.fn();
    const file = new File(['qr'], 'qr.png', { type: 'image/png' });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        href: '',
      },
    });

    render(
      <QRCodeScannerInner setVisible={setVisible} app={{}} navigate={navigate} onClose={onClose} t={(key) => key} />,
    );

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalled());
    qrMocks.instances[0].scanFileV2.mockResolvedValue({ decodedText: 'https://example.com/from-file' });
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => expect(window.location.href).toBe('https://example.com/from-file'));
    expect(navigate).not.toHaveBeenCalled();
    expect(setVisible).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('alerts when uploaded image is too large', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const file = new File(['qr'], 'large.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1000001 });

    render(<QRCodeScannerInner setVisible={vi.fn()} app={{}} navigate={vi.fn()} t={(key) => `t:${key}`} />);

    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    expect(alertSpy).toHaveBeenCalledWith(
      't:The image size is too large. Please compress it to below 1MB before uploading',
    );
    expect(qrMocks.instances[0].scanFileV2).not.toHaveBeenCalled();
  });

  it('opens the image picker and ignores empty file selections', async () => {
    render(<QRCodeScannerInner setVisible={vi.fn()} app={{}} navigate={vi.fn()} t={(key) => key} />);

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalled());
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const inputClick = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    fireEvent.click(document.querySelector('.anticon-file-image') as HTMLElement);
    fireEvent.change(input, {
      target: { files: [] },
    });

    expect(inputClick).toHaveBeenCalled();
    expect(qrMocks.instances[0].scanFileV2).not.toHaveBeenCalled();
  });

  it('alerts and restarts camera scanning when image recognition fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const file = new File(['qr'], 'bad.png', { type: 'image/png' });

    render(<QRCodeScannerInner setVisible={vi.fn()} app={{}} navigate={vi.fn()} t={(key) => `t:${key}`} />);

    await waitFor(() => expect(qrMocks.instances[0]?.start).toHaveBeenCalledTimes(1));
    qrMocks.instances[0].scanFileV2.mockRejectedValue(new Error('bad image'));
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('t:QR code recognition failed, please scan again'));
    expect(qrMocks.instances[0].start).toHaveBeenCalledTimes(2);
  });

  it('restores overscroll behavior when unmounted', () => {
    const { unmount } = render(
      <QRCodeScannerInner setVisible={vi.fn()} app={{}} navigate={vi.fn()} t={(key) => key} />,
    );

    expect(document.documentElement.style.overscrollBehavior).toBe('none');
    unmount();

    expect(document.documentElement.style.overscrollBehavior).toBe('default');
  });
});
