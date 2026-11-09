#!/usr/bin/env bash
# Convert generated PNGs to WebP for the /proto/art/ gallery and rebuild the page. Local only (git-excluded).
set -e
export PATH=$HOME/.local/node/bin:$PATH
cd "$(dirname "$0")/../.."
mkdir -p src/assets/proto-art
NODE_PATH=$PWD/node_modules node -e '
const sharp=require("sharp"),fs=require("fs"),path=require("path");
const root=process.env.HOME+"/work/scene-art";const out="src/assets/proto-art";const items=[];
(async()=>{for(const round of fs.readdirSync(root).filter(d=>/^round/.test(d)).sort()){
  for(const f of fs.readdirSync(path.join(root,round)).filter(f=>f.endsWith(".png")).sort()){
    const name=round+"-"+f.replace(".png",".webp");const dst=path.join(out,name);
    if(!fs.existsSync(dst)) await sharp(path.join(root,round,f)).webp({quality:86}).toFile(dst);
    const m=await sharp(dst).metadata();items.push({src:"/assets/proto-art/"+name,round,file:f,w:m.width,h:m.height});}}
const cards=items.map(i=>`<figure><img src="${i.src}" width="${i.w}" height="${i.h}" alt="Generated café scene ${i.file}" loading="lazy"><figcaption>${i.round} · ${i.file.replace(".png","")}</figcaption></figure>`).join("\n");
fs.writeFileSync("src/proto/art.njk",`---\npermalink: /proto/art/\neleventyExcludeFromCollections: true\n---\n<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Scene art</title>
<style>body{margin:0;background:#12151d;color:#d9d2c3;font:15px/1.5 system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-left))}h1{font-size:18px;font-weight:600;margin:0 0 16px}figure{margin:0 0 28px}img{width:100%;height:auto;display:block;border-radius:8px}figcaption{margin-top:6px;color:#9a927f;font-size:13px}main{max-width:1100px;margin:0 auto}</style></head>
<body><main><h1>Scene art · ${items.length} images</h1>\n${cards}\n</main></body></html>\n`);
console.log(items.length,"images");})();'
