// Device storage (IndexedDB). This is the source of truth on the phone, so logging works
// offline. drive.js copies changes to the user's own Google Drive when signed in.
//
// records: key 'days/YYYY-MM-DD' | 'foods/<id>' | 'settings/main' -> {v, m, dirty}
//          v is the value (null = deleted), m is the last-modified time in ms.
// photos:  key <photo id> -> {name, blob, driveId, deleted}
// meta:    small bookkeeping values for sync.
const DB_NAME = 'health-tracker';
let dbp = null;

function open() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      for (const s of ['records', 'photos', 'meta']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s);
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function os(name, mode) { return (await open()).transaction(name, mode).objectStore(name); }

export async function get(name, key) { return req((await os(name, 'readonly')).get(key)); }
export async function put(name, key, val) { return req((await os(name, 'readwrite')).put(val, key)); }
export async function del(name, key) { return req((await os(name, 'readwrite')).delete(key)); }
export async function all(name) {
  const s = await os(name, 'readonly');
  const [keys, vals] = await Promise.all([req(s.getAllKeys()), req(s.getAll())]);
  return keys.map((k, i) => [k, vals[i]]);
}

export async function setRecord(key, v) { await put('records', key, { v: v == null ? null : v, m: Date.now(), dirty: true }); }

export async function loadState() {
  const out = { days: {}, foods: {}, settings: {} };
  for (const [k, r] of await all('records')) {
    if (!r || r.v == null) continue;
    const i = k.indexOf('/'), col = k.slice(0, i), id = k.slice(i + 1);
    if (col === 'days') out.days[id] = r.v;
    else if (col === 'foods') out.foods[id] = r.v;
    else if (k === 'settings/main') out.settings = r.v;
  }
  return out;
}

export async function pendingCount() {
  let n = 0;
  for (const [, r] of await all('records')) if (r && r.dirty) n++;
  for (const [, p] of await all('photos')) if (p && (p.deleted || !p.driveId)) n++;
  return n;
}
