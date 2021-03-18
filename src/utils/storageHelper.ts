// Helper for working with persistent storages (e.g. WebStorage API, NodeJS file-system api, etc.)

import type { CreateObservableOptions } from "mobx/lib/api/observable";
import { action, comparer, observable, toJS, when } from "mobx";
import produce, { Draft, setAutoFreeze } from "immer";
import { isEqual, isPlainObject } from "lodash";

setAutoFreeze(false); // allow to merge deep observables

export interface StorageAdapter<T> {
  [metadata: string]: any;
  getItem(key: string): T | Promise<T>;
  setItem(key: string, value: T): void;
  removeItem(key: string): void;
  onChange?(change: { key: string, value: T, oldValue?: T }): void;
}

export type StorageObservabilityOptions = CreateObservableOptions;

export interface StorageHelperOptions<T> {
  autoInit?: boolean; // start preloading data immediately, default: true
  defaultValue?: T;
  storage: StorageAdapter<T>;
  observable?: StorageObservabilityOptions;
}

export class StorageHelper<T> {
  static defaultOptions: Partial<StorageHelperOptions<any>> = {
    autoInit: true,
    observable: {
      deep: true,
      equals: comparer.shallow,
    }
  };

  @observable private data = observable.box<T>();
  @observable initialized = false;
  whenReady = when(() => this.initialized);

  get storage(): StorageAdapter<T> {
    return this.options.storage;
  }

  get defaultValue(): T {
    return this.options.defaultValue;
  }

  constructor(readonly key: string, private options: StorageHelperOptions<T>) {
    this.options = { ...StorageHelper.defaultOptions, ...options };
    this.configureObservable();
    this.reset();

    if (this.options.autoInit) {
      this.init();
    }
  }

  @action
  init({ force = false } = {}) {
    if (this.initialized && !force) return;

    this.loadFromStorage({
      onData: (data: T) => {
        const notEmpty = data != null;
        const notDefault = !this.isDefault(data);

        if (notEmpty && notDefault) {
          this.set(data);
        }

        this.initialized = true;
      },
      onError: (error?: any) => {
        console.error(`[init]: ${error}`, this);
      },
    });
  }

  private loadFromStorage(opts: { onData?(data: T): void, onError?(error?: any): void } = {}) {
    let data: T | Promise<T>;

    try {
      data = this.storage.getItem(this.key); // sync reading from storage when exposed

      if (data instanceof Promise) {
        data.then(opts.onData, opts.onError);
      } else {
        opts?.onData(data);
      }
    } catch (error) {
      console.error(`[load]: ${error}`, this);
      opts?.onError(error);
    }

    return data;
  }

  isDefault(value: T): boolean {
    return isEqual(value, this.defaultValue);
  }

  @action
  private configureObservable(options = this.options.observable) {
    this.data = observable.box<T>(this.data.get(), {
      ...StorageHelper.defaultOptions.observable, // inherit default observability options
      ...(options ?? {}),
    });
    this.data.observe(change => {
      const { newValue, oldValue } = toJS(change, { recurseEverything: true });

      this.onChange(newValue, oldValue);
    });
  }

  protected onChange(value: T, oldValue?: T) {
    if (!this.initialized) return;

    try {
      if (value == null) {
        this.storage.removeItem(this.key);
      } else {
        this.storage.setItem(this.key, value);
      }

      this.storage.onChange?.({ value, oldValue, key: this.key });
    } catch (error) {
      console.error(`[change]: ${error}`, this, { value, oldValue });
    }
  }

  get(): T {
    return this.data.get();
  }

  set(value: T) {
    this.data.set(value);
  }

  reset() {
    this.set(this.defaultValue);
  }

  clear() {
    this.data.set(null);
  }

  merge(value: Partial<T> | ((draft: Draft<T>) => Partial<T> | void)) {
    const nextValue = produce(this.get(), (state: Draft<T>) => {
      const newValue = typeof value === "function" ? value(state) : value;

      return isPlainObject(newValue)
        ? Object.assign(state, newValue) // partial updates for returned plain objects
        : newValue;
    });

    this.set(nextValue as T);
  }

  toJS() {
    return toJS(this.get(), { recurseEverything: true });
  }
}
