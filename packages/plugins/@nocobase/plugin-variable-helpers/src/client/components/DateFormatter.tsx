/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { Checkbox, Input, Radio, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useState } from 'react';

// Component for displaying a date format preview
const DateFormatPreview = ({ format, date }) => {
  const content = format ? date.format(format) : null;

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
  inputValue,
  picker = 'date',
  showTimeToggle = true,
  defaultShowTime = false,
  timeFormat: initialTimeFormat = 'HH:mm:ss',
  dateFormat: initialDateFormat = 'YYYY-MM-DD',
}) => {
  const [selectedFormat, setSelectedFormat] = useState(value.format || initialDateFormat);
  const [isCustom, setIsCustom] = useState(false);
  const [showTime, setShowTime] = useState(defaultShowTime);
  const [timeFormat, setTimeFormat] = useState(initialTimeFormat);
  const date = dayjs.isDayjs(inputValue) ? inputValue : dayjs(inputValue);
  const onFormatChange = useCallback(
    (format) => {
      onChange?.({ format });
    },
    [onChange],
  );

  // Date format options
  const dateFormatOptions = [
    {
      label: (
        <>
          <span>MMMM Do YYYY</span>
          <DateFormatPreview date={date} format="MMMM Do YYYY" />
        </>
      ),
      value: 'MMMM Do YYYY',
    },
    {
      label: (
        <>
          <span>YYYY-MM-DD</span>
          <DateFormatPreview date={date} format="YYYY-MM-DD" />
        </>
      ),
      value: 'YYYY-MM-DD',
    },
    {
      label: (
        <>
          <span>MM/DD/YY</span>
          <DateFormatPreview date={date} format="MM/DD/YY" />
        </>
      ),
      value: 'MM/DD/YY',
    },
    {
      label: (
        <>
          <span>YYYY/MM/DD</span>
          <DateFormatPreview date={date} format="YYYY/MM/DD" />
        </>
      ),
      value: 'YYYY/MM/DD',
    },
    {
      label: (
        <>
          <span>DD/MM/YYYY</span>
          <DateFormatPreview date={date} format="DD/MM/YYYY" />
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
          <DateFormatPreview date={date} format="hh:mm:ss a" />
        </>
      ),
      value: 'hh:mm:ss a',
    },
    {
      label: (
        <>
          <span>HH:mm:ss</span>
          <DateFormatPreview date={date} format="HH:mm:ss" />
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
      onFormatChange(newFormat);
      setShowTime(false);
    }
  }, [picker, onFormatChange]);

  // Update parent component with combined format
  useEffect(() => {
    let finalFormat = selectedFormat;

    if (showTime && picker === 'date') {
      finalFormat = `${selectedFormat} ${timeFormat}`;
    }

    onFormatChange(finalFormat);
  }, [selectedFormat, showTime, timeFormat, onFormatChange, picker]);

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
          {/* <Space direction="vertical"> */}
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
                  <DateFormatPreview date={date} format={selectedFormat} />
                </>
              ) : (
                option.label
              )}
            </Radio>
          ))}
          {/* </Space> */}
        </Radio.Group>
      </div>

      {showTimeToggle && picker === 'date' && (
        <>
          <div style={{ margin: '6px 0' }}>
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
              <div style={{ marginBottom: 3 }}>Time format</div>
              <Radio.Group value={timeFormat} onChange={handleTimeFormatChange}>
                {/* <Space direction="vertical"> */}
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
                        <DateFormatPreview date={date} format={timeFormat} />
                      </>
                    ) : (
                      option.label
                    )}
                  </Radio>
                ))}
                {/* </Space> */}
              </Radio.Group>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DateFormat;
