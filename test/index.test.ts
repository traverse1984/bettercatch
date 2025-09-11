import { vi, describe, test, expect } from "vitest";

import * as bc from "../src/index.js";
import bcdefault from "../src/index.js";

function capture<T>(f: () => Awaited<T>): unknown {
  try {
    f();
  } catch (error) {
    return error;
  }
}

describe("Exports", () => {
  test("Includes function error", () => {
    expect(bc.error).toBeTypeOf("function");
  });

  test("Includes function safe", () => {
    expect(bc.safe).toBeTypeOf("function");
  });

  test("Includes function safeAsync", () => {
    expect(bc.safeAsync).toBeTypeOf("function");
  });

  test("Includes function safePromise", () => {
    expect(bc.safePromise).toBeTypeOf("function");
  });

  test("Has a default function export", () => {
    expect(bcdefault).toBeTypeOf("function");
  });

  test("The default export is the error function", () => {
    expect(bcdefault).toBe(bc.error);
  });

  test("Includes class BetterCatch", () => {
    expect(bc.BetterCatch).toBeTypeOf("function");
  });

  test("Class BetterCatch and it's prototype are frozen", () => {
    expect(Object.isFrozen(bc.BetterCatch)).toBe(true);
    expect(Object.isFrozen(bc.BetterCatch.prototype)).toBe(true);
  });

  test("Includes class BetterCatchAsync", () => {
    expect(bc.BetterCatchAsync).toBeTypeOf("function");
  });

  test("Class BetterCatchAsync and it's prototype are frozen", () => {
    expect(Object.isFrozen(bc.BetterCatchAsync)).toBe(true);
    expect(Object.isFrozen(bc.BetterCatch.prototype)).toBe(true);
  });
});

describe("Functions", () => {
  const error = new Error("Functions test error");

  describe("error", () => {
    test("Returns BetterCatch (error)", () => {
      const caught = bc.error(error);

      expect(caught).toBeInstanceOf(bc.BetterCatch);
      expect(capture(() => caught.orRethrow())).toBe(error);
    });
  });

  describe("safe", () => {
    test("Returns BetterCatch (ok) when the function returns", () => {
      const fn = vi.fn(() => true);
      const caught = bc.safe(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatch);
      expect(caught.andReturn()).toBe(true);
    });

    test("Returns BetterCatch (error) when the function throws", () => {
      const fn = vi.fn(() => {
        throw error;
      });
      const caught = bc.safe(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatch);
      expect(caught.andReturn((err) => err)).toBe(error);
    });
  });

  describe("safeAsync", () => {
    test("Returns BetterCatchAsync (ok) when the function returns", async () => {
      const fn = vi.fn(() => true);
      const caught = bc.safeAsync(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn()).resolves.toBe(true);
    });

    test("Returns BetterCatchAsync (ok) when the returned promise resolves", async () => {
      const fn = vi.fn(async () => true);
      const caught = bc.safeAsync(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn()).resolves.toBe(true);
    });

    test("Returns BetterCatchAsync (error) when the function throws", async () => {
      const fn = vi.fn(() => {
        throw error;
      });
      const caught = bc.safeAsync(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn((err) => err)).resolves.toBe(error);
    });

    test("Returns BetterCatchAsync (error) when the returned promise rejects", async () => {
      const fn = vi.fn(async () => {
        throw error;
      });
      const caught = bc.safeAsync(fn);

      expect(fn).toHaveBeenCalledExactlyOnceWith();
      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn((err) => err)).resolves.toBe(error);
    });
  });

  describe("safePromise", () => {
    test("Returns BetterCatchAsync (ok) when the promise resolves", async () => {
      const promise = Promise.resolve(true);
      const caught = bc.safePromise(promise);

      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn()).resolves.toBe(true);
    });

    test("Returns BetterCatchAsync (error) when the promise rejects", async () => {
      const promise = Promise.reject(error);
      const caught = bc.safePromise(promise);

      expect(caught).toBeInstanceOf(bc.BetterCatchAsync);
      await expect(caught).resolves.toBeInstanceOf(bc.BetterCatch);
      await expect(caught.andReturn((err) => err)).resolves.toBe(error);
    });
  });
});

