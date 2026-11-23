const { listarFuncionarios } = require('../lib/servico_funcionarios');

const t0 = Date.now();
const res1 = listarFuncionarios({ busca: 'funcionarios' });
const t1 = Date.now() - t0;
console.log(`Busca por 'funcionarios': ${res1.paginacao.total_filtrado} registros em ${t1}ms`);
console.log(`Primeiro: ${res1.registros[0].nome_exibicao} | Perfil: ${res1.registros[0].perfil_tipo} | Cargo: ${res1.registros[0].cargos_resumo}`);

const t2 = Date.now();
const res2 = listarFuncionarios({ busca: 'servidores' });
const t3 = Date.now() - t2;
console.log(`Busca por 'servidores': ${res2.paginacao.total_filtrado} registros em ${t3}ms`);

const t4 = Date.now();
const res3 = listarFuncionarios({ busca: 'professor' });
const t5 = Date.now() - t4;
console.log(`Busca por 'professor': ${res3.paginacao.total_filtrado} registros em ${t5}ms`);

const t6 = Date.now();
const res4 = listarFuncionarios({ busca: 'maria' });
const t7 = Date.now() - t6;
console.log(`Busca por 'maria': ${res4.paginacao.total_filtrado} registros em ${t7}ms`);
