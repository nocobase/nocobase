import { UseRequestResult } from '@nocobase/client';
import { createContext } from 'react';
import { BackupFile } from './components/BackupsTable';

export const BackupsContext = createContext<UseRequestResult<{ data: BackupFile[] }>>(null);