describe("BetterCatch", () => {
  // When the contained value is the outcome of a successful function call
  // or promise resolution
  describe("ok", () => {
    const error = new Error("BetterCatch (ok) test error");
    const ok = bc.safe(() => "test");

    describe("constrain", () => {
      test("Returns itself (noop, type info only)", () => {
        expect(ok.constrain()).toBe(ok);
      });
    });

    describe("map", () => {
      test("Returns itself", () => {
        const fn = vi.fn(() => true);

        expect(ok.map(Error, fn)).toBe(ok);
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("mapExact", () => {
      test("Returns itself", () => {
        const fn = vi.fn(() => true);

        expect(ok.mapExact(Error, fn)).toBe(ok);
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("mapNonError", () => {
      test("Returns itself", () => {
        const fn = vi.fn(() => true);

        expect(ok.mapNonError(fn)).toBe(ok);
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("andReturn", () => {
      test("Returns the contained ok value", () => {
        const fn = vi.fn(() => true);

        expect(ok.andReturn(fn)).toBe("test");
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("andMapReturn", () => {
      test("Returns the contained ok value", () => {
        const fnMap = vi.fn(() => true);
        const fnDefault = vi.fn(() => true);

        expect(ok.andMapReturn(fnMap, fnDefault)).toBe("test");
        expect(fnMap).not.toHaveBeenCalled();
        expect(fnDefault).not.toHaveBeenCalled();
      });
    });

    describe("orRethrow", () => {
      test("Returns the contained ok value", () => {
        expect(ok.orRethrow()).toBe("test");
      });
    });

    describe("orThrow", () => {
      test("Returns the contained ok value", () => {
        const fn = vi.fn(() => error);

        expect(ok.orThrow(fn)).toBe("test");
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("andThrow", () => {
      test("Returns the contained ok value", () => {
        const fn = vi.fn(() => error);

        expect(ok.andThrow(fn)).toBe("test");
        expect(fn).not.toHaveBeenCalled();
      });
    });

    describe("andMapThrow", () => {
      test("Returns the contained ok value", () => {
        const fnMap = vi.fn(() => error);
        const fnDefault = vi.fn(() => error);

        expect(ok.andMapThrow(fnMap, fnDefault)).toBe("test");
        expect(fnMap).not.toHaveBeenCalled();
        expect(fnDefault).not.toHaveBeenCalled();
      });
    });
  });

  // When the contained value is  caught from a thrown error or promise
  // rejection, or instantiated with the 'error' function
  describe("error", () => {
    class Error2 extends Error {}
    class Error3 extends Error2 {}
    class Error4 extends Error3 {}

    const error = new Error("BetterCatch (error) test error");
    const error2 = new Error2("BetterCatch (error) test error 2");
    const error3 = new Error3("BetterCatch (error) test error 3");
    const error4 = new Error3("BetterCatch (error) test error 4");

    const err = bc.error(error);
    const err2 = bc.error(error2);
    const err3 = bc.error(error3);
    const nonError = bc.error("test");

    describe("constrain", () => {
      test("Returns itself (noop, type info only)", () => {
        expect(err.constrain()).toBe(err);
      });
    });

    describe("map", () => {
      test("Maps if the error is an instance of any of the provided classes", () => {
        const fn = vi.fn(() => true);

        expect(err.map(Error, fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);

        expect(err2.map(Error, fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error2);

        expect(err3.map(Error3, fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error3);

        expect(err.map([Error2, Error3, Error4, Error], fn).andReturn()).toBe(
          true,
        );
        expect(fn).toHaveBeenLastCalledWith(error);
      });

      test("Returns itself if the error is not an instance of any of the provided classes", () => {
        const fn = vi.fn(() => true);

        expect(err.map(Error2, fn)).toBe(err);
        expect(fn).not.toHaveBeenCalled();

        expect(err2.map([Error3, Error4], fn)).toBe(err2);
        expect(fn).not.toHaveBeenCalled();

        expect(nonError.map(Error, fn)).toBe(nonError);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Does not execute further mappers once one has succeeded", () => {
        const fn = vi.fn(() => true);
        const fnSkip = vi.fn(() => false);

        expect(
          err2
            .map(Error2, fn)
            .map(Error2, fnSkip)
            .mapExact(Error2, fnSkip)
            .mapNonError(fnSkip)
            .andReturn(),
        ).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error2);
        expect(fnSkip).not.toHaveBeenCalled();
      });

      test("Throws the error if the mapper throws", () => {
        expect(
          capture(() =>
            err.map(Error, () => {
              throw error2;
            }),
          ),
        ).toBe(error2);
      });
    });

    describe("mapExact", () => {
      test("Maps if the error is both an instance of and has the same constructor as any of the provided classes", () => {
        const fn = vi.fn(() => true);

        expect(err.mapExact(Error, fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);

        expect(err2.mapExact(Error2, fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error2);

        expect(
          err.mapExact([Error2, Error3, Error4, Error], fn).andReturn(),
        ).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);
      });

      test("Returns itself if the error is not an instance of any of the provided classes, or if it does not have the same constructor", () => {
        const fn = vi.fn(() => true);

        expect(err2.mapExact(Error, fn)).toBe(err2);
        expect(fn).not.toHaveBeenCalled();

        expect(err3.mapExact([Error, Error2], fn)).toBe(err3);
        expect(fn).not.toHaveBeenCalled();

        expect(nonError.mapExact(Error, fn)).toBe(nonError);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Does not execute further mappers once one has succeeded", () => {
        const fn = vi.fn(() => true);
        const fnSkip = vi.fn(() => false);

        expect(
          err2
            .mapExact(Error2, fn)
            .map(Error2, fnSkip)
            .mapExact(Error2, fnSkip)
            .mapNonError(fnSkip)
            .andReturn(),
        ).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error2);
        expect(fnSkip).not.toHaveBeenCalled();
      });

      test("Throws the error if the mapper throws", () => {
        expect(
          capture(() =>
            err.mapExact(Error, () => {
              throw error2;
            }),
          ),
        ).toBe(error2);
      });
    });

    describe("mapNonError", () => {
      test("Maps if the error is not an instance of Error", () => {
        const fn = vi.fn(() => true);
        const object = {};
        const map = new Map();

        expect(bc.error("test").mapNonError(fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith("test");

        expect(bc.error(object).mapNonError(fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(object);

        expect(bc.error(map).mapNonError(fn).andReturn()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(map);
      });

      test("Returns itself if the error is not an instance of any of the provided classes, or if it does not have the same constructor", () => {
        const fn = vi.fn(() => true);

        expect(err.mapNonError(fn).andReturn()).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();

        expect(err2.mapNonError(fn).andReturn()).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Does not execute further mappers once one has succeeded", () => {
        const fn = vi.fn(() => true);
        const fnSkip = vi.fn(() => false);

        expect(
          nonError
            .mapNonError(fn)
            .map(Error, fnSkip)
            .mapExact(Error, fnSkip)
            .mapNonError(fnSkip)
            .andReturn(),
        ).toBe(true);
        expect(fn).toHaveBeenLastCalledWith("test");
        expect(fnSkip).not.toHaveBeenCalled();
      });

      test("Throws the error if the mapper throws", () => {
        expect(
          capture(() =>
            bc.error(null).mapNonError(() => {
              throw error;
            }),
          ),
        ).toBe(error);
      });
    });

    describe("andReturn", () => {
      test("Returns the mapped value if a mapper was executed", () => {
        const fn = vi.fn(() => true);
        const fnDefault = vi.fn(() => false);

        expect(err.map(Error, fn).andReturn(fnDefault)).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);
        expect(fnDefault).not.toHaveBeenCalled();
      });

      test("Returns the result of the provided function if the value has not been mapped", () => {
        const fn = vi.fn(() => false);
        const fnDefault = vi.fn(() => true);

        expect(err.andReturn(fnDefault)).toBe(true);
        expect(fnDefault).toHaveBeenLastCalledWith(error);

        expect(err2.map(Error3, fn).andReturn(fnDefault)).toBe(true);
        expect(fn).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error2);
      });

      test("Returns undefined if the value has not been mapped and no default is provided", () => {
        const fn = vi.fn(() => true);

        expect(err.andReturn()).toBe(undefined);

        expect(err2.map(Error3, fn).andReturn()).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Throws the error if the default function throws", () => {
        expect(
          capture(() =>
            err.andReturn(() => {
              throw error2;
            }),
          ),
        ).toBe(error2);
      });
    });

    describe("andMapReturn", () => {
      test("Returns the result of the map function if a mapper has been executed", () => {
        const fn = vi.fn(() => "test");
        const fnReturn = vi.fn(() => true);
        const fnDefault = vi.fn(() => false);

        expect(err.map(Error, fn).andMapReturn(fnReturn, fnDefault)).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);
        expect(fnReturn).toHaveBeenLastCalledWith("test");
        expect(fnDefault).not.toHaveBeenCalled();
      });

      test("Returns the result of the default function if no mapper has been executed", () => {
        const fn = vi.fn(() => "test");
        const fnReturn = vi.fn(() => false);
        const fnDefault = vi.fn(() => true);

        expect(err.andMapReturn(fnReturn, fnDefault)).toBe(true);
        expect(fnReturn).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error);

        expect(err2.map(Error3, fn).andMapReturn(fnReturn, fnDefault)).toBe(
          true,
        );
        expect(fn).not.toHaveBeenCalled();
        expect(fnReturn).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error2);
      });

      test("Returns undefined if no mapper has been executed and no default function is provided", () => {
        const fn = vi.fn(() => true);
        const fnReturn = vi.fn(() => false);

        expect(err.andMapReturn(fnReturn)).toBe(undefined);
        expect(fnReturn).not.toHaveBeenCalled();

        expect(err2.map(Error3, fn).andMapReturn(fnReturn)).toBe(undefined);
        expect(fn).not.toHaveBeenCalled();
        expect(fnReturn).not.toHaveBeenCalled();
      });

      test("Throws the error if the map function throws", () => {
        const fn = vi.fn(() => true);

        expect(
          capture(() =>
            err.map(Error, fn).andMapReturn(() => {
              throw error2;
            }),
          ),
        ).toBe(error2);
        expect(fn).toHaveBeenLastCalledWith(error);
      });

      test("Throws the error if the default function throws", () => {
        const fnReturn = vi.fn(() => true);

        expect(
          capture(() =>
            err.andMapReturn(fnReturn, () => {
              throw error2;
            }),
          ),
        ).toBe(error2);
        expect(fnReturn).not.toHaveBeenCalled();
      });
    });

    describe("orRethrow", () => {
      test("Returns the mapped value if a mapper was executed", () => {
        const fn = vi.fn(() => true);

        expect(err.map(Error, fn).orRethrow()).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);
      });

      test("Throws the original error if no mapper was executed", () => {
        const fn = vi.fn(() => true);

        expect(capture(() => err.orRethrow())).toBe(error);

        expect(capture(() => err2.map(Error3, fn).orRethrow())).toBe(error2);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Throws the original error value if it is not an instance of Error", () => {
        expect(capture(() => bc.error("test").orRethrow())).toBe("test");
      });
    });

    describe("orThrow", () => {
      test("Returns the mapped value if a mapper was executed", () => {
        const fn = vi.fn(() => true);
        const fnDefault = vi.fn(() => error2);

        expect(err.map(Error, fn).orThrow(fnDefault)).toBe(true);
        expect(fn).toHaveBeenLastCalledWith(error);
        expect(fnDefault).not.toHaveBeenCalled();
      });

      test("Throws the result of the default function if no mapper was executed", () => {
        const fn = vi.fn(() => true);
        const fnDefault = vi.fn(() => error3);

        expect(capture(() => err.orThrow(fnDefault))).toBe(error3);
        expect(fnDefault).toHaveBeenLastCalledWith(error);

        expect(capture(() => err2.map(Error3, fn).orThrow(fnDefault))).toBe(
          error3,
        );
        expect(fn).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error2);
      });

      test("Throws the error if the default function throws", () => {
        const fnDefault = vi.fn(() => error2);

        expect(capture(() => err.orThrow(fnDefault))).toBe(error2);
        expect(fnDefault).toHaveBeenLastCalledWith(error);
      });
    });

    describe("andThrow", () => {
      test("Throws the mapped value if a mapper was executed", () => {
        const fn = vi.fn(() => error2);
        const fnDefault = vi.fn(() => error3);

        expect(capture(() => err.map(Error, fn).andThrow())).toBe(error2);
        expect(fn).toHaveBeenLastCalledWith(error);
        expect(fnDefault).not.toHaveBeenCalled();
      });

      test("Throws the result of the default function if no mapper was executed", () => {
        const fn = vi.fn(() => error2);
        const fnDefault = vi.fn(() => error3);

        expect(capture(() => err.andThrow(fnDefault))).toBe(error3);
        expect(fnDefault).toHaveBeenLastCalledWith(error);

        expect(capture(() => err2.map(Error3, fn).orThrow(fnDefault))).toBe(
          error3,
        );
        expect(fn).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error2);
      });

      test("Throws the original error if no mapper was executed and no default function is provided", () => {
        const fn = vi.fn(() => error2);

        expect(capture(() => err.andThrow())).toBe(error);

        expect(capture(() => err2.map(Error3, fn).andThrow())).toBe(error2);
        expect(fn).not.toHaveBeenCalled();
      });

      test("Throws the original error value if it is not an instance of Error", () => {
        expect(capture(() => bc.error("test").andThrow())).toBe("test");
      });

      test("Throws the error if the default function throws", () => {
        expect(
          capture(() =>
            err.andThrow(() => {
              throw error2;
            }),
          ),
        ).toBe(error2);
      });
    });

    describe("andMapThrow", () => {
      test("Throws the result of the map function if a mapper has been executed", () => {
        const fn = vi.fn(() => "test");
        const fnThrow = vi.fn(() => error2);
        const fnDefault = vi.fn(() => error3);

        expect(
          capture(() => err.map(Error, fn).andMapThrow(fnThrow, fnDefault)),
        ).toBe(error2);
        expect(fn).toHaveBeenLastCalledWith(error);
        expect(fnThrow).toHaveBeenLastCalledWith("test");
        expect(fnDefault).not.toHaveBeenCalled();
      });

      test("Throws the result of the default function if no mapper has been executed", () => {
        const fn = vi.fn(() => "test");
        const fnThrow = vi.fn(() => error3);
        const fnDefault = vi.fn(() => error4);

        expect(capture(() => err.andMapThrow(fnThrow, fnDefault))).toBe(error4);
        expect(fnThrow).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error);

        expect(
          capture(() => err2.map(Error3, fn).andMapThrow(fnThrow, fnDefault)),
        ).toBe(error4);
        expect(fn).not.toHaveBeenCalled();
        expect(fnThrow).not.toHaveBeenCalled();
        expect(fnDefault).toHaveBeenLastCalledWith(error2);
      });

      test("Throws the original error if no mapper was executed and no default function is provided", () => {
        const fn = vi.fn(() => error2);
        const fnThrow = vi.fn(() => error3);

        expect(capture(() => err.andMapThrow(fnThrow))).toBe(error);
        expect(fnThrow).not.toHaveBeenCalled();

        expect(capture(() => err2.map(Error3, fn).andMapThrow(fnThrow))).toBe(
          error2,
        );
        expect(fn).not.toHaveBeenCalled();
        expect(fnThrow).not.toHaveBeenCalled();
      });

      test("Throws the original error value if it is not an instance of Error", () => {
        const fnThrow = vi.fn(() => error);

        expect(capture(() => bc.error("test").andMapThrow(fnThrow))).toBe(
          "test",
        );
        expect(fnThrow).not.toHaveBeenCalled();
      });

      test("Throws the error if the map function throws", () => {
        const fn = vi.fn(() => error2);

        expect(
          capture(() =>
            err.map(Error, fn).andMapThrow(() => {
              throw error3;
            }),
          ),
        ).toBe(error3);
        expect(fn).toHaveBeenLastCalledWith(error);
      });

      test("Throws the error if the default function throws", () => {
        const fnThrow = vi.fn(() => error2);

        expect(
          capture(() =>
            err.andMapThrow(fnThrow, () => {
              throw error3;
            }),
          ),
        ).toBe(error3);
        expect(fnThrow).not.toHaveBeenCalled();
      });
    });
  });

  // The result of calling safeAsync or safePromise
  describe("async", async () => {
    const caught = bc.safeAsync(async () => "test");
    const resolved = await caught;

    describe("constrain", () => {
      test("Returns itself (noop, type info only)", () => {
        expect(caught.constrain()).toBe(caught);
      });
    });

    describe("map", () => {
      test("Invokes the underlying map method", async () => {
        const fn = () => true;
        const spy = vi.spyOn(resolved, "map");
        const mapped = await caught.map(Error, fn);

        expect(mapped).toBeInstanceOf(bc.BetterCatch);
        expect(spy).toHaveBeenCalledExactlyOnceWith(Error, fn);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("mapExact", () => {
      test("Invokes the underlying mapExact method", async () => {
        const fn = () => true;
        const spy = vi.spyOn(resolved, "mapExact");
        const mapped = await caught.mapExact(Error, fn);

        expect(mapped).toBeInstanceOf(bc.BetterCatch);
        expect(spy).toHaveBeenCalledExactlyOnceWith(Error, fn);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("mapNonError", () => {
      test("Invokes the underlying mapNonError method", async () => {
        const fn = () => true;
        const spy = vi.spyOn(resolved, "mapNonError");
        const mapped = await caught.mapNonError(fn);

        expect(mapped).toBeInstanceOf(bc.BetterCatch);
        expect(spy).toHaveBeenCalledExactlyOnceWith(fn);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("andReturn", () => {
      test("Invokes the underlying andReturn method", async () => {
        const fnDefault = () => true;
        const spy = vi.spyOn(resolved, "andReturn");
        const mapped = await caught.andReturn(fnDefault);

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith(fnDefault);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("andMapReturn", () => {
      test("Invokes the underlying andReturn method", async () => {
        const fnMap = () => true;
        const fnDefault = () => false;
        const spy = vi.spyOn(resolved, "andMapReturn");
        const mapped = await caught.andMapReturn(fnMap, fnDefault);

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith(fnMap, fnDefault);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("orRethrow", () => {
      test("Invokes the underlying orRethrow method", async () => {
        const spy = vi.spyOn(resolved, "orRethrow");
        const mapped = await caught.orRethrow();

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith();
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("orThrow", () => {
      test("Invokes the underlying orThrow method", async () => {
        const fnDefault = () => new Error();
        const spy = vi.spyOn(resolved, "orThrow");
        const mapped = await caught.orThrow(fnDefault);

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith(fnDefault);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("andThrow", () => {
      test("Invokes the underlying andReturn method", async () => {
        const fnDefault = () => new Error();
        const spy = vi.spyOn(resolved, "andThrow");
        const mapped = await caught.andThrow(fnDefault);

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith(fnDefault);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });

    describe("andMapThrow", () => {
      test("Invokes the underlying andMapThrow method", async () => {
        const fnMap = () => new Error();
        const fnDefault = () => new Error();
        const spy = vi.spyOn(resolved, "andMapThrow");
        const mapped = await caught.andMapThrow(fnMap, fnDefault);

        expect(mapped).toBe("test");
        expect(spy).toHaveBeenCalledExactlyOnceWith(fnMap, fnDefault);
        expect(spy).toHaveReturnedWith(mapped);
      });
    });
  });
});

describe("Method chaining", () => {
  class Error2 extends Error {}
  class Error3 extends Error2 {}
  class Error4 extends Error {}

  const fnMap = (err: Error) => `map: ${err.message}`;
  const fnMapExact = (err: Error) => `mapExact: ${err.message}`;
  const fnMapExact2 = () => "mapExact2: never";
  const fnMapNonError = (value: unknown) => `mapNonError: ${value}`;
  const fnReturn = (value: string) => `return: ${value}`;
  const fnDefault = (value: unknown) => `default: ${value}`;

  describe("sync", () => {
    function map(caught: bc.BetterCatch<any, any>): any {
      return caught
        .mapExact(Error, fnMapExact)
        .map(Error2, fnMap)
        .mapExact(Error3, fnMapExact2)
        .mapNonError(fnMapNonError)
        .andMapReturn(fnReturn, fnDefault);
    }

    test("Correctly maps an ok outcome", () => {
      expect(map(bc.safe(() => "ok"))).toBe("ok");
    });

    test("Correctly maps an Error instance (map exact, map return)", () => {
      const error = new Error("test");
      const expected = fnReturn(fnMapExact(error));

      expect(map(bc.error(error))).toBe(expected);
    });

    test("Correctly maps an Error2 instance (map, map return)", () => {
      const error = new Error2("test");
      const expected = fnReturn(fnMap(error));

      expect(map(bc.error(error))).toBe(expected);
    });

    test("Correctly maps an Error3 instance (map, map return)", () => {
      const error = new Error3("test");
      const expected = fnReturn(fnMap(error));

      expect(map(bc.error(error))).toBe(expected);
    });

    test("Correctly maps an Error4 instance (default return)", () => {
      const error = new Error4("test");
      const expected = fnDefault(error);

      expect(map(bc.error(error))).toBe(expected);
    });

    test("Correctly maps a non-error value (map non-error, map return)", () => {
      const error = "non error";
      const expected = fnReturn(fnMapNonError(error));

      expect(map(bc.error(error))).toBe(expected);
    });
  });

  describe("async", () => {
    function map(caught: bc.BetterCatchAsync<any, any>): Promise<any> {
      return caught
        .mapExact(Error, fnMapExact)
        .map(Error2, fnMap)
        .mapExact(Error3, fnMapExact2)
        .mapNonError(fnMapNonError)
        .andMapReturn(fnReturn, fnDefault);
    }

    function caughtAsync(value: unknown): bc.BetterCatchAsync<any, any> {
      return bc.safeAsync(async () => {
        throw value;
      });
    }

    test("Correctly maps an ok outcome", async () => {
      await expect(map(bc.safeAsync(async () => "ok"))).resolves.toBe("ok");
    });

    test("Correctly maps an Error instance (map exact, map return)", async () => {
      const error = new Error("test");
      const expected = fnReturn(fnMapExact(error));

      await expect(map(caughtAsync(error))).resolves.toBe(expected);
    });

    test("Correctly maps an Error2 instance (map, map return)", async () => {
      const error = new Error2("test");
      const expected = fnReturn(fnMap(error));

      await expect(map(caughtAsync(error))).resolves.toBe(expected);
    });

    test("Correctly maps an Error3 instance (map, map return)", async () => {
      const error = new Error3("test");
      const expected = fnReturn(fnMap(error));

      await expect(map(caughtAsync(error))).resolves.toBe(expected);
    });

    test("Correctly maps an Error4 instance (default return)", async () => {
      const error = new Error4("test");
      const expected = fnDefault(error);

      await expect(map(caughtAsync(error))).resolves.toBe(expected);
    });

    test("Correctly maps a non-error value (map non-error, map return)", async () => {
      const error = "non error";
      const expected = fnReturn(fnMapNonError(error));

      await expect(map(caughtAsync(error))).resolves.toBe(expected);
    });
  });
});
