import React from 'react'
import { Button, Modal } from 'antd';
import { useState } from "react";


const useTryModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  return {
    openModal,
    isModalOpen,
    handleOk,
    handleCancel,
  };
};



export default useTryModal