import React from 'react';
import { WorkspaceProvider } from './context/WorkspaceContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import './App.css';

function App() {
  return (
    <WorkspaceProvider>
      <div className="app">
        <Sidebar />
        <div className="app-main">
          <Header />
          <MainContent />
        </div>
      </div>
    </WorkspaceProvider>
  );
}

export default App;
