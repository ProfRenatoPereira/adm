from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

def calcular_inss(salario_contribuicao):
    if salario_contribuicao <= 1412: return salario_contribuicao * 0.075
    if salario_contribuicao <= 2666.68: return (salario_contribuicao * 0.09) - 21.18
    if salario_contribuicao <= 4000.03: return (salario_contribuicao * 0.12) - 101.18
    if salario_contribuicao <= 7786.02: return (salario_contribuicao * 0.14) - 181.18
    return 908.86

def calcular_irrf(salario_contribuicao, desconto_inss):
    base = salario_contribuicao - desconto_inss
    if base <= 2259.20: return 0
    if base <= 2826.65: return (base * 0.075) - 169.44
    if base <= 3751.05: return (base * 0.15) - 381.44
    if base <= 4664.68: return (base * 0.225) - 662.77
    return (base * 0.275) - 896.00

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/calcular', methods=['POST'])
def calcular_folha():
    dados = request.json
    salario_base = float(dados.get('salario', 0))
    horas_comp = float(dados.get('horasComp', 220)) or 220
    beneficios = float(dados.get('beneficios', 0))
    insalubridade = float(dados.get('insalubridade', 0))
    qtd_filhos = int(dados.get('qtdFilhos', 0))
    
    he_semana = float(dados.get('heSemana', 0))
    he_sabado = float(dados.get('heSabado', 0))
    he_domingo = float(dados.get('heDomingo', 0))
    
    sindicato = float(dados.get('sindicato', 0))
    plano_saude = float(dados.get('planoSaude', 0))
    plano_odonto = float(dados.get('planoOdonto', 0))
    vale_farmacia = float(dados.get('valeFarmacia', 0))
    aplicar_adiantamento = dados.get('adiantamento', 'nao') == 'sim'
    descontar_vt = dados.get('vt', 'nao') == 'sim'
    
    total_salario_familia = 0
    if salario_base <= 1819.26 and qtd_filhos > 0:
        total_salario_familia = qtd_filhos * 62.04
        
    valor_hora = salario_base / horas_comp
    v_he_semana = he_semana * (valor_hora * 1.25)
    v_he_sabado = he_sabado * (valor_hora * 1.50)
    v_he_domingo = he_domingo * (valor_hora * 2.00)
    total_he_ganho = v_he_semana + v_he_sabado + v_he_domingo
    reflexo_13_ferias = total_he_ganho * (2.0 / 12.0)
    
    salario_contribuicao = salario_base + total_he_ganho + insalubridade + reflexo_13_ferias
    inss = calcular_inss(salario_contribuicao)
    irrf = calcular_irrf(salario_contribuicao, inss)
    vt = salario_base * 0.06 if descontar_vt else 0
    
    proventos_previa = salario_base + beneficios + total_he_ganho + insalubridade + reflexo_13_ferias + total_salario_familia
    descontos_previa = inss + irrf + vt + sindicato + plano_saude + plano_odonto + vale_farmacia
    
    valor_adiantamento = (proventos_previa - descontos_previa) * 0.40 if aplicar_adiantamento else 0
    total_descontos = descontos_previa + valor_adiantamento
    
    return jsonify({
        'vHeSemana': v_he_semana, 'vHeSabado': v_he_sabado, 'vHeDomingo': v_he_domingo,
        'totalHeGanho': total_he_ganho, 'reflexo13Ferias': reflexo_13_ferias,
        'salarioFamilia': total_salario_familia, 'inss': inss, 'irrf': irrf, 'vt': vt,
        'adiantamentoValor': valor_adiantamento, 'totalDescontos': total_descontos,
        'liquido': proventos_previa - total_descontos
    })

@app.route('/api/rescisao', methods=['POST'])
def calcular_rescisao():
    dados = request.json
    salario_base = float(dados.get('salario', 0))
    dt_admissao_str = dados.get('admissao', '')
    
    # Cálculo dinâmico do tempo de casa para calcular o Aviso Prévio Proporcional
    dias_aviso = 30
    anos_trabalhados = 0
    if dt_admissao_str:
        try:
            dt_admissao = datetime.strptime(dt_admissao_str, "%Y-%m-%d")
            hoje = datetime.now()
            anos_trabalhados = hoje.year - dt_admissao.year - ((hoje.month, hoje.day) < (dt_admissao.month, dt_admissao.day))
            if anos_trabalhados > 0:
                # Lei 12.506: +3 dias por ano completo trabalhado, limitado a mais 60 dias (total 90)
                dias_aviso += min(anos_trabalhados * 3, 60)
        except Exception:
            pass

    # Valor financeiro do Aviso Prévio Proporcional Indenizado
    valor_aviso_previo = (salario_base / 30) * dias_aviso

    saldo_salario = salario_base * (15 / 30)  # Exemplo padrão: 15 dias trabalhados
    decimo_terceiro_prop = (salario_base / 12) * 6  # Exemplo padrão: 6 meses proporcionais
    ferias_proporcionais = (salario_base / 12) * 6
    terco_constitucional = ferias_proporcionais / 3
    
    total_proventos = saldo_salario + decimo_terceiro_prop + ferias_proporcionais + terco_constitucional + valor_aviso_previo
    
    inss_rescisao = calcular_inss(saldo_salario + decimo_terceiro_prop)
    irrf_rescisao = calcular_irrf(saldo_salario + decimo_terceiro_prop, inss_rescisao)
    total_descontos = inss_rescisao + irrf_rescisao
    
    return jsonify({
        'saldoSalario': saldo_salario,
        'decimoTerceiroProp': decimo_terceiro_prop,
        'feriasProporcionais': ferias_proporcionais,
        'tercoConstitucional': terco_constitucional,
        'diasAviso': dias_aviso,
        'valorAvisoPrevio': valor_aviso_previo,
        'totalProventos': total_proventos,
        'inss': total_descontos,
        'liquido': total_proventos - total_descontos
    })

if __name__ == '__main__':
    app.run(debug=True)
