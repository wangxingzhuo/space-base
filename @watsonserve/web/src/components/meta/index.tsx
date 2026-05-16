import React from 'react';
import { EnFileNodeType, IFileNode, EnMimeType } from '@/entities';
import { useStore } from '@/store/dir';
import './meta.styl';

function unitSize(s: number) {
  const unit = ['', 'K', 'M', 'G', 'T'];
  let count = 0;
  for (; 1024 < s && count < 4; count++) s >>= 10;
  return `${s}${unit[count]}B`;
}

export default function() {
  const { activeNode } = useStore();
  const { nodeType, contentType, name = '', size = 0, preview } = activeNode || {} as IFileNode;

  if (EnFileNodeType.FILE !== nodeType) return null;

  return (
    <div className="meta">
      <div className="info">
        { EnMimeType.PLAIN !== contentType && <img src={preview} /> }
        <h5 className="title">{decodeURIComponent(name)}</h5>
      </div>
      <ul className="attrs">
        <li className="attr-item">
          <span className="attr__key">size:</span>
          <span className="attr__val">{ unitSize(size) }</span>
        </li>
      </ul>
    </div>
  );
}
