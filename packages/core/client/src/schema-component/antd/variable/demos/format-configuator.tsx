/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { css } from '@emotion/css';
import {
  Filter,
  ISchema,
  Plugin,
  SchemaComponent,
  SchemaSettings,
  SchemaSettingsDataScope,
  SchemaSettingsModalItem,
  TableBlockProvider,
  useTableBlockProps,
} from '@nocobase/client';
import { mockApp } from '@nocobase/client/demo-utils';
import { Checkbox, Input, Radio, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

// Component for displaying a date format preview
const DateFormatPreview = ({ format }) => {
  const content = format ? dayjs().format(format) : null;

  if (!content) return null;

  return (
    <span
      style={{
        display: 'inline-block',
        background: '#f5f5f5',
        marginLeft: 8,
        lineHeight: '1',
        padding: 4,
        borderRadius: 4,
      }}
    >
      {content}
    </span>
  );
};

// Main DateFormat component
const DateFormat = ({
  value,
  onChange,
  picker = 'date',
  showTimeToggle = true,
  defaultShowTime = false,
  timeFormat: initialTimeFormat = 'HH:mm:ss',
  dateFormat: initialDateFormat = 'YYYY-MM-DD',
}) => {
  const [selectedFormat, setSelectedFormat] = useState(value || initialDateFormat);
  const [isCustom, setIsCustom] = useState(false);
  const [showTime, setShowTime] = useState(defaultShowTime);
  const [timeFormat, setTimeFormat] = useState(initialTimeFormat);

  // Date format options
  const dateFormatOptions = [
    {
      label: (
        <>
          <span>MMMM Do YYYY</span>
          <DateFormatPreview format="MMMM Do YYYY" />
        </>
      ),
      value: 'MMMM Do YYYY',
    },
    {
      label: (
        <>
          <span>YYYY-MM-DD</span>
          <DateFormatPreview format="YYYY-MM-DD" />
        </>
      ),
      value: 'YYYY-MM-DD',
    },
    {
      label: (
        <>
          <span>MM/DD/YY</span>
          <DateFormatPreview format="MM/DD/YY" />
        </>
      ),
      value: 'MM/DD/YY',
    },
    {
      label: (
        <>
          <span>YYYY/MM/DD</span>
          <DateFormatPreview format="YYYY/MM/DD" />
        </>
      ),
      value: 'YYYY/MM/DD',
    },
    {
      label: (
        <>
          <span>DD/MM/YYYY</span>
          <DateFormatPreview format="DD/MM/YYYY" />
        </>
      ),
      value: 'DD/MM/YYYY',
    },
    { label: 'Custom', value: 'custom' },
  ];

  // Time format options
  const timeFormatOptions = [
    {
      label: (
        <>
          <span>hh:mm:ss a</span>
          <DateFormatPreview format="hh:mm:ss a" />
        </>
      ),
      value: 'hh:mm:ss a',
    },
    {
      label: (
        <>
          <span>HH:mm:ss</span>
          <DateFormatPreview format="HH:mm:ss" />
        </>
      ),
      value: 'HH:mm:ss',
    },
    { label: 'Custom', value: 'custom' },
  ];

  // Get appropriate format for picker type
  const getPickerFormat = (pickerType) => {
    switch (pickerType) {
      case 'week':
        return 'YYYY[W]W';
      case 'month':
        return 'YYYY-MM';
      case 'quarter':
        return 'YYYY[Q]Q';
      case 'year':
        return 'YYYY';
      default:
        return 'YYYY-MM-DD';
    }
  };

  // Update format when picker changes
  useEffect(() => {
    if (picker !== 'date') {
      const newFormat = getPickerFormat(picker);
      setSelectedFormat(newFormat);
      onChange?.(newFormat);
      setShowTime(false);
    }
  }, [picker]);

  // Update parent component with combined format
  useEffect(() => {
    let finalFormat = selectedFormat;

    if (showTime && picker === 'date') {
      finalFormat = `${selectedFormat} ${timeFormat}`;
    }

    onChange?.(finalFormat);
  }, [selectedFormat, showTime, timeFormat]);

  // Handle date format change
  const handleDateFormatChange = (e) => {
    const format = e.target.value;

    if (format === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSelectedFormat(format);
    }
  };

  // Handle custom format input
  const handleCustomFormatChange = (e) => {
    setSelectedFormat(e.target.value);
  };

  // Handle time format change
  const handleTimeFormatChange = (e) => {
    setTimeFormat(e.target.value);
  };

  // Handle show time toggle
  const handleShowTimeChange = (e) => {
    setShowTime(e.target.checked);
  };

  return (
    <div>
      <div
        className={css`
          .ant-radio-wrapper {
            display: flex;
            margin: 5px 0;
            align-items: center;
          }
        `}
      >
        <Radio.Group value={isCustom ? 'custom' : selectedFormat} onChange={handleDateFormatChange}>
          <Space direction="vertical">
            {dateFormatOptions.map((option) => (
              <Radio key={option.value} value={option.value}>
                {option.value === 'custom' ? (
                  <>
                    <Input
                      style={{ width: 150, marginRight: 8 }}
                      value={selectedFormat}
                      onChange={handleCustomFormatChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <DateFormatPreview format={selectedFormat} />
                  </>
                ) : (
                  option.label
                )}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      </div>

      {showTimeToggle && picker === 'date' && (
        <>
          <div style={{ margin: '12px 0' }}>
            <Checkbox checked={showTime} onChange={handleShowTimeChange}>
              Show time
            </Checkbox>
          </div>

          {showTime && (
            <div
              className={css`
                .ant-radio-wrapper {
                  display: flex;
                  margin: 5px 0;
                  align-items: center;
                }
              `}
            >
              <div style={{ marginBottom: 8 }}>Time format</div>
              <Radio.Group value={timeFormat} onChange={handleTimeFormatChange}>
                <Space direction="vertical">
                  {timeFormatOptions.map((option) => (
                    <Radio key={option.value} value={option.value}>
                      {option.value === 'custom' ? (
                        <>
                          <Input
                            style={{ width: 150, marginRight: 8 }}
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <DateFormatPreview format={timeFormat} />
                        </>
                      ) : (
                        option.label
                      )}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          )}
        </>
      )}
    </div>
  );
};

class DemoPlugin extends Plugin {
  async load() {
    this.app.router.add('root', { path: '/', Component: DateFormat });
  }
}

const app = mockApp({
  plugins: [DemoPlugin],
  components: {
    TableBlockProvider,
  },
});

export default app.getRootComponent();
