import { describe, expect, test } from "bun:test";
import { hasDuplicateItem, isValidQuantity, parseBulkItems } from "../src/utils/shoppingValidation";
import { getFromLocalStorage, saveToLocalStorage } from "../src/utils/localStorageUtils";

describe("shopping edge cases", () => {
  test("single add rejects an existing name including purchased items", () => {
    expect(hasDuplicateItem([{ id: "1", name: " חלב " }], "חלב")).toBe(true);
  });
  test("bulk input skips duplicate lines within the same submission", () => {
    expect(parseBulkItems("חלב\nחלב 2\nלחם", []).entries).toEqual([{ name: "חלב", quantity: 1 }, { name: "לחם", quantity: 1 }]);
  });
  test("bulk duplicate comparison normalizes whitespace", () => {
    expect(parseBulkItems("נייר  טואלט", [{ name: " נייר טואלט " }]).duplicates).toBe(1);
  });
  test("quantity must be a positive whole number", () => {
    for (const value of [0, -1, 1.5, NaN, Infinity]) expect(isValidQuantity(value)).toBe(false);
    expect(isValidQuantity(1)).toBe(true);
  });
  test("editing the same item is not a duplicate", () => {
    expect(hasDuplicateItem([{ id: "1", name: "חלב" }], "חלב", "1")).toBe(false);
  });
  test("offline backups do not cross lists or accounts", () => {
    const storage = new Map<string, string>();
    globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => { storage.set(key, value); } } as Storage;
    const items = [{ id: "1", name: "חלב", category: "מוצרי חלב", quantity: 1, completed: false }];
    saveToLocalStorage(items, "user-a", "list-a");
    expect(getFromLocalStorage("user-a", "list-a")).toEqual(items);
    expect(getFromLocalStorage("user-a", "list-b")).toEqual([]);
    expect(getFromLocalStorage("user-b", "list-a")).toEqual([]);
    storage.set("shopping_list_backup:user-a:list-a", '{"invalid":true}');
    expect(getFromLocalStorage("user-a", "list-a")).toEqual([]);
  });
});