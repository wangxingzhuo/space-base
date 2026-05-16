import React, { useMemo } from 'react';
import { EnFileNodeType, IFileNode } from '@/entities';
import { useStore } from '@/store/dir';
import { useJmpPath } from '@/helpers/pathHelper';
import { className, mimeDict } from '@watsonserve/utils';
import DirNode from './dir-node';
import { extname } from 'path';
import { dirOrigin } from '../../constant';

const cdn = dirOrigin.cdn;

export default function DirItem(props: IFileNode & {abs: string;}) {
  const { name, nodeType, path, abs } = props;
  const jmp = useJmpPath();
  const { activeNode: _activeNode, setActiveNode } = useStore();
  
  const isActive = useMemo(() => _activeNode?.path === path, [_activeNode, path]);

  const liClassName = className({ dir__list__item: true, hidden: '.' === name[0] });

  return useMemo(() => {
    const eventHandler: any = {
      onOpen() {
        const inClient = !!(window as any).openFile;
        const open = (window as any).openFile || window.open;
        open(inClient ? path : `${cdn}${path}`, '_blank');
      },
      onRename() {
        console.log('rename');
      },
      onSelect() {
        setActiveNode(props);
        jmp(EnFileNodeType.DIR === nodeType ? path : abs);
      },
      /**
       * @param downloadUrl: ['audio/mpeg', 'f.mp3', 'http://e.com/f.mp3']
       */
      onDragStart(ev: React.DragEvent) {
        ev.dataTransfer.setData('node', JSON.stringify(props));
        const mime = mimeDict(extname(name))
        ev.dataTransfer.setData('DownloadURL', `${mime}:${name}:${cdn + path}`);
        (window as any).bridge.send('drag-start', path);
      },
    };

    return (
      <li className={liClassName}>
        <DirNode
          name={name}
          nodeType={nodeType}
          isActive={isActive}
          {...eventHandler}
        />
      </li>
    );
  }, [nodeType, liClassName, name, isActive, setActiveNode, props, jmp, path, abs]);
}
