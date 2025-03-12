import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { MainLayout } from './components/layout';
import { FullScreenDiagram } from './components/diagram';

/**
 * Main App component that sets up the routing for the application
 */
function App() {
  return (
    <Routes>
      <Route path="/diagram/:diagramId" element={<FullScreenDiagram />} />
      <Route path="/" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
