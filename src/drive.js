// Google Drive sync. Runs entirely in the browser: no server, no client secret.
//
// Sign-in uses Google's OAuth 2.0 flow for browser apps (redirect, response_type=token)
// with the drive.file scope, which only lets this app see files it created itself.
// Everything lives in one folder in the user's Drive:
//
//   Health Tracker/
//     data/days-YYYY-MM.json, data/foods.json, data/settings.json
//     photos/YYYY-MM-DD-<meal>-<id>.jpg
//
// Each data file holds records with a last-modified time, so two devices can merge:
// the newer copy of a record wins.
import { CLIENT_ID } from './config.js';
import * as store from './store.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const API = 'https://www.googleapis.com/drive/v3';
const UP = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const ROOT_NAME = 'Health Tracker';
const TOKEN_KEY = 'ht-token', CONNECTED_KEY = 'ht-connected', STATE_KEY = 'ht-oauth-state';

export class AuthError extends Error {}

const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
};
const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

export const configured = () => !!CLIENT_ID;
export const connected = () => ls.get(CONNECTED_KEY) === '1';

// The access token lasts about an hour and is kept only on this device.
export function token() {
  try {
    const t = JSON.parse(ls.get(TOKEN_KEY) || 'null');
    if (t && t.exp > Date.now()) return t.t;
  } catch (e) { /* ignore */ }
  return null;
}
function clearToken() { ls.del(TOKEN_KEY); }

function redirectUri() { return location.origin + location.pathname.replace(/index\.html$/, ''); }

export function signIn(silent) {
  const state = rand();
  try { sessionStorage.setItem(STATE_KEY, state); } catch (e) { /* ignore */ }
  const p = new URLSearchParams({
    client_id: CLIENT_ID, redirect_uri: redirectUri(), response_type: 'token',
    scope: SCOPE, include_granted_scopes: 'true', state,
  });
  if (silent) p.set('prompt', 'none');
  location.assign('https://accounts.google.com/o/oauth2/v2/auth?' + p);
}

// Call once on load. Returns null when this load is not an OAuth return.
export function handleRedirect() {
  const hash = location.hash.slice(1);
  if (!/(^|&)(access_token|error)=/.test(hash)) return null;
  const h = new URLSearchParams(hash);
  history.replaceState(null, '', location.pathname + location.search);
  let expected = null;
  try { expected = sessionStorage.getItem(STATE_KEY); sessionStorage.removeItem(STATE_KEY); } catch (e) { /* ignore */ }
  if (!expected || h.get('state') !== expected) return { error: 'state_mismatch' };
  if (h.get('error')) return { error: h.get('error') };
  if (!(h.get('scope') || '').split(' ').includes(SCOPE)) return { error: 'scope_not_granted' };
  const ttl = Math.max(60, Number(h.get('expires_in')) || 3600) - 60;
  ls.set(TOKEN_KEY, JSON.stringify({ t: h.get('access_token'), exp: Date.now() + ttl * 1000 }));
  ls.set(CONNECTED_KEY, '1');
  return { ok: true };
}

export async function disconnect() {
  const t = token();
  clearToken();
  ls.del(CONNECTED_KEY);
  folders = null;
  if (t) {
    try { await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'token=' + encodeURIComponent(t) }); } catch (e) { /* offline: token expires on its own */ }
  }
}

async function api(url, opt = {}) {
  const t = token();
  if (!t) throw new AuthError('signed out');
  const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({}, opt.headers, { Authorization: 'Bearer ' + t }) }));
  if (r.status === 401) { clearToken(); throw new AuthError('token expired'); }
  if (!r.ok) { const e = new Error('Drive request failed (' + r.status + ')'); e.status = r.status; throw e; }
  return r;
}
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

async function list(query, fields) {
  const out = [];
  let pageToken = '';
  do {
    const p = new URLSearchParams({ q: query, fields: 'nextPageToken,files(' + fields + ')', pageSize: '1000', spaces: 'drive' });
    if (pageToken) p.set('pageToken', pageToken);
    const r = await (await api(API + '/files?' + p)).json();
    out.push(...r.files);
    pageToken = r.nextPageToken || '';
  } while (pageToken);
  return out;
}

