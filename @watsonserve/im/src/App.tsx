import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Chat = lazy(() => import('./chat'));

function HomeContain() {
  return <div>home</div>
}

function ChatContain() {
  return <Chat path={''} />
}

export default function App() {
  return (
    <div className="App">
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route index element={<HomeContain />} />
            <Route path="/chat" element={<ChatContain />} />
          </Routes>
        </Suspense>
      </Router>
    </div>
  );
};
