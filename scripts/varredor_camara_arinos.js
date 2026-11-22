const https = require('node:https');
const zlib = require('node:zlib');

function getPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded.toString('utf-8'));
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded.toString('utf-8'));
          });
        } else {
          resolve(buffer.toString('utf-8'));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const html = await getPage('https://www.arinos.mg.leg.br');
  const title = html.match(/<title>([^<]+)<\/title>/i);
  console.log('TITULO:', title ? title[1].trim() : 'Nao achou');

  const links = [];
  const regex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    links.push(match[1]);
  }

  const cleanLinks = [...new Set(links)];
  console.log('Total Links:', cleanLinks.length);
  
  const siteSections = cleanLinks.filter(l => 
    !l.endsWith('.css') && !l.endsWith('.js') && !l.endsWith('.png') && !l.endsWith('.ico') && !l.startsWith('#')
  );

  console.log('SECOES ENCONTRADAS:');
  siteSections.forEach(s => console.log(' -', s));
}

main().catch(console.error);
