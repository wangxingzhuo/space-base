interface ICol {
  name: string;
  unique: boolean;
}

export interface ITableProps {
  tableName: string;
  primary: string;
  autoIncrement?: boolean;
  cols: ICol[];
}

export abstract class IDBC {
  private _version: number;
  protected dbName: string;
  protected db?: IDBDatabase;

  constructor(dbName: string, version = 0) {
    this.dbName = dbName;
    this._version = version;
  }

  protected abstract create(db: IDBDatabase): void;

  public open(): Promise<void> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const { dbName, _version } = this;
      const request = indexedDB.open(dbName, _version);
      request.onerror = (event) => reject((event.target as any).errorCode);

      request.onsuccess = (ev: any) => {
        resolve((ev.target as IDBOpenDBRequest).result);
      };

      request.onupgradeneeded = ev => this.create(request.result);
    }).then(db => {
      this.db = db;
    });
  }

  protected async transaction<T = any>(
    tableName: string,
    mod: IDBTransactionMode,
    callback: (table: IDBObjectStore) => IDBRequest<T> | void
  ) {
    return new Promise<T | undefined>((resolve, reject) => {
      const transaction = this.db!.transaction(tableName, mod);
      transaction.onerror = reject;
      const table = transaction.objectStore(tableName);
      const req = callback(table) as undefined | IDBRequest<T>;
      if (req) req.onerror = reject;
      transaction.oncomplete = () => resolve(req?.result);
    });
  }

  private _idx(table: IDBObjectStore, field: string, where: any, callback: (keys: IDBValidKey[]) => void) {
    const index = table.index(field + '_index');
    const req = index.getAllKeys(where);
    req.onsuccess = () => callback(req.result);
  }

  protected createTable(db: IDBDatabase, table: ITableProps) {
    return new Promise((resolve) => {
      const { tableName, primary, cols, autoIncrement = false } = table;
      const objectStore = db.createObjectStore(tableName, { keyPath: primary, autoIncrement });

      cols.forEach(({ name, unique }) => {
        // 建立一个索引
        objectStore.createIndex(`${name}_index`, name, { unique });
      });

      // 使用事务的 oncomplete 事件确保在插入数据前对象仓库已经创建完毕
      objectStore.transaction.oncomplete = event => resolve(event.target as IDBTransaction);
    });
  }

  public close() {
    this.db?.close();
  }

  public insert<T>(tableName: string, data: T, key?: any) {
    return this.transaction(tableName, 'readwrite', table => {
      table.add(data, key);
    });
  }

  public delete(tableName: string, field: IDBValidKey | IDBKeyRange, where?: any) {
    return this.transaction(tableName, 'readwrite', table =>
      field === table.keyPath && table.delete(where) ||
      this._idx(table, field.toString(), where, keys => keys.forEach(key => table.delete(key)))
    );
  }

  public save<T>(tableName: string, data: T, field: IDBValidKey | IDBKeyRange, where?: any) {
    return this.transaction(tableName, 'readwrite', table =>
      field === table.keyPath
        && table.put(data, where)
        || this._idx(table, field.toString(), where, keys => keys.forEach(key => table.put(data, key)))
    );
  }

  public select<T = any>(tableName: string, field?: IDBValidKey | IDBKeyRange, where?: any, limit?: number) {
    return this.transaction<T[]>(tableName, 'readonly', table =>
      (!field || field === table.keyPath) && table.getAll(where, limit) || table.index(field!.toString() + '_index').getAll(where, limit)
    );
  }

  public count(tableName: string, field?: IDBValidKey | IDBKeyRange, where?: any) {
    return this.transaction(tableName, 'readonly', table =>
      (!field || field === table.keyPath) && table.count(where) || table.index(field!.toString() + '_index').count(where)
    );
  }
}
