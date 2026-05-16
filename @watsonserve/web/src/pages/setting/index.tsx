import { useEffect, useState } from 'react';
import { ISetting, loadSetting, saveSetting } from '@/api';

export default function Setting() {
  const [origin, setOrigin] = useState('');
  const [cacheDir, setCacheDir] = useState('');
  const [hotKey, setHotKey] = useState('');
  const [listName, setListName] = useState('');
  const [mediaKey, setMediaKey] = useState(false);

  const save = () => {
    console.log({ origin, cacheDir, hotKey, listName, mediaKey });
    saveSetting({ origin, cacheDir, hotKey, listName, useMediaKey: mediaKey }).then(() => console.log('saved'));
  };

  const back = () => window.history.back();

  useEffect(() => {
    (async () => {
      const setting = await loadSetting();
      console.log(setting);
      setOrigin(setting.origin || '');
      setCacheDir(setting.cacheDir || '');
      setListName(setting.listName || '');
    })();
  }, []);

  return (
    <div className="setting">
      <button onClick={back}>back</button>
      <fieldset>
        <input placeholder="hot key" value={hotKey} onInput={ev => setHotKey((ev.target as any).value)} />
      </fieldset>
      <fieldset>
        <input placeholder="origin url" value={origin} onInput={ev => setOrigin((ev.target as any).value)} />
      </fieldset>
      <fieldset>
        <input placeholder="cache dir" value={cacheDir} onInput={ev => setCacheDir((ev.target as any).value)} />
      </fieldset>
      <fieldset>
        <input placeholder="list name" value={listName} onInput={ev => setListName((ev.target as any).value)} />
      </fieldset>
      <fieldset>
        <label>
          <span>use media key</span>
          <input type="checkbox" checked={mediaKey} onClick={() => setMediaKey(!mediaKey)} />
        </label>
      </fieldset>
      <button onClick={save}>Save</button>
    </div>
  );
}
