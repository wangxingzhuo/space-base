import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Store } from '@/store';
import '@watsonserve/ui';
import '@/assets/style/index.styl';
import Header from './components/header';

const App = lazy(() => import('@/pages/app'));
const Records = lazy(() => import('@/pages/records'));

function Root() {
  return (
    <StrictMode>
      <Store>
        <Header />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/records" element={<Records />} />
          </Routes>
        </BrowserRouter>
      </Store>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
