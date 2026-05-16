import React, { Suspense, lazy, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import './index.styl';

const Home = lazy(() => import('@/pages/home'));
const Chat = lazy(() => import('@/pages/chat'));
const Music = lazy(() => import('@/pages/music'));
const Gallery = lazy(() => import('@/pages/gallery'));
const Setting = lazy(() => import('@/pages/setting'));

function HomeContain() {
  const params = useParams();
  console.log('HomeContain', params)
  return <Home path={params['*'] || ''} />
}

export default function App() {
  const handleDragOver = useCallback((ev: React.DragEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
  }, []);

  return (
    <React.StrictMode>
      <div className="App" onDragOver={handleDragOver}>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/setting" element={<Setting />} />
              <Route path="/gallery/*" element={<Gallery />} />
              <Route path="/music/*" element={<Music />} />
              <Route path="/home/*" element={<HomeContain />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/gallery" element={<Gallery />} />
              {/* <Redirect path="/" to="/home/" /> */}
              <Route path="/" element={<Navigate to="/gallery/" />} />
            </Routes>
          </Suspense>
        </Router>
      </div>
    </React.StrictMode>
  )
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.register();
