// scripts/fetch_and_parse.js
// Node 18+ (global fetch)
import fs from 'fs/promises';
import path from 'path';

const DATA_URL = 'https://documents.apps.lara.state.mi.us/mlcc/webprbk.txt';
const OUT_DIR = 'data';
const OUT_FILE = path.join(OUT_DIR, 'products.json');

const FIELD_SPECS = [
  [0,5,'liquorCode'],
  [5,37,'brandName'],
  [37,40,'adaNumber'],
  [40,65,'adaName'],
  [65,90,'vendorName'],
  [90,110,'liquorType'],
  [110,115,'proof'],
  [115,122,'bottleSize'],
  [122,125,'packSize'],
  [125,136,'onPremPrice'],
  [136,147,'offPremPrice'],
  [147,158,'shelfPrice'],
  [158,172,'upc1'],
  [172,186,'upc2'],
  [186,194,'effectiveDate']
];

function parseFixedWidth(text){
  const lines = text.split(/\r?\n/);
  const out = [];
  for(const line of lines){
    if(!line || line.trim().length===0) continue;
    const obj = {};
    for(const [s,e,name] of FIELD_SPECS){
      obj[name] = (line.slice(s,e)||'').trim();
    }
    const toNum = s => {
      try{
        if(!s) return null;
        const n = (s+'').replace(/[^0-9.\\-]/g,'').trim();
        return n.length ? parseFloat(n) : null;
      }catch{ return null; }
    };
    obj.onPremPriceN = toNum(obj.onPremPrice);
    obj.offPremPriceN = toNum(obj.offPremPrice);
    obj.shelfPriceN = toNum(obj.shelfPrice);
    out.push(obj);
  }
  return out;
}

async function main(){
  console.log('Fetching', DATA_URL);
  const res = await fetch(DATA_URL);
  if(!res.ok) throw new Error('Fetch failed: ' + res.status);
  const txt = await res.text();
  const parsed = parseFixedWidth(txt);
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(parsed, null, 2), 'utf8');
  console.log('Saved', parsed.length, 'items to', OUT_FILE);
}

main().catch(err=>{
  console.error(err);
  process.exit(1);
});
