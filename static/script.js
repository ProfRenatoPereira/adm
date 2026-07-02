let funcionarios = [];

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

async function adicionarFuncionario() {
    const nome = document.getElementById('nome').value.trim();
    const cargo = document.getElementById('cargo').value;
    const salario = parseFloat(document.getElementById('salario').value) || 0;
    const beneficios = parseFloat(document.getElementById('beneficios').value) || 0;
    const vt = document.getElementById('vt_desconto').value;
    const limiteMax = parseInt(document.getElementById('limite_func').value) || 0;

    if (!nome) { alert('Digite o nome do funcionário.'); return; }
    if (funcionarios.length >= limiteMax) { alert('Limite de funcionários atingido!'); return; }

    // Envia dados para o processamento em Python
    const resposta = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salario, beneficios, vt })
    });
    
    const calculos = await reply.json();

    funcionarios.push({
        id: Date.now(), nome, cargo, salario, beneficios, ...calculos
    });

    document.getElementById('nome').value = '';
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
    const limiteMax = parseInt(document.getElementById('limite_func').value) || 0;

    let totalBruto = 0; let totalDescontos = 0; let totalLiquido = 0;
    funcionarios.forEach(f => {
        totalBruto += f.salario;
        totalDescontos += f.totalDescontos;
        totalLiquido += f.liquido;
    });

    let custoTotal = funcionarios.reduce((acc, f) => acc + f.salario + f.beneficios, 0);
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
        const dadosContracheque = encodeURIComponent(JSON.stringify(f));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.nome}</strong></td><td>${f.cargo}</td>
            <td>${formatarMoeda(f.salario)}</td><td>${formatarMoeda(f.beneficios)}</td>
            <td style="color:#dc2626">-${formatarMoeda(f.inss)}</td>
            <td style="color:#dc2626">-${formatarMoeda(f.irrf)}</td>
            <td style="color:#dc2626">-${formatarMoeda(f.vt)}</td>
            <td style="color:#16a34a"><strong>${formatarMoeda(f.liquido)}</strong></td>
            <td class="actions-cell">
                <a onclick="abrirContracheque('${dadosContracheque}')" class="btn-link">📄 Imprimir Holerite</a>
                <button class="btn-delete" onclick="deletarFuncionario(${f.id})">Demitir</button>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function imprimirBalanco() {
    const receita = parseFloat(document.getElementById('receita_empresa').value) || 0;
    let totalSalarios = 0; let totalBeneficios = 0;

    funcionarios.forEach(f => { totalSalarios += f.salario; totalBeneficios += f.beneficios; });
    let custoTotal = totalSalarios + totalBeneficios;
    let saldo = receita - custoTotal;

    const area = document.getElementById('print-area');
    area.innerHTML = `
        <div style="padding: 40px; font-family: sans-serif;">
            <h1 style="text-align:center; color:#1e3a8a;">BALANÇO PATRIMONIAL DA FOLHA</h1>
            <hr><br>
            <p><strong>Receita Bruta:</strong> ${formatarMoeda(receita)}</p>
            <p><strong>Custo Operacional de Salários:</strong> ${formatarMoeda(totalSalarios)}</p>
            <p><strong>Custo de Benefícios:</strong> ${formatarMoeda(totalBeneficios)}</p>
            <h3 style="color:${saldo >= 0 ? 'blue' : 'red'}">Saldo Líquido / Margem: ${formatarMoeda(saldo)}</h3>
        </div>
    `;
    window.print();
}

function abrirContracheque(dadosString) {
    const f = JSON.parse(decodeURIComponent(dadosString));
    const janela = window.open('', '_blank', 'width=700,height=600');
    janela.document.write(`
        <html><body style="font-family:monospace; padding:30px;">
            <div style="border:2px solid #000; padding:20px; max-width:600px; margin:0 auto;">
                <h2 style="text-align:center;">RECIBO DE PAGAMENTO</h2>
                <p><strong>Funcionário:</strong> ${f.nome} | <strong>Cargo:</strong> ${f.cargo}</p><hr>
                <p>(+) Salário Base: ${formatarMoeda(f.salario)}</p>
                <p>(+) Benefícios: ${formatarMoeda(f.beneficios)}</p>
                <p>(-) INSS: ${formatarMoeda(f.inss)}</p>
                <p>(-) IRRF: ${formatarMoeda(f.irrf)}</p>
                <p><strong>LÍQUIDO A RECEBER: ${formatarMoeda(f.liquido)}</strong></p>
                <br><br><p style="text-align:center;">___________________________<br>Assinatura</p>
            </div>
            <script>window.print();<\/script>
        </body></html>
    `);
}
