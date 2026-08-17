/**
 * The value space `JSON.parse` and `Response.json()` actually produce.
 *
 * Naming it keeps the untrusted edge of the app explicit: a payload is a
 * `JsonValue` until a decoder turns it into a domain type, so nothing
 * downstream has to re-check what a value is made of.
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** A JSON object: the only JSON shape with named fields. */
export type JsonObject = { [key: string]: JsonValue };

/**
 * JSON decodes to built-in types only, so the built-in class tag identifies a
 * value exactly — and, unlike `instanceof`, it stays correct for values that
 * crossed a realm boundary (an iframe, a worker, a different bundle).
 */
function jsonTag(value: JsonValue): string {
  return Object.prototype.toString.call(value);
}

/** True for a plain JSON object. `null` and arrays carry their own tags, so both are excluded. */
export function isJsonObject(value: JsonValue): value is JsonObject {
  return jsonTag(value) === "[object Object]";
}

/** True for a JSON string. */
export function isJsonString(value: JsonValue): value is string {
  return jsonTag(value) === "[object String]";
}