async function folder(name, parent) {
  const query = 'mimeType=' + q(FOLDER) + ' and trashed=false and name=' + q(name) + (parent ? ' and ' + q(parent) + ' in parents' : '');
  const found = await list(query, 'id');
  if (found.length) return found[0].id;
  const body = { name, mimeType: FOLDER };
  if (parent) body.parents = [parent];
  const r = await (await api(API + '/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
  return r.id;
}

let folders = null;
async function ensureFolders() {
  if (!folders) {
    const root = await folder(ROOT_NAME, null);
    folders = { root, data: await folder('data', root), photos: await folder('photos', root) };
  }
  return folders;
}

async function upload(name, parent, id, blob) {
  const b = 'ht' + rand();
  const meta = id ? {} : { name, parents: [parent] };
  const body = new Blob([
    '--' + b + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n', JSON.stringify(meta),
    '\r\n--' + b + '\r\nContent-Type: ' + blob.type + '\r\n\r\n', blob, '\r\n--' + b + '--',
  ]);
  const url = UP + '/files' + (id ? '/' + id : '') + '?uploadType=multipart&fields=id,modifiedTime';
  return (await api(url, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body })).json();
}

export function fileFor(key) {
  if (key.startsWith('days/')) return 'days-' + key.slice(5, 12) + '.json';
  if (key.startsWith('foods/')) return 'foods.json';
  return 'settings.json';
}
const DATA_FILE = /^(days-\d{4}-\d{2}|foods|settings)\.json$/;

// Two-way sync. Returns true when records arrived from Drive and the UI should reload.
export async function sync() {
  const f = await ensureFolders();
  const remote = {};
  for (const x of await list(q(f.data) + ' in parents and trashed=false', 'id,name,modifiedTime')) remote[x.name] = x;
  const seen = (await store.get('meta', 'remoteMod')) || {};
  const recs = new Map(await store.all('records'));
  const dirty = new Set();
  let pulled = false;

  for (const name of Object.keys(remote)) {
    if (!DATA_FILE.test(name) || seen[name] === remote[name].modifiedTime) continue;
    const data = await (await api(API + '/files/' + remote[name].id + '?alt=media')).json();
    const rr = (data && data.records) || {};
    for (const k of Object.keys(rr)) {
      const r = rr[k], l = recs.get(k);
      if (!r || typeof r.m !== 'number' || fileFor(k) !== name) continue;
      if (!l || r.m > l.m) {
        const v = { v: r.v, m: r.m, dirty: false };
        recs.set(k, v);
        await store.put('records', k, v);
        pulled = true;
      } else if (l.m > r.m) dirty.add(name);
    }
    for (const [k] of recs) if (fileFor(k) === name && !(k in rr)) dirty.add(name);
    seen[name] = remote[name].modifiedTime;
  }
  for (const [k, l] of recs) if (l && l.dirty) dirty.add(fileFor(k));

  for (const name of dirty) {
    const out = { format: 'health-tracker/1', records: {} };
    for (const [k, l] of recs) if (fileFor(k) === name) out.records[k] = { v: l.v, m: l.m };
    const res = await upload(name, f.data, remote[name] && remote[name].id, new Blob([JSON.stringify(out)], { type: 'application/json' }));
    seen[name] = res.modifiedTime;
    for (const k of Object.keys(out.records)) {
      const cur = await store.get('records', k);
      if (cur && cur.dirty && cur.m === out.records[k].m) { cur.dirty = false; await store.put('records', k, cur); }
    }
  }
  await store.put('meta', 'remoteMod', seen);
  await syncPhotos(f);
  return pulled;
}

async function findPhoto(name, f) {
  const found = await list('name=' + q(name) + ' and ' + q(f.photos) + ' in parents and trashed=false', 'id');
  return found.length ? found[0].id : null;
}

async function syncPhotos(f) {
  for (const [id, p] of await store.all('photos')) {
    if (!p) continue;
    if (p.deleted) {
      const driveId = p.driveId || await findPhoto(p.name, f);
      if (driveId) {
        try { await api(API + '/files/' + driveId, { method: 'DELETE' }); } catch (e) { if (e.status !== 404) throw e; }
      }
      await store.del('photos', id);
    } else if (!p.driveId && p.blob) {
      const r = await upload(p.name, f.photos, null, p.blob);
      const cur = await store.get('photos', id);
      if (cur && !cur.deleted) { cur.driveId = r.id; await store.put('photos', id, cur); }
    }
  }
}

// A photo taken on another device: download it once and keep a copy here.
export async function fetchPhoto(id, name) {
  const f = await ensureFolders();
  const driveId = await findPhoto(name, f);
  if (!driveId) return null;
  const blob = await (await api(API + '/files/' + driveId + '?alt=media')).blob();
  await store.put('photos', id, { name, blob, driveId, deleted: false });
  return blob;
}
