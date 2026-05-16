import { useEffect, useReducer, useContext, createContext, useRef, useMemo, useCallback } from 'react';
import { EnFileNodeType, EnMimeType, IFileNode, ITreeNode } from '../entities';
import { loadDir } from '../api';
import WorkerChannel from '@/helpers/WorkerChannel';

export const home: ITreeNode = {
  name: 'home',
  size: 0,
  path: '/home',
  nodeType: EnFileNodeType.DIR,
  contentType: EnMimeType.NULL,
  createTime: 0,
  updateTime: 0,
  accessTime: 0,
  mode: 0o770,
};

async function _loadDir(path: string, dispatch: (value: ITreeNode) => void) {
  '/' !== path[0] && (path = `/${path}`);
  const resp = await loadDir(path);
  if (!resp || !resp.data) return;
  dispatch(resp.data);
}

type TreeNodeDict = Record<string, ITreeNode>;

interface IStore {
  activeNode: IFileNode | null;
  tree: TreeNodeDict;
  setActiveNode: (node: IFileNode) => void;
  loadDir: (dir: string) => Promise<void>;
  uploadFile: (dir: string, file: File) => Promise<void>;
}

const Storer = createContext<IStore>({
  activeNode: null,
  tree: {},
  setActiveNode: (node: IFileNode) => {},
  loadDir: (dir: string) => Promise.reject(new Error('loadDir undefined')),
  uploadFile: (dir: string, file: File) => Promise.reject(new Error('uploadFile undefined'))
});

const channel = WorkerChannel.getInstance();

export function Store(props: any) {
  const { children } = props;

  const [activeNode, setActiveNode] = useReducer((state: IFileNode | null, action: IFileNode | null) => action, null);

  const [tree, setTree] = useReducer((state: TreeNodeDict, action: ITreeNode) => {
    return { ...state, [action.path]: action };
  }, { '/': home });

  const loadDir = useCallback((dir: string) => _loadDir(dir, setTree), []);

  const uploadFile = useCallback(async (dir: string, file: File) => {
    try {
      await channel.invoke('upload', { dirPath: dir, file });
      await _loadDir(dir, setTree);
    } catch(err) {
      console.error(err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Provider = Storer.Provider;

  return useMemo(() => (
      <Provider value={{ activeNode, tree, setActiveNode, loadDir, uploadFile }}>
        { children }
      </Provider>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Provider, activeNode, tree, children]
  );
}

export function useDir(dir: string) {
  const { tree, loadDir, uploadFile } = useContext(Storer);
  const dirNode = tree[dir];
  const dirRef = useRef(dir);
  dirRef.current = dir;

  useEffect(() => {
    dirNode && dirNode.children || loadDir(dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir, dirNode]);


  return {
    dirNode,
    uploadFile: (file: File) => uploadFile(dirRef.current, file)
  };
}

export function useStore() {
  return useContext(Storer);
}
