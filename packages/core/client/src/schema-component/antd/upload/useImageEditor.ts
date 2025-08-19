/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useState } from 'react';
import { useAPIClient } from '../../../api-client';
import type { FileModel } from './shared';

interface UseImageEditorProps {
  onFileReplace?: (originalFile: FileModel, newFile: FileModel) => void;
}

export const useImageEditor = ({ onFileReplace }: UseImageEditorProps = {}) => {
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileModel | null>(null);
  const api = useAPIClient();

  const openEditor = useCallback((file: FileModel) => {
    setCurrentFile(file);
    setIsEditorVisible(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditorVisible(false);
    setCurrentFile(null);
  }, []);

  const handleSave = useCallback(
    async (editedFile: File) => {
      if (!currentFile) return;

      try {
        // Create FormData for the new file
        const formData = new FormData();
        formData.append('file', editedFile);

        // Upload the edited file
        const response = await api.axios.post('/attachments:create', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newFileData = response.data.data;

        // Call the callback to replace the file
        onFileReplace?.(currentFile, newFileData);

        // Close the editor
        closeEditor();
      } catch (error) {
        console.error('Error uploading edited image:', error);
        // You might want to show an error message to the user here
      }
    },
    [currentFile, api, onFileReplace, closeEditor],
  );

  return {
    isEditorVisible,
    currentFile,
    openEditor,
    closeEditor,
    handleSave,
  };
};
