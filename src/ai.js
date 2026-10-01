// Reads a meal photo with Claude and returns the foods on it with calories and macros.
// Optional: only runs once the user pastes their own Anthropic API key in Settings.
// The key is kept on this device only (IndexedDB). It is never written to Drive or the repo.
import Anthropic from '../vendor/anthropic-sdk.min.js';
import * as store from './store.js';

const MODEL = 'claude-opus-5-5';
const KEY = 'anthropicKey';
const MAX_SIDE = 1280;

export async function getKey() { return (await store.get('meta', KEY)) || ''; }
export async function setKey(k) {
  if (k) await store.put('meta', KEY, k);
  else await store.del('meta', KEY);
}

const ITEM = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'amount', 'unit', 'kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'food_id'],
  properties: {
    name: { type: 'string' },
    amount: { type: 'number' },
    unit: { type: 'string', enum: ['g', 'ml'] },
    kcal: { type: 'number' },
    protein_g: { type: 'number' },
    carbs_g: { type: 'number' },
    fat_g: { type: 'number' },
    fiber_g: { type: 'number' },
    food_id: { type: 'string' },
  },
};
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items', 'note'],
  properties: { items: { type: 'array', items: ITEM }, note: { type: 'string' } },
};

const SYSTEM = `You log meals for a calorie tracker from a single photo.

List each distinct food or drink you can see as its own item. Estimate the portion in grams (or millilitres for drinks) from the plate, bowl and cutlery sizes, then give calories, protein, carbs, fat and fiber for that portion.

The user's saved foods are listed below with values per 100 g or ml. When an item is clearly one of them, set food_id to its id and compute from its values. Otherwise set food_id to an empty string and use typical values for that dish as it is usually home-cooked, including cooking oil.

If the photo shows a nutrition label rather than a plate, use the label's values per 100 g or ml with a typical single serving unless the label states one.

Use "note" for one short sentence on the biggest uncertainty in the estimate. If the photo shows no food, return no items and say so in the note.`;

function foodsList(foods) {
  const rows = Object.keys(foods).map(id => {
    const f = foods[id], p = f.per100 || {};
    return `- id "${id}": ${f.name}${f.brand ? ' (' + f.brand + ')' : ''}, per 100 ${f.unit}: ${p.kcal} kcal, P ${p.p}, C ${p.c}, F ${p.f}, fiber ${p.fi}`;
  });
  return rows.length ? rows.join('\n') : '(none saved yet)';
}

async function toBase64Jpeg(blob) {
  const bmp = await createImageBitmap(blob);
  const s = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', 0.85);
  return url.slice(url.indexOf(',') + 1);
}

// Plain-language reasons the UI can show.
export class ReadError extends Error {}

export async function readMeal(blob, meal, foods) {
  const apiKey = await getKey();
  if (!apiKey) throw new ReadError('Add your Claude API key in Settings first.');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1 });
  let res;
  try {
    res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM + '\n\nSaved foods:\n' + foodsList(foods),
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: await toBase64Jpeg(blob) } },
          { type: 'text', text: 'This is my ' + meal + '. Log what is on it.' },
        ],
      }],
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new ReadError('Claude rejected the API key. Check it in Settings.');
    if (e instanceof Anthropic.RateLimitError) throw new ReadError('Claude is busy or your credit limit is reached. Try again shortly.');
    if (e instanceof Anthropic.APIConnectionError) throw new ReadError('No connection to Claude. Try again when you are online.');
    if (e instanceof Anthropic.APIError) throw new ReadError('Claude could not read the photo (' + (e.status || 'error') + ').');
    throw e;
  }
  if (res.stop_reason === 'refusal') throw new ReadError('Claude declined to read this photo.');
  if (res.stop_reason === 'max_tokens') throw new ReadError('The answer was cut off. Try again.');
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join('');
  let out;
  try { out = JSON.parse(text); } catch (e) { throw new ReadError('Claude sent an answer the app could not read. Try again.'); }
  return { items: Array.isArray(out.items) ? out.items : [], note: out.note || '' };
}
