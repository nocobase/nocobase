import React, { useContext,createContext, useEffect, useState } from 'react';
import {TableContext} from '../context';

export const useTable = () => {
  return useContext(TableContext);
};
