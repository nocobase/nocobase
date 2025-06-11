/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/** redis 历史脏数据清除，上线后手动执行，确保匹配 key 正确后再执行删除 */
import dayjs from 'dayjs';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// 解析命令行参数
const argv = yargs(hideBin(process.argv)).argv as unknown as {
  size: number;
  duration: number;
  del: boolean;
  delPattern: string;
};

// 连接到 Redis
const redis = new Redis(process.env.CACHE_REDIS_URL);

// 每次删除的键数量
const BATCH_SIZE = argv.size ?? 10000;

// 删除键的函数
async function deleteKeys(pattern = '*', duration, shouldDelete) {
  let cursor = '0';
  const filePath = path.join(__dirname, 'deleteKeys.txt');
  const writeStream = fs.createWriteStream(filePath, { flags: 'a' });
  const startTime = dayjs();
  const endTime = startTime.add(duration, 'seconds');

  do {
    const now = dayjs();
    if (now.isAfter(endTime)) {
      console.log(`[${now.format()}] Current time is outside the allowed range. Stopping deletion.`);
      break;
    }

    console.time('deleteHistoryCache');
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', BATCH_SIZE);
    cursor = result[0];
    const keys = result[1];
    if (keys.length > 0) {
      console.log(`[${now.format()}] Processed ${keys.length} keys find`);
      if (shouldDelete) {
        await redis.del(keys);
        console.log(`[${now.format()}] Processed ${keys.length} keys deleted`);
      }
      keys.forEach((key) => {
        writeStream.write(`${key}\n`);
      });
    } else {
      console.log(`[${now.format()}] No keys to process`);
    }
    console.timeEnd('deleteHistoryCache');
    // 增加延迟，避免对 Redis 服务器造成过大压力
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (cursor !== '0');
  writeStream.end();

  // 任务完成后退出进程
  console.log(`[${dayjs().format()}] Task completed. Exiting process.`);
  process.exit(0);
}

// 清空 deleteKeys.txt 文件
const filePath = path.join(__dirname, 'deleteKeys.txt');
fs.writeFileSync(filePath, '');

const duration = argv.duration ?? 1;
console.log(`[${dayjs().format()}] Scheduled task to start and run for ${duration} seconds`);

deleteKeys(argv.delPattern ?? '*:WorkflowTaskQueue:task:*', duration, argv.del) // 替换为你要删除的键的模式
  .then(() => console.debug('Running deleteKeys task end'))
  .catch((err) => {
    console.error('Error during delete task:', err);
    process.exit(1); // 发生错误时退出进程并返回非零状态码
  });
