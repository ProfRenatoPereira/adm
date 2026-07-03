let funcionarios = [];

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function adicionarFuncionario() {
    const nome = document.getElementById('nome').value.trim();
    const cargo = document.getElementById('cargo').value;
    const salario = parseFloat(document.getElementById('salario').value) || 0;
    const horasComp = parseFloat(document.getElementById('horas_comp').value) || 220;
    const insalubridade = parseFloat(document.getElementById('insalubridade').value) || 0;
    const beneficios = parseFloat(document.getElementById('beneficios').value) || 0;
    const qtdFilhos = parseInt(document.getElementById('qtd_filhos').value) || 0;
    const observacoes = document.getElementById('observacoes').value.trim();
    const dataAdmissao = document.getElementById('data_admissao').value;
    
    const heSemana = parseFloat(document.getElementById('he_semana').value) || 0;
    const heSabado = parseFloat(document.getElementById('he_sabado').value) || 0;
    const heDomingo = parseFloat(document.getElementById('he_domingo').value) || 0;
    
    const planoSaude = parseFloat(document.getElementById('plano_saude').value) || 0;
    const planoOdonto = parseFloat(document.getElementById('plano_odonto').value) || 0;
    const valeFarmacia = parseFloat(document.getElementById('vale_farmacia').value) || 0;
    const sindicato = parseFloat(document.getElementById('sindicato').value) || 0;
    
    const adiantamento = document.getElementById('adiantamento').value;
    const vt = document.getElementById('vt_desconto').value;
    const limiteMax = parseInt(document.getElementById('limite_func').value) || 10;
    const mesRef = document.getElementById('mes_referencia').value;

    if (!nome) { alert('Insira o nome do profissional.'); return; }

    const resposta = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            salario, horasComp, insalubridade, beneficios, heSemana, heSabado, heDomingo,
            planoSaude, planoOdonto, valeFarmacia, sindicato, adiantamento, vt, qtdFilhos
        })
    });
    
    const calculos = await resposta.json();

    funcionarios.push({
        id: Date.now(), nome, cargo, salario, horasComp, insalubridade, beneficios, qtdFilhos, observacoes, dataAdmissao,
        heSemana, heSabado, heDomingo, planoSaude, planoOdonto, valeFarmacia, sindicato, mesRef, ...calculos
    });

    document.getElementById('nome').value = '';
    document.getElementById('observacoes').value = '';
    renderizarTabela();
    atualizarDashboard();
}
function deletarFuncionario(id) {
    funcionarios = funcionarios.filter(f => f.id !== id);
    renderizarTabela();
    atualizarDashboard();
}

function atualizarDashboard() {
    const receita = parseFloat(document.getElementById('receita_empresa').value) || 0;
    const limiteMax = parseInt(document.getElementById('limite_func').value) || 10;

    let totalBruto = 0; let totalDescontos = 0; let totalLiquido = 0;
    funcionarios.forEach(f => {
        totalBruto += f.salario + f.totalHeGanho + f.insalubridade + f.reflexo13Ferias;
        totalDescontos += f.totalDescontos;
        totalLiquido += f.liquido;
    });

    let custoTotal = funcionarios.reduce((acc, f) => acc + f.salario + f.beneficios + f.totalHeGanho + f.insalubridade + f.reflexo13Ferias, 0);
    let saldoFinal = receita - custoTotal;

    document.getElementById('dash_total_func').innerText = `${funcionarios.length} / ${limiteMax}`;
    document.getElementById('dash_custo_bruto').innerText = formatarMoeda(totalBruto);
    document.getElementById('dash_total_descontos').innerText = formatarMoeda(totalDescontos);
    document.getElementById('dash_folha_liquida').innerText = formatarMoeda(totalLiquido);
    document.getElementById('dash_saldo_empresa').innerText = formatarMoeda(saldoFinal);

    document.getElementById('card_balanco').className = saldoFinal < 0 ? 'metric negative' : 'metric';
}

