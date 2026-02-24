import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main-import.css';
import './i18n'; // i18n initialization
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
