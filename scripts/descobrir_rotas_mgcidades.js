const fs = require('node:fs');

async function main() {
  const url = 'https://mgcidades.redemunicipal.com.br/27/310450201';
  console.log('Fetching', url);
  const res = await fetch(url);
  const html = await res.text();
  console.log('HTML size:', html.length);
  
  // Find all scripts
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  const scriptUrls = [];
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptUrls.push(match[1]);
  }
  console.log('Found scripts:', scriptUrls);

  // If there are JS files, fetch main JS to extract all API endpoints
  for (const s of scriptUrls) {
    if (s.includes('main') || s.includes('app') || s.includes('bundle') || s.includes('chunk')) {
      const fullUrl = s.startsWith('http') ? s : new URL(s, url).href;
      console.log('Fetching JS bundle:', fullUrl);
      const jsRes = await fetch(fullUrl);
      const jsText = await jsRes.text();
      console.log('Bundle size:', jsText.length);
      
      // Look for endpoints or pub/27/
      const apiMatches = new Set();
      const pubRegex = /pub\/27\/([a-zA-Z0-9_\-]+)/g;
      let m;
      while ((m = pubRegex.exec(jsText)) !== null) {
        apiMatches.add(m[1]);
      }
      
      const restRegex = /["']\/([a-zA-Z0-9_\-]+)["']/g;
      const candidates = new Set();
      while ((m = restRegex.exec(jsText)) !== null) {
        if (m[1].length > 3 && m[1].length < 25) {
          candidates.add(m[1]);
        }
      }
      console.log('Direct pub/27/ endpoints found:', Array.from(apiMatches));
    }
  }

  // Also check any redirect or location or iframe in the html
  console.log('\nInspecting HTML content for links/redirects/iframes:');
  const iframeRegex = /<iframe[^>]+src=["']([^"']+)["']/gi;
  while ((match = iframeRegex.exec(html)) !== null) {
    console.log('IFRAME SRC:', match[1]);
  }

  const hrefRegex = /href=["']([^"']+)["']/gi;
  const hrefs = [];
  while ((match = hrefRegex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  console.log('HREFS:', hrefs.filter(h => !h.startsWith('#') && !h.includes('.css')));
}

main().catch(console.error);
