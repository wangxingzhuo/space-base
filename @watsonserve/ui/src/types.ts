import { ReactElement, MouseEventHandler } from 'react';

export interface INameTitle<T = string> {
  name: T;
  title: string;
}

export interface IBtnProps {
  className?: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  type?: string;
  children?: any;
  onClick: MouseEventHandler;
}

export interface TabItemProps {
  active: boolean;
  title: string;
  onClick(): void;
}

export interface ITabBarProps {
  children: ReactElement;
  active: string;
  list: INameTitle[];
  onClick(name: string): void;
}

export interface IMenuTree<T> extends INameTitle<T> {
  className?: string;
  Icon?: () => ReactElement;
  tip?: string;
  checkbox?: boolean;
  active?: boolean;
  disabled?: boolean;
  children?: (IMenuTree<T> | null)[];
}

export interface IMenuProps<T = string> {
  className?: string;
  style?: any;
  tree: (IMenuTree<T> | null)[];
  onClick(dist: IMenuTree<T>): void;
}

export interface ISelectorProps<T = string> {
  className?: string;
  value: T;
  options: INameTitle<T>[];
  onInput(v: T): void;
}

export interface ISteperProps {
  className?: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  options: INameTitle<number>[];
  onInput(val: number): void;
}
