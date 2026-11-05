import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { createThemeStore, THEME_INIT } from "./theme";

function fixture(preference = null, dark = false, blocked = false) {
  let stored = preference;
  const classes = new Set();
  const mediaListeners = new Set();
  const storageListeners = new Set();
  const styles = new Set();
  const media = {
    matches: dark,
    addEventListener: (_, listener) => mediaListeners.add(listener),
    removeEventListener: (_, listener) => mediaListeners.delete(listener),
  };
  const root = {
    classList: {
      add: (value) => classes.add(value),
      remove: (...values) => values.forEach((value) => classes.delete(value)),
    },
    style: {},
  };
  const browser = {
    localStorage: {
      getItem() {
        if (blocked) throw new Error("blocked");
        return stored;
      },
      setItem(_, value) {
        if (blocked) throw new Error("blocked");
        stored = value;
      },
    },
    matchMedia: () => media,
    addEventListener: (_, listener) => storageListeners.add(listener),
    removeEventListener: (_, listener) => storageListeners.delete(listener),
    document: {
      documentElement: root,
      head: { appendChild: (node) => styles.add(node) },
      createElement: () => {
        const node = { remove: () => styles.delete(node) };
        return node;
      },
    },
    getComputedStyle: () => ({ getPropertyValue: () => "black" }),
    setTimeout,
    clearTimeout,
  };
  const storage = (value, key = "theme", storageArea = browser.localStorage) => {
    stored = value;
    for (const listener of storageListeners) listener({ key, newValue: value, storageArea });
  };
  const system = (value) => {
    media.matches = value;
    for (const listener of mediaListeners) listener();
  };
  return { browser, classes, root, mediaListeners, storageListeners, styles, storage, system };
}

describe("theme bootstrap and store", () => {
  it("runs the exact blocking initializer for all stored and system preferences", () => {
    for (const preference of [null, "system", "light", "dark", "retired-theme"]) {
      for (const dark of [false, true]) {
        const f = fixture(preference, dark);
        f.classes.add("unrelated");
        runInNewContext(THEME_INIT.__html, { window: f.browser, document: f.browser.document });
        const expected =
          preference === "dark" || (preference !== "light" && dark) ? "dark" : "light";
        assert.deepEqual([...f.classes], ["unrelated", expected]);
        assert.equal(f.root.style.colorScheme, expected);
      }
    }
  });
  it("uses system preference with blocked storage and still accepts manual changes", () => {
    const f = fixture(null, true, true);
    runInNewContext(THEME_INIT.__html, { window: f.browser, document: f.browser.document });
    assert.ok(f.classes.has("dark"));
    const store = createThemeStore(f.browser);
    const unsubscribe = store.subscribe(() => {});
    store.setTheme("light");
    assert.equal(store.getSnapshot(), "light");
    assert.ok(f.classes.has("light"));
    unsubscribe();
  });
  it("cycles preferences, follows system only when selected and synchronizes storage", () => {
    const f = fixture("dark");
    const store = createThemeStore(f.browser);
    const unsubscribe = store.subscribe(() => {});
    assert.equal(store.getSnapshot(), "dark");
    f.system(false);
    assert.ok(f.classes.has("dark"));
    store.setTheme("system");
    assert.ok(f.classes.has("light"));
    f.system(true);
    assert.ok(f.classes.has("dark"));
    f.storage("light");
    assert.equal(store.getSnapshot(), "light");
    assert.ok(f.classes.has("light"));
    f.storage("obsolete");
    assert.equal(store.getSnapshot(), "system");
    f.storage("light", "unrelated");
    assert.equal(store.getSnapshot(), "system");
    f.storage("dark", "theme", {});
    assert.equal(store.getSnapshot(), "system");
    f.storage(null, null);
    assert.equal(store.getSnapshot(), "system");
    unsubscribe();
    assert.equal(f.mediaListeners.size, 0);
    assert.equal(f.storageListeners.size, 0);
    assert.equal(f.styles.size, 0);
  });
  it("shares listeners and cleans up only after the last subscriber", () => {
    const f = fixture("light");
    const store = createThemeStore(f.browser);
    let updates = 0;
    const first = store.subscribe(() => updates++);
    const second = store.subscribe(() => updates++);
    store.setTheme("dark");
    assert.equal(updates, 2);
    assert.equal(f.mediaListeners.size, 1);
    first();
    assert.equal(f.mediaListeners.size, 1);
    second();
    assert.equal(f.mediaListeners.size, 0);
  });
});
