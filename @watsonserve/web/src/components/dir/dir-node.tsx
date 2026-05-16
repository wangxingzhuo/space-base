import React from 'react';
import { EnFileNodeType } from '@/entities';
import { className } from '@watsonserve/utils';
import './dir.styl';

export interface IDirNodeData {
  name: string;
  nodeType: EnFileNodeType;
  isActive: boolean;
  onOpen(): void;
  onRename(): void;
  onSelect(): void;
  onDragStart(ev: React.DragEvent): void;
}

export type IDirNode = React.AnchorHTMLAttributes<HTMLAnchorElement> & IDirNodeData;

export default function DirNode(props: IDirNode) {
  const {
    name,
    nodeType,
    isActive,
    onOpen,
    onRename,
    onSelect,
    onDragStart
  } = props;

  const linkClassName = className([
    'file-node',
    {
      active: isActive,
      dir: EnFileNodeType.DIR === nodeType
    }
  ]);

  const handleClick = () => {
    if (isActive) return onRename && onRename();
    onSelect && onSelect();
  };

  const handleDoubleClick = EnFileNodeType.FILE === nodeType ? onOpen : undefined;

  return (
    // eslint-disable-next-line jsx-a11y/anchor-is-valid
    <a
      className={linkClassName}
      draggable={true}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onDragStart={onDragStart}
    >
      <img src="" alt="" className="file-icon" />
      <span className="file-name">{ name }</span>
    </a>
  );
}
