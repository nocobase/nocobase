/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Modal, Space, Switch, InputNumber, Form, Row, Col } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import imageCompression from 'browser-image-compression';

interface ImageEditorProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (file: File) => void;
  imageUrl: string;
  fileName: string;
  enableCompression?: boolean;
  compressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
  };
}

const centerAspectCrop = (mediaWidth: number, mediaHeight: number, aspect: number) => {
  // Let makeAspectCrop calculate the maximum possible crop size automatically
  const crop = centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 80, // Use 80% width as starting point for better UX
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );

  return crop;
};

export const ImageEditor: React.FC<ImageEditorProps> = ({
  visible,
  onCancel,
  onSave,
  imageUrl,
  fileName,
  enableCompression: enableCompressionProp = false,
  compressionOptions = {},
}) => {
  const { t } = useTranslation();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isLoading, setIsLoading] = useState(false);
  const [enableCompression, setEnableCompression] = useState(false);
  const [compressionSettings, setCompressionSettings] = useState({
    maxSizeMB: compressionOptions.maxSizeMB || 1,
    maxWidthOrHeight: compressionOptions.maxWidthOrHeight || 1920,
  });
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(1 / 1);

  useEffect(() => {
    if (visible && imageUrl) {
      setImgSrc(imageUrl);
      // Force complete reset of all crop states
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [visible, imageUrl]);

  const onSelectAspectRatio = useCallback((ratio: number | undefined) => {
    setAspectRatio(ratio);
    if (imgRef.current && ratio) {
      const crop = centerAspectCrop(imgRef.current.width, imgRef.current.height, ratio);
      setCrop(crop);
      // Also set completedCrop to the same value so it's immediately available for saving
      setCompletedCrop(crop as any);
    } else if (imgRef.current && !ratio) {
      // Free aspect ratio - clear the crop to allow free selection
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, []);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.currentTarget;

    // Always set initial crop when image loads, regardless of aspectRatio changes
    if (aspectRatio) {
      const { width, height } = image;
      const crop = centerAspectCrop(width, height, aspectRatio);
      setCrop(crop);
      // Set completedCrop immediately, let onComplete handle any issues
      setCompletedCrop(crop as any);
    }
  }, []); // Remove aspectRatio dependency to ensure it always runs

  const getCroppedImg = useCallback(async (): Promise<File> => {
    if (!imgRef.current) {
      throw new Error('No image available');
    }

    // If no crop is selected, use the entire image
    if (!completedCrop || completedCrop.width === 0 || completedCrop.height === 0) {
      const image = imgRef.current;

      if (!image.complete) {
        throw new Error('Image not fully loaded');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      ctx.drawImage(image, 0, 0);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const file = new File([blob], fileName, { type: blob.type });
            resolve(file);
          },
          'image/jpeg',
          0.95,
        );
      });
    }

    // Check if the completedCrop is too small (likely an error from ReactCrop)
    // Use relative threshold based on display size (15% of smaller dimension)
    const minCropSize = Math.min(imgRef.current.width, imgRef.current.height) * 0.15;
    const isCropTooSmall = completedCrop.width < minCropSize || completedCrop.height < minCropSize;

    // Check if aspect ratio is correct (only for fixed aspect ratios, not free ratio)
    const expectedAspectRatio = aspectRatio || 16 / 9;
    const actualAspectRatio = completedCrop.width / completedCrop.height;
    const aspectRatioMismatch = aspectRatio ? Math.abs(actualAspectRatio - expectedAspectRatio) > 0.1 : false;

    if ((isCropTooSmall || aspectRatioMismatch) && crop) {
      // Use the initial crop instead
      const image = imgRef.current;
      const displayWidth = image.width;
      const displayHeight = image.height;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;

      let cropX, cropY, cropWidth, cropHeight;

      if (crop.unit === '%') {
        cropX = Math.round((crop.x / 100) * displayWidth * scaleX);
        cropY = Math.round((crop.y / 100) * displayHeight * scaleY);
        cropWidth = Math.round((crop.width / 100) * displayWidth * scaleX);
        cropHeight = Math.round((crop.height / 100) * displayHeight * scaleY);
      } else {
        cropX = Math.round(crop.x * scaleX);
        cropY = Math.round(crop.y * scaleY);
        cropWidth = Math.round(crop.width * scaleX);
        cropHeight = Math.round(crop.height * scaleY);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const file = new File([blob], fileName, { type: blob.type });
            resolve(file);
          },
          'image/jpeg',
          0.95,
        );
      });
    }

    const image = imgRef.current;

    // Ensure image is loaded
    if (!image.complete) {
      throw new Error('Image not fully loaded');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Get the displayed image dimensions
    const displayWidth = image.width;
    const displayHeight = image.height;

    // Get the natural (original) image dimensions
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // Calculate scale factors
    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Calculate the actual crop coordinates and dimensions in the original image
    let cropX, cropY, cropWidth, cropHeight;

    if ((completedCrop as any).unit === '%') {
      // Convert percentage to pixels based on display size
      cropX = Math.round((completedCrop.x / 100) * displayWidth * scaleX);
      cropY = Math.round((completedCrop.y / 100) * displayHeight * scaleY);
      cropWidth = Math.round((completedCrop.width / 100) * displayWidth * scaleX);
      cropHeight = Math.round((completedCrop.height / 100) * displayHeight * scaleY);
    } else {
      // Already in pixels
      cropX = Math.round(completedCrop.x * scaleX);
      cropY = Math.round(completedCrop.y * scaleY);
      cropWidth = Math.round(completedCrop.width * scaleX);
      cropHeight = Math.round(completedCrop.height * scaleY);
    }

    // Validate crop dimensions
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error('Invalid crop dimensions');
    }

    if (cropX + cropWidth > naturalWidth || cropY + cropHeight > naturalHeight) {
      throw new Error('Crop area exceeds image boundaries');
    }

    // Set canvas size to the cropped dimensions
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.imageSmoothingQuality = 'high';

    // Draw the cropped portion of the image
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const file = new File([blob], fileName, { type: blob.type });
          resolve(file);
        },
        'image/jpeg',
        0.95,
      );
    });
  }, [completedCrop, fileName]);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      let processedFile = await getCroppedImg();

      // Apply compression if enabled
      if (enableCompression) {
        const options = {
          maxSizeMB: compressionSettings.maxSizeMB,
          maxWidthOrHeight: compressionSettings.maxWidthOrHeight,
          useWebWorker: true,
        };

        processedFile = await imageCompression(processedFile, options);
      }

      onSave(processedFile);
    } catch (error) {
      // Show error message to user
      alert(`${t('Error processing image')}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [getCroppedImg, onSave, enableCompression, compressionSettings, completedCrop, aspectRatio]);

  return (
    <Modal
      title={t('Edit Image')}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="save" type="primary" loading={isLoading} onClick={handleSave}>
          {t('Save')}
        </Button>,
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Toolbar */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: '#666' }}>
            {t('Drag to crop the image. Use aspect ratio buttons below to set crop proportions.')}
          </span>
        </div>

        {/* Aspect Ratio Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Button size="small" type={aspectRatio === 1 ? 'primary' : 'default'} onClick={() => onSelectAspectRatio(1)}>
            {t('1:1')}
          </Button>
          <Button
            size="small"
            type={aspectRatio === 4 / 3 ? 'primary' : 'default'}
            onClick={() => onSelectAspectRatio(4 / 3)}
          >
            {t('4:3')}
          </Button>
          <Button
            size="small"
            type={aspectRatio === 16 / 9 ? 'primary' : 'default'}
            onClick={() => onSelectAspectRatio(16 / 9)}
          >
            {t('16:9')}
          </Button>
          <Button
            size="small"
            type={aspectRatio === 3 / 2 ? 'primary' : 'default'}
            onClick={() => onSelectAspectRatio(3 / 2)}
          >
            {t('3:2')}
          </Button>
          <Button
            size="small"
            type={aspectRatio === undefined ? 'primary' : 'default'}
            onClick={() => onSelectAspectRatio(undefined)}
          >
            {t('Free')}
          </Button>
        </div>

        {/* Compression Settings */}
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: 16,
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <Space>
              <Switch checked={enableCompression} onChange={setEnableCompression} />
              <span>{t('Enable Image Compression')}</span>
            </Space>
          </div>

          {enableCompression && (
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <span>{t('Max Size (MB)')}:</span>
                </div>
                <InputNumber
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={compressionSettings.maxSizeMB}
                  onChange={(value) =>
                    setCompressionSettings((prev) => ({
                      ...prev,
                      maxSizeMB: value || 1,
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 8 }}>
                  <span>{t('Max Width/Height')}:</span>
                </div>
                <InputNumber
                  min={100}
                  max={4000}
                  step={100}
                  value={compressionSettings.maxWidthOrHeight}
                  onChange={(value) =>
                    setCompressionSettings((prev) => ({
                      ...prev,
                      maxWidthOrHeight: value || 1920,
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          )}
        </div>

        {/* Image Editor */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => {
                setCrop(c);
              }}
              onComplete={(c) => {
                // Check if this is an initial crop that's too small or has wrong aspect ratio
                const isInitialCropTooSmall = c.width < 100 || c.height < 100;
                const expectedAspectRatio = aspectRatio || 16 / 9;
                const actualAspectRatio = c.width / c.height;
                const aspectRatioMismatch = Math.abs(actualAspectRatio - expectedAspectRatio) > 0.1;

                if ((isInitialCropTooSmall || aspectRatioMismatch) && crop && crop.unit === '%') {
                  // Keep our calculated crop instead of ReactCrop's converted one
                  setCompletedCrop(crop as any);
                } else {
                  setCompletedCrop(c as any);
                  // Ensure crop state is also updated to maintain consistency
                  setCrop(c as any);
                }
              }}
              aspect={aspectRatio}
              minWidth={1}
              minHeight={1}
            >
              <img
                ref={imgRef}
                alt={t('Crop me')}
                src={imgSrc}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  display: 'block',
                }}
                onLoad={onImageLoad}
                onError={(e) => {
                  // Handle image load error silently
                }}
              />
            </ReactCrop>
          )}
        </div>
      </div>
    </Modal>
  );
};
