export type Constructor = new (...args: any[]) => Error;
export type Constructors = Constructor | [Constructor, ...Constructor[]];
export type ConstructorType<T extends Constructors> = InstanceType<
  T extends Constructor[] ? T[number] : T
>;

/**
 * ## BetterCatch (with constraint option)
 *
 * @see {@link BetterCatch}
 */
export interface BetterCatchWithConstraint<T = never, E = unknown>
  extends BetterCatch<T, E> {
  /**
   * Add a type-level constraint to this instance. Mapped values must extend
   * this constraint.
   *
   * @example
   * ```ts
   * const res = caught(err)
   *    .constrain<string>()
   *    .map(Error, (err) => err.message) // This works
   *    .mapNonError(() => false); // This is a type error
   * ```
   *
   * If used without specifying a constraint, the return type of `safe` is used:
   *
   * @example
   * ```ts
   * const res = safe((): number => { ... })
   *    .constrain(); // Constrains type to number
   *    .map(Error, (err) => err.message) // This works
   *    .mapNonError(() => false); // This is a type error
   * ```
   */
  constrain<TConstrain = T>(): BetterCatch<T, E, never, TConstrain>;
}

/**
 * ## BetterCatchAsync (with constraint option)
 *
 * @see {@link BetterCatchAsync}
 */
export interface BetterCatchAsyncWithConstraint<T = never, E = unknown>
  extends BetterCatchAsync<T, E> {
  /**
   * Add a type-level constraint to this instance. Mapped values must extend
   * this constraint.
   *
   * @example
   * ```ts
   * const res = safeAsync(async () => { ... })
   *    .constrain<string>()
   *    .map(Error, (err) => err.message) // This works
   *    .mapNonError(() => false); // This is a type error
   * ```
   *
   * If used without specifying a constraint, the return type of a `safeAsync`
   * or `safePromise` is used.
   *
   * @example
   * ```ts
   * const res = safeAsync(async (): Promise<number> => { ... })
   *    .constrain(); // Constrains type to number
   *    .map(Error, (err) => err.message) // This works
   *    .mapNonError(() => false); // This is a type error
   * ```
   */
  constrain<TConstrain = T>(): BetterCatchAsync<T, E, never, TConstrain>;
}

export default error;

/**
 * @TODO
 */
export function error<E>(error: E): BetterCatchWithConstraint<never, E> {
  return BetterCatch.fromError(error);
}

/**
 * @TODO
 */
export function safe<T>(f: () => Awaited<T>): BetterCatchWithConstraint<T> {
  return BetterCatch.safe(f);
}

/**
 * @TODO
 */
export function safeAsync<T>(
  f: () => T | PromiseLike<T>
): BetterCatchAsyncWithConstraint<T> {
  return BetterCatchAsync.safe(f);
}

/**
 * @TODO
 */
export function safePromise<T>(
  promise: PromiseLike<T>
): BetterCatchAsyncWithConstraint<T> {
  return BetterCatchAsync.safePromise(promise);
}

/**
 * ## BetterCatch
 */
export class BetterCatch<
  T = never,
  E = unknown,
  TMap = never,
  TConstrain = any,
