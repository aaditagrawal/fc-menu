import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createNotificationStore } from "./notifications";

function fixture() {
  let time = 0;
  const tasks = new Map<() => void, number>();
  const store = createNotificationStore(
    () => time,
    (callback, delay) => {
      tasks.set(callback, time + delay);
      return () => {
        tasks.delete(callback);
      };
    },
  );
  const advance = (milliseconds: number) => {
    time += milliseconds;
    for (const [callback, deadline] of tasks) {
      if (deadline <= time) {
        tasks.delete(callback);
        callback();
      }
    }
  };
  return { store, tasks, advance };
}

describe("notification lifecycle", () => {
  it("keeps a stable SSR-safe snapshot and expires messages after subscription", () => {
    const { store, tasks, advance } = fixture();
    const empty = store.getSnapshot();
    assert.equal(store.getSnapshot(), empty);
    const id = store.push("Refreshed", "success");
    assert.equal(tasks.size, 0);
    const unsubscribe = store.subscribe(() => {});
    assert.deepEqual(store.getSnapshot(), [{ id, message: "Refreshed", kind: "success" }]);
    advance(3999);
    assert.equal(store.getSnapshot().length, 1);
    advance(1);
    assert.equal(store.getSnapshot().length, 0);
    unsubscribe();
  });
  it("preserves remaining time across overlapping hover, focus and hidden pauses", () => {
    const { store, advance } = fixture();
    store.subscribe(() => {});
    store.push("Error", "error");
    advance(1000);
    store.pause("hover", true);
    store.pause("focus", true);
    advance(10000);
    store.pause("hover", false);
    advance(10000);
    assert.equal(store.getSnapshot().length, 1);
    store.pause("focus", false);
    advance(2999);
    assert.equal(store.getSnapshot().length, 1);
    store.pause("hidden", true);
    advance(10000);
    store.pause("hidden", false);
    advance(1);
    assert.equal(store.getSnapshot().length, 0);
  });
  it("cleans timers on unmount and resumes remaining duration on remount", () => {
    const { store, tasks, advance } = fixture();
    const unsubscribe = store.subscribe(() => {});
    store.push("Message", "message", { duration: 1500 });
    advance(1000);
    unsubscribe();
    assert.equal(tasks.size, 0);
    advance(10000);
    store.subscribe(() => {});
    advance(500);
    assert.equal(store.getSnapshot().length, 0);
  });
  it("retains burst messages, expires hidden entries and cancels dismissal", () => {
    const { store, tasks, advance } = fixture();
    store.subscribe(() => {});
    for (let i = 0; i < 30; i++) store.push(String(i), "message");
    assert.equal(store.getSnapshot().length, 30);
    assert.equal(tasks.size, 30);
    store.dismiss(store.getSnapshot()[0].id);
    assert.equal(tasks.size, 29);
    assert.equal(store.getSnapshot()[0].message, "1");
    advance(3999);
    assert.equal(store.getSnapshot().length, 29);
    advance(1);
    assert.equal(store.getSnapshot().length, 0);
    assert.equal(tasks.size, 0);
  });
  it("allows persistent notifications without scheduling an infinite timer", () => {
    const { store, tasks, advance } = fixture();
    store.subscribe(() => {});
    const id = store.push("Persistent", "message", { duration: Infinity });
    assert.equal(tasks.size, 0);
    advance(100000);
    assert.equal(store.getSnapshot().length, 1);
    store.dismiss(id);
    assert.equal(store.getSnapshot().length, 0);
  });
});
