import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Urna from './pages/Urna';
import { UIProvider } from './components/UIProvider';

function App() {
  return (
    <UIProvider>
      <Router>
        <div className="min-h-screen bg-gray-100 overflow-x-hidden flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/urna/:electionId" element={<Urna />} />
            </Routes>
          </div>
          <footer className="py-4 text-center text-xs font-bold text-slate-400">
            Desenvolvido por © Erik Mello
          </footer>
        </div>
      </Router>
    </UIProvider>
  );
}

export default App;
