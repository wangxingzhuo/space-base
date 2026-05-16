import { useEffect, useState } from 'react';
import { loadGalleryIndex, uploadFile } from '@/api';
import { Header, imgExtName, ImgList, Sideer } from './components';
import classes from './style.module.styl';

interface ICover {
  cTime: Date;
  etag: string;
  hash: string;
  fileName: string;
  blobURL?: string;
}

enum EnUploadStat {
  Failed = 1,
  Waiting = 2,
}

interface IWaitingFile {
  blobURL: string;
  stat: EnUploadStat;
  file: File;
}

export default function Gallery() {
  const [asideShow, setAsideShow] = useState(false);
  const [list, setList] = useState<ICover[]>([]);
  const [waitingFiles, setWaitingFiles] = useState<IWaitingFile[]>([]);
  let uploading = false;

  const loadIndex = async () => {
    try {
      const data = await loadGalleryIndex();
      setList(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toUpload = async (_waitingList: IWaitingFile[]) => {
    if (uploading) return;
    uploading = true;

    const _list = list.slice();

    for (let i = _waitingList.length - 1; 0 <= i; i--) {
      const { file, blobURL } = _waitingList[i];
      try {
        const info = await uploadFile(`/api/Pictures/img_0.${imgExtName(file.type)}`, file);

        _waitingList.splice(i, 1);
        _list.unshift(Object.assign(info, { blobURL }));
        setList(_list.slice());
      } catch (err) {
        _waitingList[i].stat = EnUploadStat.Failed;
      }
      setWaitingFiles(_waitingList.slice());
    }

    uploading = false;
  };

  const handleUp = (ev: any) => {
    let _waitingList: IWaitingFile[];

    if (!waitingFiles.length) {
      _waitingList = [...(ev.target as HTMLInputElement).files!].map(fl => ({
        stat: EnUploadStat.Waiting,
        blobURL: URL.createObjectURL(fl),
        file: fl
      }));
      setWaitingFiles(_waitingList);
    } else {
      _waitingList = waitingFiles.slice();
    }
    toUpload(_waitingList);
  };

  useEffect(() => {
    loadIndex();
  }, []);

  return (
    <div className={classes['gallery-page']}>
      <Header uploading={!!waitingFiles.length} onMenu={() => setAsideShow(true)} onUp={handleUp} />
      <Sideer show={asideShow} uploading={!!waitingFiles.length} onClose={() => setAsideShow(false)} onUp={handleUp} />
      <main className={classes['main-content']}>
        <ImgList waitingFiles={waitingFiles} data={list} />
      </main>
    </div>
  );
}
