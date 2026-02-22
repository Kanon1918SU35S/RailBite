import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <div className="back-button-fixed" onClick={() => navigate(-1)}>
      <span className="arrow">←</span>
      <span>Back</span>
    </div>
  );
};

export default BackButton;