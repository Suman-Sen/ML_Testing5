import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Scan from './pages/ScanPage';
import BatchesPage from './pages/BatchesPage';
import BatchDetailsPage from './pages/BatchDetailsPage';
import HistoryPage from './pages/HistoryPages';
import NotFound from './pages/NotFound';
import LeftNav from './components/ui/LeftNav';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex">
      <LeftNav />
      <div className="app-content w-full">
        {/* Optional: simple top nav */}
        <header className="p-4 border-b flex gap-4">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'text-blue-600 font-semibold' : ''}>
            Scan
          </NavLink>
          <NavLink to="/batches" className={({ isActive }) => isActive ? 'text-blue-600 font-semibold' : ''}>
            Batches
          </NavLink>
          <NavLink to="/history/me" className={({ isActive }) => isActive ? 'text-blue-600 font-semibold' : ''}>
            History
          </NavLink>
        </header>

        <main>
          <Routes>
            {/* default route */}
            <Route path="/" element={<Scan />} />

            {/* batches list */}
            <Route path="/batches" element={<BatchesPage />} />

            {/* batch details */}
            <Route path="/batches/:id" element={<BatchDetailsPage />} />

            {/* history */}
            <Route path="/history/me" element={<HistoryPage />} />


            {/* image scan placeholder */}
            <Route path="/image-scan" element={<div className="flex items-center justify-center h-96 text-2xl">Image Scan (Coming Soon)</div>} />

            {/* db scan placeholder */}
            <Route path="/db-scan" element={<div className="flex items-center justify-center h-96 text-2xl">DB Scan (Coming Soon)</div>} />

            {/* document scan placeholder */}
            <Route path="/document-scan" element={<div className="flex items-center justify-center h-96 text-2xl">Document Scan (Coming Soon)</div>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

// import React from "react";
// import Scan from "./pages/ScanPage";
// const App: React.FC = () => {
//     return<>
//     <Scan></Scan>
//     </>
// };

// export default App;