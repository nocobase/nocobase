/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Options } from 'amqplib';

export const getAmqpUrl = () => {
  const vhost = process.env.RABBITMQ_VHOST ? `/${process.env.RABBITMQ_VHOST}` : '';
  const uri = process.env.RABBITMQ_HOST
    ? `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${vhost}`
    : process.env.QUEUE_URI;

  return uri;
};

export const getAmqpConnectionOptions = (): Options.Connect => {
  const protocol = process.env.RABBITMQ_PROTOCOL || 'amqp';
  const port = process.env.RABBITMQ_PORT ? parseInt(process.env.RABBITMQ_PORT) : 5672;
  return {
    protocol,
    hostname: process.env.RABBITMQ_HOST,
    port,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
    vhost: process.env.RABBITMQ_VHOST || '/',
    frameMax: 0,
  };
};
