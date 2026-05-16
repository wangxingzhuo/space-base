import { type ChangeEvent, useMemo } from 'react';
import t from '@/helpers/i18n';
import { classify } from '@watsonserve/utils';
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
}

interface IImgListProps {
  waitingFiles: IWaitingFile[];
  data: ICover[];
}

interface IPictureCoverProps {
  etag: string;
  blobURL: string;
  stat: EnUploadStat;
}

export function imgExtName(mime: string) {
  if (!mime.startsWith('image/')) return '';
  const extName = mime.split('/')[1];
  return 'jpeg' === extName ? 'jpg' : extName;
}

function imgUrl(etag: string) {
  return `/api/.cache/thumb/${etag}.webp`;
}

function PictureCover(props: Partial<IPictureCoverProps>) {
  const { etag, blobURL, stat } = props;
  const url = useMemo(() => blobURL || imgUrl(etag!), [blobURL, etag]);

  return (
    <div className={classify(classes['picture-cover'], stat && classes[`stat-${stat}`])} style={{
      backgroundImage: `url('${url}')`
    }}>
      <svg viewBox="0 0 300 200" fill="none">
        <rect x="0" y="0" width="300" height="200" />
      </svg>
    </div>
  );
}

export function ImgList(props: IImgListProps) {
  const { waitingFiles, data } = props;

  return (
    <ul className={classes['gallery-list']}>
      {waitingFiles.map((item, idx) => (
        <li className={classes['img-item']} key={idx}>
          <PictureCover blobURL={item.blobURL} stat={item.stat} />
        </li>
      ))}
      {data.map(item => (
        <li className={classes['img-item']} key={item.hash}>
          <PictureCover etag={item.etag} blobURL={item.blobURL} />
        </li>
      ))}
    </ul>
  );
}

interface IHeaderProps {
  uploading: boolean;
  onMenu: () => void;
  onUp: (ev: ChangeEvent<HTMLInputElement>) => void;
}

interface ISiderProps {
  show?: boolean;
  uploading: boolean;
  onClose: () => void;
  onUp: (ev: ChangeEvent<HTMLInputElement>) => void;
}

export function Header(props: IHeaderProps) {
  return (
    <header className={classes['header']}>
      <div onClick={props.onMenu}>menu</div>
      {props.uploading
      ? (<span onClick={() => props.onUp}>retry</span>)
      : (
        <label className={classes['upload-btn']}>
          <input type="file" accept="image/*" multiple disabled={props.uploading} onChange={props.onUp} />
          +
        </label>
      )}
    </header>
  );
}

export function Sideer(props: ISiderProps) {
  return (
    <aside className={classify(classes['sidebar'], { [classes['active']]: props.show })}>
      <ul className={classes['menu-list']}>
        <li onClick={props.onClose}>{t('menu-back')}</li>
        <li>{t('all_photos')}</li>
        <li>
          {props.uploading
          ? (<span onClick={() => props.onUp}>retry</span>)
          : (
            <label>
              <input type="file" accept="image/*" multiple disabled={props.uploading} onChange={props.onUp} />
              {t('uploading')}
            </label>
          )}
        </li>
        <li>{t('albums')}</li>
        <li>{t('favorites')}</li>
        <li>{t('deleted')}</li>
      </ul>
    </aside>
  );
}