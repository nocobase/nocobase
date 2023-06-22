import React, { FC } from 'react';
import { MainComponent } from './MainComponent';

const Loading: FC = () => <div>Loading...</div>;
const AppError: FC<{ error: Error }> = ({ error }) => <div>Load Plugin Error: {error.message}</div>;

export const defaultAppComponents = {
  'App.Main': MainComponent,
  'App.Spin': Loading,
  'App.error': AppError,
};
