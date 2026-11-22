async function main() {
  const url = 'http://www.adpmnet.com.br/index2.php?option=com_contpubl&brasao=P310450.GIF&dsorg=Funda%C3%A7%C3%A3o+Municipal+de+Sa%C3%BAde+de+Arinos&titulo=Remunera%C3%A7%C3%A3o+Mensal+dos+Servidores+P%C3%BAblicos&idorg=241&dsufe=Estado de Minas Gerais&cnpj=18650424000167&tpformpdf=52&ano=2025&mes=2&idfun=392&idpcl=1&nome_mat=1&nao_proventos=0&nao_descontos=0&idgca=1';
  const res = await fetch(url);
  const text = await res.text();
  console.log(text);
}

main();
