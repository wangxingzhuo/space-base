import React, { useRef, useEffect, useCallback } from 'react';
import { IFileNode, ITreeNode } from '@/entities';
import { useDir } from '@/store/dir';
import DirItem from './dir-item';
import './dir.styl';

interface IDir {
  abs: string;
  value: string;
  unfolded: string;
}

export default function Dir(props: IDir) {
  const { abs, value } = props;
  const selfDom = useRef<any>(null);
  const {
    dirNode = { children: [] } as any as ITreeNode,
    uploadFile
  } = useDir(abs);

  useEffect(() => {
    const self = selfDom.current!;

    const handleDrop = async (ev: DragEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
  
      const dataTransfer = ev.dataTransfer;
      if (!dataTransfer) return
  
      if (dataTransfer.files.length) {
        Array.prototype.forEach.call(dataTransfer.files, uploadFile);
        return;
      }
  
      const url = dataTransfer.getData('node');
      console.log('url', url);
    };

    self.addEventListener('drop', handleDrop);

    return ((dom) => () => dom.removeEventListener('drop', handleDrop))(self);
  }, [uploadFile]);

  const dirContent = (dirNode.children || []).map((fileNode: IFileNode, idx: number) => {
    return <DirItem {...fileNode} abs={abs} key={idx} />
  });

  return (
    <dl className="dir" ref={selfDom}>
      <dt className="dir__title">{ value }</dt>
      <dd className="dir__content">
        <ul className="dir__list">{ dirContent }</ul>
      </dd>
    </dl>
  );
}
