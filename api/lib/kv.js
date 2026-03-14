const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(method, ...args) {
  const res = await fetch(`${KV_URL}/${method}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

export const get = (key) => kv('get', key);
export const set = (key, value) => kv('set', key, JSON.stringify(value));
export const del = (key) => kv('del', key);
export const smembers = (key) => kv('smembers', key);
export const sadd = (key, member) => kv('sadd', key, member);
export const srem = (key, member) => kv('srem', key, member);

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
