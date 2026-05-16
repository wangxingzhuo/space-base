import { Link } from 'react-router-dom';
import { Store } from '@/store/music';
import { AddrBar } from './comp';
import AudioList from '@/components/audio-list';
import PlayControllor from '@/components/play-controllor';
import './app.styl';

// setOriginInfo({
//   origin: '',
//   prefix: '/music-api',
//   cdn: `${window.location.origin}/file-api`
// });

export default function App() {
  return (
    <div className="app">
      <Store>
        <header className="app__header">
          <AddrBar />
          <Link to="/setting">setting</Link>
        </header>
        <div className="main">
          <div className="content">
            <div className="anslyser">
              {/* <canvas className="oscilloscope" width="4096" height="256" ref={canvasRef} /> */}
            </div>
            {/* <EqHoc /> */}
            <AudioList />
          </div>
          <PlayControllor />
        </div>
      </Store>
    </div>
  );
}
