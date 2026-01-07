import React from 'react';
import AnimatedLoader from './AnimatedLoader';

const LoadingWebm: React.FC<{ visible: boolean; overlay?: boolean }> = ({ visible, overlay = true }) => {
  return <AnimatedLoader visible={visible} overlay={overlay} size="large" />;
};

export default LoadingWebm;
