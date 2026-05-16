import { useRef } from 'react';

interface IContextMenuProps {}

interface IMenuItem {
  name: string;
  title: string;
  icon: string;
  opt: string;
}

export default function ContextMenu(props: IContextMenuProps) {
  const menuList: IMenuItem[] = [{
    name: 'open',
    title: '打开',
    icon: '',
    opt: ''
  }, {
    name: 'rename',
    title: '重命名',
    icon: '',
    opt: ''
  }];

  return (
    <div>
      <ul>
        {menuList.map(item => (
          <li key={item.name}></li>
        ))}
      </ul>
    </div>
  );
}
