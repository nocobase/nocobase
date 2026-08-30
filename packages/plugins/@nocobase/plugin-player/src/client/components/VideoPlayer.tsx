/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import Hls from 'hls.js';
import { useFieldSchema } from '@formily/react';
import { useT } from '../locale';

const VideoPlayer = (props) => {
  const { value } = props;
  const t = useT();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const flvRef = useRef<any>(null);
  const fieldSchema = useFieldSchema();
  const {
    videoWidth,
    videoAutoPlay,
    videoMuted = true,
    videoShowControls = true,
    videoLoop,
    videoIsLive,
    emptyHeight,
  } = fieldSchema['x-component-props'] || {};

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const src = value;
    if (!src) return;

    const cleanup = () => {
      try {
        hlsRef.current?.destroy?.();
      } catch (error) {
        console.error('hls video destroy error:', error);
      }
      try {
        flvRef.current?.destroy?.();
      } catch (error) {
        console.error('flv video destroy error:', error);
      }
      hlsRef.current = null;
      flvRef.current = null;
      video.pause();
      video.removeAttribute('src');
      video.srcObject = null;
      video.load();
    };

    cleanup();

    const isFlv = /\.flv(\?|#|$)/i.test(src);
    const isM3u8 = /\.m3u8(\?|#|$)/i.test(src);

    try {
      if (isFlv) {
        if (!flvjs.isSupported()) {
          console.error('flvjs is not supported');
          return;
        }
        flvRef.current = flvjs.createPlayer({
          type: 'flv',
          url: src,
          isLive: videoIsLive,
        });
        flvRef.current.attachMediaElement(video);
        flvRef.current.load();
        flvRef.current.play();
      } else if (isM3u8) {
        if (!Hls.isSupported()) {
          console.error('hls is not supported');
          return;
        }
        // HLS 通过 m3u8 自己判断直播/点播
        hlsRef.current = new Hls();
        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(video);
        // hls.play();
      } else {
        video.src = src;
      }
    } catch (error) {
      console.error('Video initialization error:', error);
    }

    return cleanup;
  }, [value, videoIsLive, videoAutoPlay, videoMuted]);

  return (
    <div>
      {value ? (
        <video
          style={{ width: videoWidth ? `${videoWidth}px` : '100%' }}
          ref={videoRef}
          muted={videoMuted}
          playsInline
          autoPlay={videoAutoPlay}
          controls={videoShowControls}
          loop={videoIsLive ? false : videoLoop}
          preload={videoIsLive ? 'none' : 'metadata'}
        ></video>
      ) : (
        <div
          style={{
            width: videoWidth ? `${videoWidth}px` : '100%',
            minHeight: emptyHeight ? `${emptyHeight}px` : '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.88)',
            borderRadius: 8,
            color: '#999',
            textAlign: 'center',
            padding: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 14 }}>{t('No video link')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
