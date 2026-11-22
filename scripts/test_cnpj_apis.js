async function testAPIs(cnpj) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json'
  };

  console.log(`Testing CNPJ: ${cnpj}`);

  // Test 1: BrasilAPI with User-Agent
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { headers });
    console.log(`BrasilAPI status: ${res.status}`);
    const text = await res.text();
    console.log(`BrasilAPI response: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log('BrasilAPI error:', e.message);
  }

  // Test 2: Minha Receita
  try {
    const res = await fetch(`https://minhareceita.org/${cnpj}`, { headers });
    console.log(`MinhaReceita status: ${res.status}`);
    const text = await res.text();
    console.log(`MinhaReceita response: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log('MinhaReceita error:', e.message);
  }

  // Test 3: Publica CNPJ WS
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, { headers });
    console.log(`CNPJ.ws status: ${res.status}`);
    const text = await res.text();
    console.log(`CNPJ.ws response: ${text.slice(0, 200)}`);
  } catch (e) {
    console.log('CNPJ.ws error:', e.message);
  }
}

testAPIs('14693481000172');
