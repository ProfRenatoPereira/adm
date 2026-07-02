from flask import Flask, render_template, request, jsonify
from datetime import datetime

app = Flask(__name__)

def calcular_inss(salario):
    if salario <= 1412: return salario * 0.075
    if salario <= 2666.68: return (salario * 0.09) - 21.18
    if salario <= 4000.03: return (salario * 0.12) - 101.18
    if salario <= 7786.02: return (salario * 0.14) - 181.18
    return 908.86

def calcular_irrf(salario, desconto_inss):
    base = salario - desconto_inss
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
    salario = float(dados.get('salario', 0))
    beneficios = float(dados.get('beneficios', 0))
    descontar_vt = dados.get('vt', 'nao') == 'sim'
    
    inss = calcular_inss(salario)
    irrf = calcular_irrf(salario, inss)
    vt = salario * 0.06 if descontar_vt else 0
    
    total_descontos = inss + irrf + vt
    liquido = (salario + beneficios) - total_descontos
    
    return jsonify({
        'inss': inss,
        'irrf': irrf,
        'vt': vt,
        'totalDescontos': total_descontos,
        'liquido': liquido
    })

if __name__ == '__main__':
    app.run(debug=True)