function renderizarTabela() {
    const corpo = document.getElementById('tabela_corpo');
    corpo.innerHTML = '';

    funcionarios.forEach(f => {
        const dados = encodeURIComponent(JSON.stringify(f));
        const dataFormatada = f.dataAdmissao ? f.dataAdmissao.split('-').reverse().join('/') : '---';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.nome}</strong><br><small style="color:#64748b">Admissão: ${dataFormatada}</small></td>
            <td>${f.cargo}</td>
            <td>${formatarMoeda(f.salario)}</td>
            <td style="color:#16a34a"><strong>${formatarMoeda(f.liquido)}</strong></td>
            <td class="actions-cell">
                <a onclick="abrirContracheque('${dados}')" class="btn-link" title="Mensal">📄 Mensal</a>
                <a onclick="abrirFerias('${dados}')" class="btn-link" style="color:#16a34a" title="Férias">🌴 Férias</a>
                <button class="btn-delete" style="background:#0284c7; color:white; border:none; padding:4px 8px; margin-right:5px;" onclick="emitirRescisao('${dados}')">⚠️ Rescisão</button>
                <button class="btn-delete" onclick="deletarFuncionario(${f.id})">Demitir</button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}
function imprimirBalanco() {
    const receita = parseFloat(document.getElementById('receita_empresa').value) || 0;
    let totalBruto = 0; let totalBeneficios = 0;
    funcionarios.forEach(f => { 
        totalBruto += (f.salario + f.totalHeGanho + f.insalubridade + f.reflexo13Ferias); 
        totalBeneficios += f.beneficios; 
    });
    let custoTotal = totalBruto + totalBeneficios;
    let saldo = receita - custoTotal;

    const area = document.getElementById('print-area');
    area.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif;">
            <h1 style="text-align:center; color:#1e3a8a;">TERCEIRO ADM ASSOCIADOS - BALANÇO</h1>
            <p style="text-align:center; color:#555;">Endereço: Av. Paulista, 1000 - Bela Vista, São Paulo - SP</p><hr><br>
            <p><strong>Receita Operacional Bruta:</strong> ${formatarMoeda(receita)}</p>
            <p><strong>Custo Total de Salários e Reflexos:</strong> ${formatarMoeda(totalBruto)}</p>
            <p><strong>Custo Assistencial/Benefícios:</strong> ${formatarMoeda(totalBeneficios)}</p>
            <h3 style="color:${saldo >= 0 ? 'blue' : 'red'}">Saldo de Caixa: ${formatarMoeda(saldo)}</h3>
        </div>
    `;
    window.print();
}

function abrirContracheque(dadosString) {
    const f = JSON.parse(decodeURIComponent(dadosString));
    const proventosTotais = f.salario + f.totalHeGanho + f.reflexo13Ferias + f.insalubridade + f.beneficios + f.salarioFamilia;
    const descontosTotais = f.totalDescontos;
    
    const janela = window.open('', '_blank', 'width=750,height=850');
    janela.document.write(`
        <html><body style="font-family:monospace; padding:25px; color:#000;">
            <div style="border:2px solid #000; padding:20px; max-width:650px; margin:0 auto;">
                <h2 style="text-align:center; margin-bottom:5px;">RECIBO DE PAGAMENTO MENSAL</h2>
                <p style="text-align:center; font-weight:bold; margin-bottom:5px;">TERCEIRO ADM ASSOCIADOS</p>
                <p style="text-align:center; font-size:0.85rem; margin-bottom:15px;">Endereço: Av. Paulista, 1000 - Bela Vista, São Paulo - SP</p>
                <p><strong>Colaborador:</strong> ${f.nome} | <strong>Cargo:</strong> ${f.cargo}</p>
                <p><strong>Mês de Referência:</strong> ${f.mesRef} | <strong>Carga Horária:</strong> ${f.horasComp}h</p>
                <hr style="border:1px dashed #000; margin:15px 0;">
                
                <h4 style="margin-bottom:8px; color:#1e3a8a;">PROVENTOS (CRÉDITOS)</h4>
                <p>(+) Salário Base: ${formatarMoeda(f.salario)}</p>
                ${f.heSemana > 0 ? `<p>(+) Horas Extras Semanal (25%): ${f.heSemana}h = ${formatarMoeda(f.vHeSemana)}</p>` : ''}
                ${f.heSabado > 0 ? `<p>(+) Horas Extras Sábado (50%): ${f.heSabado}h = ${formatarMoeda(f.vHeSabado)}</p>` : ''}
                ${f.heDomingo > 0 ? `<p>(+) Horas Extras Dom/Fer (100%): ${f.heDomingo}h = ${formatarMoeda(f.vHeDomingo)}</p>` : ''}
                ${f.reflexo13Ferias > 0 ? `<p>(+) Incidência de Multa/Reflexo HE (13º/Férias): ${formatarMoeda(f.reflexo13Ferias)}</p>` : ''}
                ${f.insalubridade > 0 ? `<p>(+) Adicional de Insalubridade: ${formatarMoeda(f.insalubridade)}</p>` : ''}
                ${f.salarioFamilia > 0 ? `<p>(+) Salário-Família Prescrito (${f.qtdFilhos} cota(s)): ${formatarMoeda(f.salarioFamilia)}</p>` : ''}
                <p>(+) Benefícios Corporativos: ${formatarMoeda(f.beneficios)}</p>
                
                <hr style="border:1px dashed #ccc; margin:10px 0;">
                <p style="font-weight:bold; text-align:right;">TOTAL DOS PROVENTOS: ${formatarMoeda(proventosTotais)}</p>
                
                <h4 style="margin:20px 0 8px 0; color:#dc2626;">DESCONTOS (RETENÇÕES)</h4>
                <p>(-) INSS Progressivo: ${formatarMoeda(f.inss)}</p>
                <p>(-) Imposto de Renda (IRRF): ${formatarMoeda(f.irrf)}</p>
                ${f.vt > 0 ? `<p>(-) Vale Transporte (6%): ${formatarMoeda(f.vt)}</p>` : ''}
                ${f.adiantamentoValor > 0 ? `<p>(-) Adiantamento Salarial Compulsório (40%): ${formatarMoeda(f.adiantamentoValor)}</p>` : ''}
                ${f.planoSaude > 0 ? `<p>(-) Plano de Saúde: ${formatarMoeda(f.planoSaude)}</p>` : ''}
                ${f.planoOdonto > 0 ? `<p>(-) Plano Odontológico: ${formatarMoeda(f.planoOdonto)}</p>` : ''}
                ${f.valeFarmacia > 0 ? `<p>(-) Convênio Farmácia: ${formatarMoeda(f.valeFarmacia)}</p>` : ''}
                ${f.sindicato > 0 ? `<p>(-) Contribuição Sindical: ${formatarMoeda(f.sindicato)}</p>` : ''}
                
                <hr style="border:1px dashed #ccc; margin:10px 0;">
                <p style="font-weight:bold; text-align:right;">TOTAL DOS DESCONTOS: ${formatarMoeda(descontosTotais)}</p>
                
                <hr style="border:1px dashed #000; margin:20px 0;"></hr>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:10px; border:1px solid #000;">
                    <h3 style="font-size:1.2rem; margin:0;">VALOR LÍQUIDO A RECEBER:</h3>
                    <h3 style="font-size:1.4rem; margin:0; color:#16a34a;">${formatarMoeda(f.liquido)}</h3>
                </div>
                
                ${f.observacoes ? `
                <div style="margin-top:20px; border:1px solid #cbd5e1; padding:10px; background:#fff;">
                    <strong>Observações / Notas Internas:</strong>
                    <p style="margin-top:5px; font-style:italic; color:#334155;">${f.observacoes}</p>
                </div>` : ''}
                
                <br><br><p style="text-align:center;">___________________________<br>Assinatura do Colaborador</p>
            </div>
            <script>window.print();<\/script>
        </body></html>
    `);
}
function abrirFerias(dadosString) {
    const f = JSON.parse(decodeURIComponent(dadosString));
    const baseFerias = f.salario + f.insalubridade;
    const terco = baseFerias / 3;
    const proventos = baseFerias + terco;
    const inssFerias = proventos * 0.09; 
    const liquidoFerias = proventos - inssFerias;

    const janela = window.open('', '_blank', 'width=750,height=700');
    janela.document.write(`
        <html><body style="font-family:monospace; padding:30px;">
            <div style="border:2px solid #000; padding:20px; max-width:600px; margin:0 auto;">
                <h2 style="text-align:center;">RECIBO DE AVISO E GOZO DE FÉRIAS</h2>
                <p style="text-align:center; font-weight:bold;">TERCEIRO ADM ASSOCIADOS</p><hr>
                <p><strong>Colaborador:</strong> ${f.nome} | <strong>Cargo:</strong> ${f.cargo}</p>
                <p><strong>Admissão:</strong> ${f.dataAdmissao.split('-').reverse().join('/')}</p><br>
                <h4>PROVENTOS</h4>
                <p>(+) Valor de Férias (30 Dias): ${formatarMoeda(baseFerias)}</p>
                <p>(+) 1/3 Constitucional de Férias: ${formatarMoeda(terco)}</p>
                <h4>DESCONTOS</h4>
                <p style="color:red">(-) INSS Retido sobre Férias: ${formatarMoeda(inssFerias)}</p><hr>
                <p>TOTAL PROVENTOS: ${formatarMoeda(proventos)}</p>
                <p>TOTAL DESCONTOS: ${formatarMoeda(inssFerias)}</p>
                <h3>VALOR LÍQUIDO DAS FÉRIAS: ${formatarMoeda(liquidoFerias)}</h3>
                <br><br><p style="text-align:center;">___________________________<br>Assinatura do Colaborador</p>
            </div>
            <script>window.print();<\/script>
        </body></html>
    `);
}

async function emitirRescisao(dadosString) {
    const f = JSON.parse(decodeURIComponent(dadosString));
    
    const resposta = await fetch('/api/rescisao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salario: f.salario, admissao: f.dataAdmissao })
    });
    const r = await resposta.json();

    const janela = window.open('', '_blank', 'width=750,height=850');
    janela.document.write(`
        <html><body style="font-family:monospace; padding:30px; color:#000;">
            <div style="border:2px solid #000; padding:20px; max-width:650px; margin:0 auto;">
                <h2 style="text-align:center; color:#dc2626; margin-bottom:5px;">TERMO DE RESCISÃO DO CONTRATO DE TRABALHO</h2>
                <p style="text-align:center; font-weight:bold; margin-bottom:5px;">TERCEIRO ADM ASSOCIADOS</p>
                <p style="text-align:center; font-size:0.85rem; margin-bottom:15px;">Endereço: Av. Paulista, 1000 - Bela Vista, São Paulo - SP</p>
                <hr style="border:1px dashed #000; margin:15px 0;">
                
                <p><strong>Trabalhador:</strong> ${f.nome} | <strong>Cargo:</strong> ${f.cargo}</p>
                <p><strong>Data Admissão:</strong> ${f.dataAdmissao.split('-').reverse().join('/')}</p>
                <p><strong>Data Afastamento:</strong> ${new Date().toLocaleDateString('pt-BR')}</p><br>
                
                <h4 style="margin-bottom:8px; color:#1e3a8a;">VERBAS RESCISÓRIAS (PROVENTOS)</h4>
                <p>(+) Saldo de Salário Proporcional (15 dias): ${formatarMoeda(r.saldoSalario)}</p>
                <p>(+) Aviso Prévio Indenizado Proporcional (${r.diasAviso} Dias): ${formatarMoeda(r.valorAvisoPrevio)}</p>
                <p>(+) 13º Salário Proporcional: ${formatarMoeda(r.decimoTerceiroProp)}</p>
                <p>(+) Férias Proporcionais Acumuladas: ${formatarMoeda(r.feriasProporcionais)}</p>
                <p>(+) 1/3 Constitucional sobre Férias: ${formatarMoeda(r.tercoConstitucional)}</p>
                
                <hr style="border:1px dashed #ccc; margin:10px 0;">
                <p style="font-weight:bold; text-align:right;">TOTAL DOS PROVENTOS: ${formatarMoeda(r.totalProventos)}</p>
                
                <h4 style="margin:20px 0 8px 0; color:#dc2626;">DEDUÇÕES RESCISÓRIAS</h4>
                <p style="color:red">(-) Dedução Compulsória INSS/IRRF: ${formatarMoeda(r.inss)}</p>
                
                <hr style="border:1px dashed #ccc; margin:10px 0;">
                <p style="font-weight:bold; text-align:right;">TOTAL DOS DESCONTOS: ${formatarMoeda(r.inss)}</p>
                
                <hr style="border:1px dashed #000; margin:20px 0 10px 0;">
                <div style="display:flex; justify-content:space-between; align-items:center; background:#fffbf0; padding:10px; border:1px solid #dc2626;">
                    <h3 style="font-size:1.15rem; margin:0; color:#b45309;">LÍQUIDO DA QUITAÇÃO RESCISÓRIA:</h3>
                    <h3 style="font-size:1.35rem; margin:0; color:#b45309;">${formatarMoeda(r.liquido)}</h3>
                </div>
                
                <br><br><p style="text-align:center;">___________________________<br>Assinatura do Ex-Colaborador</p>
            </div>
            <script>window.print();<\/script>
        </body></html>
    `);
}
