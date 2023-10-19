import React from 'react';
import { Button, Drawer, Form, Radio, Space } from 'antd';
import CustomInputs from '../CustomFields';

type CustomDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
 
};
const CustomDrawer: React.FC<CustomDrawerProps> = ({ onClose, isOpen }) => {

  
  return (
    <>
      <Drawer
        title="Drawer with extra actions"
        placement={'right'}
        width={500}
        onClose={onClose}
        open={isOpen}
        extra={
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={onClose}>
              OK
            </Button>
          </Space>
        }
      >
        <Button type="primary">Add Fields</Button>

        {/* Form Fields */}
        <CustomInputs />
      </Drawer>
    </>
  );
};

export default CustomDrawer;
