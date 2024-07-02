import React from 'react';
import { MobileTitleProvider, useMobileTitle } from '../mobile-providers';

const InnerPage = () => {
  const { title, setTitle } = useMobileTitle();
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setTitle('Hello World')}>Set Title</button>
    </div>
  );
};

const Demo = () => {
  return (
    <MobileTitleProvider>
      <InnerPage />
    </MobileTitleProvider>
  );
};

export default Demo;
