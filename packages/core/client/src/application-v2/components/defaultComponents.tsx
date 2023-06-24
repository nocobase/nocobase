import React, { FC } from 'react';
import { MainComponent } from './MainComponent';

const Loading: FC = () => <div>Loading...</div>;
const AppError: FC<{ error: Error }> = ({ error }) => (
  <div>
    <div>Load Plugin Error</div>
    {error?.message}
  </div>
);

export const defaultAppComponents = {
  AppMain: MainComponent,
  AppSpin: Loading,
  AppError: AppError,
};
