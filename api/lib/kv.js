const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kv(method, ...args) {
  const res = await fetch(`${KV_URL}/${method}/${args.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const data = await res.json();
  return data.result;
}

async function get(key) {
  const result = await kv('get', key);
  if (result === null || result === undefined) return null;
  if (typeof result === 'string') {
    try { return JSON.parse(result); } catch { return result; }
  }
  return result;
}

async function set(key, value) {
  return kv('set', key, JSON.stringify(value));
}

async function del(key) {
  return kv('del', key);
}

async function smembers(key) {
  const result = await kv('smembers', key);
  return Array.isArray(result) ? result : [];
}

async function sadd(key, member) {
  return kv('sadd', key, member);
}

async function srem(key, member) {
  return kv('srem', key, member);
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { get, set, del, smembers, sadd, srem, cors };