> {
  #ok: boolean;
  #match: boolean;
  #value: T | TMap;
  #error: E;

  /**
   * @TODO
   */
  static safe<T>(f: () => Awaited<T>): BetterCatchWithConstraint<T> {
    try {
      return new BetterCatch(f(), undefined, true, true) as any;
    } catch (error) {
      return new BetterCatch(undefined as never, error, false, false) as any;
    }
  }

  /**
   * @TODO
   */
  static fromValue<T>(value: T): BetterCatchWithConstraint<T, never> {
    return new BetterCatch(value, undefined as never, true, true) as any;
  }

  /**
   * @TODO
   */
  static fromError<E>(error: E): BetterCatchWithConstraint<never, E> {
    return new BetterCatch(undefined as never, error, false, false) as any;
  }

  private constructor(value: T, error: E, ok: boolean, match: boolean) {
    this.#ok = ok;
    this.#match = match || ok;
    this.#value = value;
    this.#error = error;
  }

  /**
   * @TODO
   */
  map<U extends TConstrain, TConstructor extends Constructors>(
    this: BetterCatch<T, E, TMap, TConstrain>,
    constructor: TConstructor,
    f: (error: ConstructorType<TConstructor>) => U
  ): BetterCatch<T, E, TMap | U, TConstrain> {
    if (this.#match) {
      return this;
    }

    const error = this.#error;
    const match = Array.isArray(constructor)
      ? constructor.some((ctor) => error instanceof ctor)
      : error instanceof (constructor as Constructor);

    if (!match) {
      return this;
    }

    return new BetterCatch(
      f(error as ConstructorType<TConstructor>) as any,
      error,
      false,
      true
    );
  }

  /**
   * @TODO
   */
  mapExact<U extends TConstrain, TConstructor extends Constructors>(
    this: BetterCatch<T, E, TMap, TConstrain>,
    constructor: TConstructor,
    f: (error: ConstructorType<TConstructor>) => U
  ): BetterCatch<T, E, TMap | U, TConstrain> {
    if (this.#match) {
      return this;
    }

    const error = this.#error;
    const construct = getConstructor(error);

    if (!construct) {
      return this;
    }

    const match = Array.isArray(constructor)
      ? constructor.some((ctor) => error instanceof ctor && construct === ctor)
      : error instanceof (constructor as Constructor) &&
        construct === constructor;

    if (!match) {
      return this;
    }

    return new BetterCatch(
      f(error as ConstructorType<TConstructor>) as any,
      error,
      false,
      true
    );
  }

  /**
   * @TODO
   */
  mapNonError<U extends TConstrain>(
    this: BetterCatch<T, E, TMap, TConstrain>,
    f: (value: E) => U
  ): BetterCatch<T, E, TMap | U, TConstrain> {
    if (!this.#match && !(this.#error instanceof Error)) {
      return new BetterCatch(f(this.#error) as any, this.#error, false, true);
    }

    return this;
  }

  /**
   * @TODO
   */
  andReturn<UDefault extends TConstrain | undefined = undefined>(
    this: BetterCatch<T, E, TMap, TConstrain>,
    def?: (error: E) => UDefault
  ): T | TMap | UDefault {
    if (this.#match) {
      return this.#value;
    }

    if (def) {
      return def(this.#error);
    }

    return undefined as UDefault;
  }

  /**
   * @TODO
   */
  andMapReturn<
    U extends TConstrain,
    UDefault extends TConstrain | undefined = undefined,
  >(
    this: BetterCatch<T, E, TMap, TConstrain>,
    f: (value: TMap) => U,
    def?: (error: E) => UDefault
  ): T | U | UDefault {
    if (this.#ok) {
      return this.#value as T;
    }

    if (this.#match) {
      return f(this.#value as TMap);
    }

    if (def) {
      return def(this.#error);
    }

    return undefined as UDefault;
  }

  /**
   * @TODO
   */
  orRethrow(this: BetterCatch<T, E, TMap, TConstrain>): T | TMap {
    if (this.#match) {
      return this.#value;
    }

    throw this.#error;
  }

  /**
   * @TODO
   */
  orThrow(
    this: BetterCatch<T, E, TMap, TConstrain>,
    def: (error: E) => Error
  ): T | TMap {
    if (this.#match) {
      return this.#value as T | TMap;
    }

    throw def(this.#error);
  }

  /**
   * @TODO
   */
  andThrow(
    this: BetterCatch<T, E, Error, TConstrain>,
    def?: (error: E) => Error
  ): T {
    if (this.#ok) {
      return this.#value as T;
    }

    if (this.#match && this.#value instanceof Error) {
      throw this.#value;
    }

    if (def) {
      throw def(this.#error);
    }

    throw this.#error;
  }

  /**
   * @TODO
   */
  andMapThrow(
    this: BetterCatch<T, E, TMap, TConstrain>,
    f: (value: TMap) => Error,
    def?: (error: E) => Error
  ): T {
    if (this.#ok) {
      return this.#value as T;
    }

    if (this.#match) {
      throw f(this.#value as TMap);
    }

    if (def) {
      throw def(this.#error);
    }

    throw this.#error;
  }
}

/**
 * ## BetterCatchAsync
 *
 * @TODO
 */
export class BetterCatchAsync<
  T = never,
  E = unknown,
  TMap = never,
  TConstrain = any,
> implements PromiseLike<BetterCatch<T, E, TMap, TConstrain>>
{
  #inner: PromiseLike<BetterCatch<T, E, TMap, TConstrain>>;

  /**
   * @TODO
   */
  static safe<T>(
    f: () => T | PromiseLike<T>
  ): BetterCatchAsyncWithConstraint<T> {
    try {
      return BetterCatchAsync.safePromise(Promise.resolve(f()));
    } catch (error) {
      return new BetterCatchAsync(
        Promise.resolve(BetterCatch.fromError(error))
      ) as any;
    }
  }

  /**
   * @TODO
   */
  static safePromise<T>(
    promise: PromiseLike<T>
  ): BetterCatchAsyncWithConstraint<T> {
    return new BetterCatchAsync(
      promise.then(
        (value) => BetterCatch.fromValue(value),
        (error) => BetterCatch.fromError(error)
      )
    ) as any;
  }

  private constructor(inner: PromiseLike<BetterCatch<T, E, TMap, TConstrain>>) {
    this.#inner = inner;
  }

  then<U = BetterCatch<T, E, TMap, TConstrain>, F = never>(
    onfulfilled?:
      | ((value: BetterCatch<T, E, TMap, TConstrain>) => U | PromiseLike<U>)
      | null
      | undefined,
    onrejected?: ((reason: any) => F | PromiseLike<F>) | null | undefined
  ): PromiseLike<U | F> {
    return this.#inner.then(onfulfilled, onrejected);
  }

  /**
   * @TODO
   */
  map<U extends TConstrain, TConstructor extends Constructors>(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    constructor: TConstructor,
    f: (error: ConstructorType<TConstructor>) => U
  ): BetterCatchAsync<T, E, TMap | U, TConstrain> {
    return new BetterCatchAsync(
      this.#inner.then((bc) => bc.map(constructor, f))
    );
  }

  /**
   * @TODO
   */
  mapExact<U extends TConstrain, TConstructor extends Constructors>(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    constructor: TConstructor,
    f: (error: ConstructorType<TConstructor>) => U
  ): BetterCatchAsync<T, E, TMap | U, TConstrain> {
    return new BetterCatchAsync(
      this.#inner.then((bc) => bc.mapExact(constructor, f))
    );
  }

  /**
   * @TODO
   */
  mapNonError<U extends TConstrain>(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    f: (value: E) => U
  ): BetterCatchAsync<T, E, TMap | U, TConstrain> {
    return new BetterCatchAsync(this.#inner.then((bc) => bc.mapNonError(f)));
  }

  /**
   * @TODO
   */
  async andReturn<UDefault extends TConstrain | undefined = undefined>(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    def?: (error: E) => UDefault
  ): Promise<T | TMap | UDefault> {
    return (await this.#inner).andReturn(def);
  }

  /**
   * @TODO
   */
  async andMapReturn<
    U extends TConstrain,
    UDefault extends TConstrain | undefined = undefined,
  >(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    f: (value: TMap) => U,
    def?: (error: E) => UDefault
  ): Promise<T | U | UDefault> {
    return (await this.#inner).andMapReturn(f, def);
  }

  /**
   * @TODO
   */
  async orRethrow(
    this: BetterCatchAsync<T, E, TMap, TConstrain>
  ): Promise<T | TMap> {
    return (await this.#inner).orRethrow();
  }

  /**
   * @TODO
   */
  async orThrow(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    f: (error: E) => Error
  ): Promise<T | TMap> {
    return (await this.#inner).orThrow(f);
  }

  /**
   * @TODO
   */
  async andThrow(
    this: BetterCatchAsync<T, E, Error, TConstrain>,
    def?: (error: E) => Error
  ): Promise<T> {
    return (await this.#inner).andThrow(def);
  }

  /**
   * @TODO
   */
  async andMapThrow(
    this: BetterCatchAsync<T, E, TMap, TConstrain>,
    f: (value: TMap) => Error,
    def?: (error: E) => Error
  ): Promise<T> {
    return (await this.#inner).andMapThrow(f, def);
  }
}

(BetterCatch.prototype as BetterCatchWithConstraint).constrain = constrain;
(BetterCatchAsync.prototype as BetterCatchAsyncWithConstraint).constrain =
  constrain;

Object.freeze(BetterCatch);
Object.freeze(BetterCatchAsync);
Object.freeze(BetterCatch.prototype);
Object.freeze(BetterCatchAsync.prototype);

function constrain(this: any): any {
  return this;
}

function getConstructor(
  value: unknown
): (new (...args: any[]) => any) | undefined {
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);

    if (proto && typeof proto.constructor === "function") {
      return proto.constructor;
    }
  }
}
