import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { MainLayout } from './components/layout';
import { FullScreenDiagram } from './components/diagram';
import { DiagramProvider } from './contexts/DiagramContext';

/**
 * Main App component that sets up the routing for the application
 */
function App() {
  return (
    <DiagramProvider>
      <Routes>
        <Route path="/diagram/:diagramId" element={<FullScreenDiagram />} />
        <Route path="/" element={<MainLayout />} />
      </Routes>
    </DiagramProvider>
  );
}

export default App;
