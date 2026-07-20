<template>
  <div class="dashboard-wrapper animate-fade-in">
    <!-- WELCOME BAR -->
    <div class="welcome-bar glass-panel flex-between">
      <div>
        <h2>Olá, {{ store.currentUser?.name || 'Investidor' }}!</h2>
        <p>Saia do sistema de endividamento e começe a controlar sua vida.</p>
      </div>
      <div class="salary-control-card">
        <label for="salary-input">Salário Atual</label>
        <div class="salary-input-group">
          <span class="currency-prefix">R$</span>
          <input 
            type="text"
            inputmode="decimal"
            id="salary-input" 
            :value="salaryDisplay" 
            @focus="onSalaryFocus"
            @input="onSalaryInput"
            @blur="onSalaryBlur"
            class="salary-input"
          />
        </div>
      </div>
    </div>

    <!-- QUICK STATUS CARDS -->
    <div class="status-grid">
      <div :class="['status-card', 'glass-panel', 'border-blue', store.totalReturn > store.limitConsumption ? 'card-bg-danger' : 'card-bg-success']">
        <span class="card-label">Gasto × Limite ({{ store.consumptionRate }}%)</span>
        <div class="card-limit-stacked">
          <span class="card-limit-value card-limit-spent">R$ {{ formatCurrency(store.totalReturn) }}</span>
          <div class="card-limit-divider">
            <span class="card-limit-line"></span>
            <span class="card-limit-x">x</span>
            <span class="card-limit-line"></span>
          </div>
          <span class="card-limit-value card-limit-max">R$ {{ formatCurrency(store.limitConsumption) }}</span>
        </div>
        <span class="card-sub text-blue">
          {{ store.totalReturn > store.limitConsumption ? '⬆ Excedeu o Limite' : '✅ Retorno Total ao Fundo' }}
        </span>
      </div>

      <div :class="['status-card', 'glass-panel', 'border-purple', store.totalReturn > store.limitConsumption ? 'card-bg-danger' : 'card-bg-success']">
        <span class="card-label">Disponível para Investir Neste Mês</span>
        <div class="card-limit-stacked">
          <span class="card-limit-value card-invest-planned">R$ {{ formatCurrency(store.availableToInvest) }}</span>
          <div class="card-limit-divider">
            <span class="card-limit-line"></span>
            <span class="card-limit-x">x</span>
            <span class="card-limit-line"></span>
          </div>
          <span class="card-limit-value card-invest-available">R$ {{ formatCurrency(store.investedValue) }}</span>
        </div>
        <span class="card-sub text-purple">
          {{ store.penaltyValue > 0
            ? `⬆ Planejado R$ ${formatCurrency(store.investedValue)} − Penalidades`
            : `✅ Planejado (${store.investmentRate}%): R$ ${formatCurrency(store.investedValue)}`
          }}
        </span>
      </div>

      <div :class="['status-card', 'glass-panel', 'border-danger', store.totalReturn > store.limitConsumption ? 'card-bg-danger' : 'card-bg-success']">
        <span class="card-label">Excedente de Limite</span>
        <h3 class="card-value" :class="store.exceededValue > 0 ? 'text-danger' : 'text-success'">
          R$ {{ formatCurrency(store.exceededValue) }}
        </h3>
        <span class="card-sub" :class="store.exceededValue > 0 ? 'text-danger' : 'text-success'">
          {{ store.exceededValue > 0 ? `Penalidade de ${store.penaltyRate}% Aplicada` : 'Dentro do Limite Recomendado' }}
        </span>
      </div>
    </div>

    <!-- SECTION: TABELA DE ACERTO DE CONTAS -->
    <div class="diagram-section glass-panel">
      <div class="flex-between" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display:flex; align-items:center; gap: 0.6rem;">
          <h3>Tabela de Acerto de Contas</h3>
          <button class="help-trigger-btn" @click="showHelpModal = true" title="Como funciona?" id="btn-help-acerto">?</button>
        </div>
        <div style="display:flex; align-items:center; gap: 0.75rem;">
          <p>Fechamento financeiro do ciclo atual com base no seu salário.</p>
          <button class="toggle-table-btn" @click="showAcertoTable = !showAcertoTable" :title="showAcertoTable ? 'Recolher' : 'Expandir'">
            <span v-if="showAcertoTable">▲</span>
            <span v-else>▼</span>
          </button>
        </div>
      </div>

      <!-- MODAL: EXPLICAÇÃO DA SISTEMÁTICA -->
      <Teleport to="body">
        <div v-if="showHelpModal" class="help-modal-overlay" @click.self="showHelpModal = false">
          <div class="help-modal-box">
            <div class="help-modal-header">
              <h4>💡 Como Funciona o Acerto de Contas?</h4>
              <button class="help-modal-close" @click="showHelpModal = false" id="btn-help-close">✕</button>
            </div>
            <p class="help-intro">O objetivo do Acerto de Contas é usar a lógica reversa no crédito e no endividamento transformando você em seu banco.</p>

            <div class="help-grid">
              <div class="help-item">
                <span class="help-badge badge-limit">Limite</span>
                <strong>Limite de Consumo ({{ store.consumptionRate }}%):</strong>
                <p>Taxa usada pelo autor e recomendada com salários maiores que dois salários minimos. Ideal para investir, porém caso não possa usar essa taxa, pode troca-la nas configs.</p>
              </div>

              <div class="help-item">
                <span class="help-badge badge-bonus">Bônus</span>
                <strong>Juros de Investimento({{ store.investmentBonusRate }}%):</strong>
                <p>Considero como juros por investir, considere uma taxa de mentalidade de investidor. Conta como "gasto" no consumo do mês, mas <strong>não sofre cobrança de juros</strong> (pode zerar caso não queira pagar).</p>
              </div>
              
              <div class="help-item">
                <span class="help-badge badge-juros">Juros</span>
                <strong>Juros Correntes ({{ store.expenseTaxRate }}%):</strong>
                <p>Uma taxa aplicada apenas sobre Compras e Passivos para incentivar a redução do consumo desnecessário. O Bônus de Incentivo é isento.</p>
              </div>

              <div class="help-item">
                <span class="help-badge badge-penalty">Penalidade</span>
                <strong>Excedente e Penalidade ({{ store.penaltyRate }}%):</strong>
                <p>Se a soma de <em>Consumo + Juros</em> ultrapassar o Limite de Consumo, cobra-se {{ store.penaltyRate }}% sobre o valor excedido.</p>
              </div>
            </div>

            <div class="help-summary-text">
              🎯 <strong>Retorno Total ao Fundo de Emergência:</strong> Consumo (gastos + bônus) + Juros sobre gastos + Excedente + Penalidade sobre excedente. Este é o valor a ser devolvido ao fundo para manter suas finanças em equilíbrio.
            </div>
          </div>
        </div>
      </Teleport>

      <table class="settlement-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Fórmula</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody v-show="showAcertoTable">
          <!-- ENTRADAS -->
          <tr class="row-section-header">
            <td colspan="3">📊 Entradas</td>
          </tr>
          <tr>
            <td>Salário Base</td>
            <td class="formula">Salário do usuário</td>
            <td class="text-right text-bold">R$ {{ formatCurrency(store.salary) }}</td>
          </tr>
          <tr>
            <td>Limite de Consumo</td>
            <td class="formula">Salário × {{ store.consumptionRate }}%</td>
            <td class="text-right text-blue">R$ {{ formatCurrency(store.limitConsumption) }}</td>
          </tr>
          <tr>
            <td>Valor Investido</td>
            <td class="formula">Salário × {{ store.investmentRate }}%</td>
            <td class="text-right text-purple">R$ {{ formatCurrency(store.investedValue) }}</td>
          </tr>

          <!-- GASTOS -->
          <tr class="row-section-header">
            <td colspan="3">💸 Gastos do Ciclo</td>
          </tr>
          <tr>
            <td>Total de Compras</td>
            <td class="formula">Soma das compras</td>
            <td class="text-right">R$ {{ formatCurrency(store.totalCompras) }}</td>
          </tr>
          <tr>
            <td>Total de Passivos</td>
            <td class="formula">Soma dos passivos</td>
            <td class="text-right text-orange">R$ {{ formatCurrency(store.totalPassivos) }}</td>
          </tr>
          <tr>
            <td>Gastos Correntes</td>
            <td class="formula">Compras + Passivos</td>
            <td class="text-right text-bold">R$ {{ formatCurrency(store.gastosCorrentes) }}</td>
          </tr>
          <tr>
            <td>Juros de Investimento</td>
            <td class="formula">{{ store.investmentBonusRate }}% do valor investido</td>
            <td class="text-right text-purple">R$ {{ formatCurrency(store.investmentBonus) }}</td>
          </tr>
          <tr>
            <td>Consumo Atual</td>
            <td class="formula">Gastos + Juros</td>
            <td class="text-right text-bold">R$ {{ formatCurrency(store.consumoAtual) }}</td>
          </tr>
          <tr class="row-limit-usage" :class="{ 'limit-exceeded': percentLimitUsed > 100 }">
            <td>Uso do Limite Atual</td>
            <td class="formula">Consumo ÷ Limite</td>
            <td class="text-right text-bold">
              {{ percentLimitUsed.toFixed(1) }}%
            </td>
          </tr>

          <!-- PENALIDADES E JUROS -->
          <tr class="row-section-header">
            <td colspan="3">⚠️ Penalidades e Cobranças</td>
          </tr>
          <tr :class="{ 'row-danger': store.exceededValue > 0 }">
            <td>Excedente do Limite</td>
            <td class="formula">(Consumo + Juros) − Limite (se > 0)</td>
            <td class="text-right" :class="store.exceededValue > 0 ? 'text-danger text-bold' : 'text-success'">
              R$ {{ formatCurrency(store.exceededValue) }}
            </td>
          </tr>
          <tr :class="{ 'row-danger': store.penaltyValue > 0 }">
            <td>Penalidade ({{ store.penaltyRate }}%)</td>
            <td class="formula">Excedente × {{ store.penaltyRate }}%</td>
            <td class="text-right" :class="store.penaltyValue > 0 ? 'text-danger text-bold' : ''">
              R$ {{ formatCurrency(store.penaltyValue) }}
            </td>
          </tr>
          <tr>
            <td>Juros Correntes ({{ store.expenseTaxRate }}%)</td>
            <td class="formula">Gastos Correntes × {{ store.expenseTaxRate }}%</td>
            <td class="text-right text-orange">
              R$ {{ formatCurrency(store.currentInterest) }}
            </td>
          </tr>
        </tbody>
        <tbody>
          <!-- TOTAL FINAL -->
          <tr class="row-total">
            <td>✅ Retorno Total ao Fundo</td>
            <td class="formula">Consumo + Juros + Excedente + Penalidade</td>
            <td class="text-right text-success text-xxl">R$ {{ formatCurrency(store.totalReturn) }}</td>
          </tr>
        </tbody>
      </table>


    </div>



    <!-- SECTION: EMERGENCY FUND -->
    <div class="grid-2">
      <!-- FUND CARD -->
      <div class="emergency-fund-card glass-panel">
        <div class="flex-between" style="margin-bottom: 1rem;">
          <h3>Fundo de Emergência</h3>
          <span class="fund-badge">Reserva de Segurança</span>
        </div>

        <div class="fund-balance-display">
          <small class="fund-label">Saldo Atual (Tesouro Reserva)</small>
          <h2>R$ {{ formatCurrency(store.emergencyFund) }}</h2>
        </div>

        <!-- PROGRESS BAR TOWARDS IDEAL GOAL (6 MONTHS OF SALARY) -->
        <div class="fund-progress-area">
          <div class="flex-between fund-progress-labels">
            <span>Meta Ideal (6 Salários):</span>
            <span class="text-bold">R$ {{ formatCurrency(idealFundGoal) }}</span>
          </div>
          <div class="meta-progress-bar">
            <div class="meta-progress-fill" :style="{ width: fundProgressPercentage + '%' }"></div>
          </div>
          <div class="flex-between">
            <small>{{ fundProgressPercentage.toFixed(1) }}% atingido</small>
            <small>Falta R$ {{ formatCurrency(Math.max(0, idealFundGoal - store.emergencyFund)) }}</small>
          </div>
        </div>

        <!-- TRANSACTIONS IN EMERGENCY FUND -->
        <div class="fund-actions-area">
          <label>Aportar ou Resgatar do Fundo</label>
          <div class="fund-input-group">
            <input 
              type="number" 
              v-model.number="fundTxAmount" 
              placeholder="Valor" 
              class="input-field fund-input-box" 
            />
            <div class="fund-buttons">
              <button class="btn-success" @click="handleFundAction(true)">Aportar</button>
              <button class="btn-danger-outline" @click="handleFundAction(false)">Resgatar</button>
            </div>
          </div>

        </div>
      </div>

      <!-- MINI EXPENSE HISTORY -->
      <div class="mini-expenses-card glass-panel">
        <div class="flex-between" style="margin-bottom: 1.5rem;">
          <h3>Registro de Despesas Recentes</h3>
          <router-link to="/transactions" class="btn-link">Ver Todas</router-link>
        </div>

        <div v-if="store.transactions.length === 0" class="empty-state">
          <p>Nenhuma despesa cadastrada.</p>
        </div>
        <div v-else class="mini-list">
          <div 
            v-for="t in store.transactions.slice(0, 4)" 
            :key="t.id" 
            class="mini-item"
          >
            <div class="mini-item-details">
              <span class="badge" :class="'badge-' + t.expenseType">{{ t.expenseType }}</span>
              <span class="mini-desc">{{ t.description }}</span>
            </div>
            <div class="mini-val-group">
              <template v-if="t.type === 'fund_deposit' || t.type === 'fund_withdraw' || t.type === 'fund_interest'">
                <span class="tx-val-counted">R$ {{ formatCurrency(t.amount) }}</span>
              </template>
              <template v-else>
                <div class="tx-val-row">
                  <span class="tx-interest-arrow">↑{{ store.expenseTaxRate }}%</span>
                  <span class="tx-val-original">R$ {{ formatCurrency(t.amount) }}</span>
                </div>
                <span class="tx-val-counted">R$ {{ formatCurrency(t.amount * (1 + store.expenseTaxRate / 100)) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION: SIMULADOR DE LIBERDADE FINANCEIRA & RENTABILIDADE SELIC -->
    <div class="simulator-section glass-panel">
      <div class="simulator-header flex-between" style="margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3>🔮 Simulador de Rentabilidade Selic & Liberdade Financeira</h3>
          <p>Monitore suas projeções de rentabilidade e descubra quando alcançará a sua independência.</p>
        </div>
        <div class="selic-badge-container">
          <span class="selic-badge">
            <span class="pulse-dot"></span>
            Taxa Selic: <strong>{{ selicRate }}% a.a.</strong>
          </span>
          <small class="selic-update-text">Atualizado via Banco Central (SGS 432)</small>
        </div>
      </div>

      <!-- INPUT PANEL -->
      <div class="simulator-inputs-grid">
        <div class="sim-input-group">
          <label>Valor Inicial (Saldo Fundo)</label>
          <div class="input-display-box">
            <span class="prefix">R$</span>
            <span class="value-text">{{ formatCurrency(store.emergencyFund) }}</span>
          </div>
          <small class="help-text">Saldo atual do seu fundo usado como base</small>
        </div>

        <div class="sim-input-group">
          <label for="monthly-contrib">Aporte Mensal Adicional</label>
          <div class="input-prefix-group">
            <span class="prefix">R$</span>
            <input 
              type="number" 
              id="monthly-contrib" 
              v-model.number="store.monthlyContribution" 
              step="50" 
              class="input-field-inline"
            />
          </div>
          <small class="help-text">Original planejado: R$ {{ formatCurrency(store.investedValue) }}</small>
        </div>

        <div class="sim-input-group">
          <label for="target-passive">Meta de Renda Passiva Mensal</label>
          <div class="input-prefix-group">
            <span class="prefix">R$</span>
            <input 
              type="number" 
              id="target-passive" 
              v-model.number="targetPassiveIncome" 
              step="100" 
              class="input-field-inline"
            />
          </div>
          <small class="help-text">Salário base de referência: R$ {{ formatCurrency(store.salary) }}</small>
        </div>
      </div>

      <!-- SIMULATION RESULTS -->
      <div class="simulator-results-grid">

        <!-- Row 1 -->
        <div class="sim-card sim-card-dividendos">
          <span class="sim-card-label">📊 Dividendos Atuais do Fundo</span>
          <h4 class="sim-card-value text-accent">R$ {{ formatCurrency(store.emergencyFund * monthlyRate) }}</h4>
          <span class="sim-card-sub text-muted">
            {{ (monthlyRate * 100).toFixed(2) }}% sobre R$ {{ formatCurrency(store.emergencyFund) }}
          </span>
        </div>

        <div class="sim-card">
          <span class="sim-card-label">Composição do Patrimônio até a Independência</span>
          <div style="display: flex; gap: 2rem; justify-content: center; margin-top: 0.6rem;">
            <div style="text-align: center;">
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.15rem;">Aportado</div>
              <h4 class="sim-card-value" style="font-size: 1.1rem; white-space: nowrap;">R$ {{ formatCurrency(speculativeData.totalContributions) }}</h4>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.15rem;">Juros Acumulados</div>
              <h4 class="sim-card-value text-success" style="font-size: 1.1rem; white-space: nowrap;">R$ {{ formatCurrency(speculativeData.totalInterestEarned) }}</h4>
            </div>
          </div>
        </div>

        <div class="sim-card target-indep-card" :class="{ 'reached-card': financialIndependenceYears.alreadyReached }">
          <span class="sim-card-label">Tempo para Liberdade Financeira</span>
          
          <div v-if="financialIndependenceYears.alreadyReached">
            <h4 class="sim-card-value text-success">Conquistado! 🚀</h4>
            <span class="sim-card-sub text-success">Seu fundo atual já gera R$ {{ formatCurrency(store.emergencyFund * monthlyRate) }}/mês.</span>
          </div>
          <div v-else-if="financialIndependenceYears.unreachable">
            <h4 class="sim-card-value text-muted">Aporte Necessário ⚠️</h4>
            <span class="sim-card-sub">Insira um valor de aporte maior que zero para simular.</span>
          </div>
          <div v-else>
            <h4 class="sim-card-value text-purple">
              {{ financialIndependenceYears.years }} {{ financialIndependenceYears.years === 1 ? 'ano' : 'anos' }}
              <span v-if="financialIndependenceYears.months > 0">
                e {{ financialIndependenceYears.months }} {{ financialIndependenceYears.months === 1 ? 'mês' : 'meses' }}
              </span>
            </h4>
            <span class="sim-card-sub text-purple">
              Patrimônio Alvo: <strong>R$ {{ formatCurrency(financialIndependenceYears.targetWealth) }}</strong>
            </span>
          </div>
        </div>

        <!-- Row 2 -->
        <div class="sim-card">
          <span class="sim-card-label">Acumulado em 1 Ano</span>
          <h4 class="sim-card-value">R$ {{ formatCurrency(calculateAccumulation(12)) }}</h4>
          <span class="sim-card-sub text-success">
            Rendimento mensal: + R$ {{ formatCurrency(calculateAccumulation(12) * monthlyRate) }} / mês
          </span>
        </div>

        <div class="sim-card">
          <span class="sim-card-label">Acumulado em 5 Anos</span>
          <h4 class="sim-card-value">R$ {{ formatCurrency(calculateAccumulation(60)) }}</h4>
          <span class="sim-card-sub text-success">
            Rendimento mensal: + R$ {{ formatCurrency(calculateAccumulation(60) * monthlyRate) }} / mês
          </span>
        </div>

        <div class="sim-card">
          <span class="sim-card-label">Acumulado em 10 Anos</span>
          <h4 class="sim-card-value">R$ {{ formatCurrency(calculateAccumulation(120)) }}</h4>
          <span class="sim-card-sub text-success">
            Rendimento mensal: + R$ {{ formatCurrency(calculateAccumulation(120) * monthlyRate) }} / mês
          </span>
        </div>

      </div>

      <!-- CHARTS SECTION -->
      <div class="charts-section">
        <h4 class="charts-title">📈 Projeções Gráficas</h4>

        <div class="charts-grid">
          <!-- Inflation-Adjusted Chart -->
          <div class="chart-card glass-panel">
            <div class="chart-card-header">
              <span class="chart-card-label">Poder de Compra vs. Juros Nominais (30 anos)</span>
              <small class="chart-card-sub">Saldo Nominal x Poder de Compra Ajustado (Inflação {{ inflationRate }}% a.a.)</small>
            </div>
            <canvas id="chart-inflation" height="200"></canvas>
          </div>

          <!-- Monthly Income Bar Chart -->
          <div class="chart-card glass-panel">
            <div class="chart-card-header">
              <span class="chart-card-label">Renda Passiva Mensal por Etapa</span>
              <small class="chart-card-sub">Rendimento estimado em cada marco</small>
            </div>
            <canvas id="chart-income" height="200"></canvas>
          </div>

        </div>

        <!-- Stacked area: Principal vs Juros -->
        <div class="chart-card glass-panel chart-wide">
          <div class="chart-card-header">
            <span class="chart-card-label">Capital Investido vs. Juros Gerados (30 anos)</span>
            <small class="chart-card-sub">O poder dos juros compostos ao longo do tempo</small>
          </div>
          <canvas id="chart-stacked" height="160"></canvas>
        </div>
      </div>
    </div>

    <!-- EXPENSE CATEGORY ANALYSIS -->
    <div class="simulator-section glass-panel">
      <h4 class="charts-title">📊 Análise de Gastos Mensais</h4>
      <p style="margin-bottom: 1.5rem;">Comparação entre gastos ativos (compras) e passivos vs. distribuição por categoria no ciclo atual.</p>
      <div class="charts-grid">
        <div class="chart-card glass-panel">
          <canvas id="chart-expense-category" height="260"></canvas>
        </div>
        <div class="chart-card glass-panel">
          <canvas id="chart-expense-breakdown" height="260"></canvas>
        </div>
      </div>

      <!-- CATEGORY LIMIT WARNINGS -->
      <div class="limit-warnings-section">
        <div v-if="exceededCategories.length > 0" class="limit-warnings">
          <h5 class="limit-warnings-title">⚠️ Limites por Categoria Recomendados Foram Excedidos</h5>
          <div class="limit-warnings-grid">
            <div
              v-for="cat in exceededCategories"
              :key="cat.label"
              class="limit-warning-card"
            >
              <div class="lw-label">{{ cat.label }}</div>
              <div class="lw-values">
                <span class="lw-spent">Gasto: R$ {{ formatCurrency(cat.spent) }}</span>
                <span class="lw-max">Máx: R$ {{ formatCurrency(cat.maxAllowed) }}</span>
                <span class="lw-pct-recommended">Usado: {{ cat.pctSalary.toFixed(1) }}% / Recomendado: {{ cat.pct }}%</span>
              </div>
              <div class="lw-bar">
                <div class="lw-bar-fill" :style="{ width: Math.min(cat.pctUsed, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="healthyCategories.length > 0" class="limit-warnings limit-ok">
          <h5 class="limit-ok-title">✅ Categorias Saudáveis</h5>
          <div class="limit-warnings-grid">
            <div
              v-for="cat in healthyCategories"
              :key="cat.label"
              class="limit-ok-card"
            >
              <div class="lw-label">{{ cat.label }}</div>
              <div class="lw-values">
                <span class="lw-healthy-spent">Gasto: R$ {{ formatCurrency(cat.spent) }}</span>
                <span class="lw-max">Máx: R$ {{ formatCurrency(cat.maxAllowed) }}</span>
                <span class="lw-pct-healthy">Usado: {{ cat.pctSalary.toFixed(1) }}% / Recomendado: {{ cat.pct }}%</span>
              </div>
              <div class="lw-bar">
                <div class="lw-bar-fill lw-bar-fill-ok" :style="{ width: Math.min(cat.pctUsed, 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="noCategorySpending" class="limit-warnings limit-ok">
          <p class="limit-ok-text">Nenhum gasto registrado no ciclo atual.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  Chart,
  LineElement, BarElement, PointElement, ArcElement,
  LinearScale, CategoryScale,
  Filler, Tooltip, Legend,
  LineController, BarController, DoughnutController
} from 'chart.js'
import { useWalletStore } from '../stores/walletStore'

Chart.register(
  LineElement, BarElement, PointElement, ArcElement,
  LinearScale, CategoryScale,
  Filler, Tooltip, Legend,
  LineController, BarController, DoughnutController
)

const store = useWalletStore()

const STORAGE_KEY_ACERTO_VISIBLE = 'breyne_acerto_table_visible'

const fundTxAmount = ref(null)
const showHelpModal = ref(false)
const showAcertoTable = ref(localStorage.getItem(STORAGE_KEY_ACERTO_VISIBLE) !== 'false')

// Projeção e Simulação da Selic / Liberdade Financeira
const targetPassiveIncome = ref(0)

watch(showAcertoTable, (val) => {
  localStorage.setItem(STORAGE_KEY_ACERTO_VISIBLE, val ? 'true' : 'false')
})

const selicRate = ref(10.75)
const inflationRate = ref(4)
const isFetchingSelic = ref(false)

const monthlyRate = computed(() => {
  const annual = Number(selicRate.value) || 10.75
  return Math.pow(1 + annual / 100, 1 / 12) - 1
})

const fetchSelicRate = async () => {
  isFetchingSelic.value = true
  try {
    const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        selicRate.value = Number(data[0].valor)
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar taxa Selic do Banco Central:', err)
  } finally {
    isFetchingSelic.value = false
  }
}

const fetchInflationRate = async () => {
  try {
    const res = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados/ultimos/1?formato=json')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        inflationRate.value = Number(data[0].valor.replace(',', '.'))
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar inflação do Banco Central:', err)
  }
}

onMounted(async () => {
  await store.loadFromLocalStorage()
  if (!store.monthlyContribution) store.monthlyContribution = store.investedValue
  targetPassiveIncome.value = store.salary
  await Promise.all([fetchSelicRate(), fetchInflationRate()])
  renderCharts()
})

const formatCurrency = (val) => {
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const salaryEditing = ref(false)
const salaryRaw = ref('')

const salaryDisplay = computed(() => {
  if (salaryEditing.value) return salaryRaw.value
  return formatCurrency(store.salary)
})

function onSalaryFocus() {
  salaryEditing.value = true
  salaryRaw.value = store.salary.toFixed(2).replace('.', ',')
}

function onSalaryInput(e) {
  const raw = e.target.value.replace(/[^0-9,]/g, '')
  salaryRaw.value = raw
  const parsed = parseFloat(raw.replace(',', '.'))
  if (!isNaN(parsed)) {
    store.salary = Math.round(parsed * 100) / 100
    store.saveToLocalStorage()
  }
}

function onSalaryBlur() {
  salaryEditing.value = false
  const raw = salaryRaw.value
  salaryRaw.value = ''
  const parsed = parseFloat(raw.replace(',', '.'))
  store.salary = isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100
  store.saveToLocalStorage()
}

// Meta ideal do fundo de emergência: 6 meses de salário
const idealFundGoal = computed(() => {
  return store.salary * 6
})

const fundProgressPercentage = computed(() => {
  if (idealFundGoal.value === 0) return 0
  return Math.min(100, (store.emergencyFund / idealFundGoal.value) * 100)
})

// Ativos (Compras) vs Passivos
const categoryTotals = computed(() => {
  const totalC = Number(store.totalCompras) || 0
  const totalP = Number(store.totalPassivos) || 0
  const items = []
  if (totalC > 0) items.push({ name: 'Compras', total: totalC })
  if (totalP > 0) items.push({ name: 'Passivos', total: totalP })
  if (items.length === 0) items.push({ name: 'Nenhum gasto', total: 1 })
  return items
})

// Gastos agregados por categoria
const categoryBreakdown = computed(() => {
  const expenses = store.transactions.filter(t => t.type === 'expense')
  const map = {}
  for (const t of expenses) {
    const cat = t.category || 'Outros'
    map[cat] = (map[cat] || 0) + Number(t.amount)
  }
  return Object.entries(map)
    .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total)
})

const percentLimitUsed = computed(() => {
  if (store.limitConsumption === 0) return 0
  return ((store.consumoAtual + store.currentInterest) / store.limitConsumption) * 100
})

const CATEGORY_PCT_LIMITS = [
  { label: '🏠 Moradia', key: 'Moradia', pct: 25 },
  { label: '🚗 Transporte', key: 'Transporte', pct: 10 },
  { label: '🍽️ Alimentação', key: 'Alimentação', pct: 15 },
  { label: '⚡ Contas', key: 'Contas', pct: 10 },
  { label: '🏥 Saúde e seguros', key: 'Saúde', pct: 5 },
  { label: '🎓 Educação', key: 'Educação', pct: 2.5 },
  { label: '🎉 Lazer e compras', key: 'Lazer', pct: 2.5 },
]

const categoryWarnings = computed(() => {
  const salary = Number(store.salary) || 0
  const breakdown = categoryBreakdown.value
  const breakdownMap = {}
  for (const b of breakdown) {
    breakdownMap[b.name] = b.total
  }

  return CATEGORY_PCT_LIMITS.map(lim => {
    const spent = lim.key ? (breakdownMap[lim.key] || 0) : 0
    const maxAllowed = salary * (lim.pct / 100)
    const pctUsed = maxAllowed > 0 ? (spent / maxAllowed) * 100 : 0
    const pctSalary = salary > 0 ? (spent / salary) * 100 : 0
    const exceeded = spent > maxAllowed
    return { ...lim, spent, maxAllowed, pctUsed, pctSalary, exceeded }
  })
})

const exceededCategories = computed(() => categoryWarnings.value.filter(c => c.exceeded))

const healthyCategories = computed(() => categoryWarnings.value.filter(c => !c.exceeded && c.spent > 0))

const noCategorySpending = computed(() => categoryWarnings.value.every(c => c.spent === 0))

const handleFundAction = async (isDeposit) => {
  if (!fundTxAmount.value || fundTxAmount.value <= 0) return
  
  const success = await store.adjustEmergencyFund(fundTxAmount.value, isDeposit)
  if (success) {
    fundTxAmount.value = null
  } else {
    alert('Erro: Saldo insuficiente para resgatar este valor.')
  }
}

const triggerSimulateInterest = async () => {
  await store.simulateInterest(selicRate.value)
}

const calculateAccumulation = (months) => {
  const S0 = Number(store.emergencyFund) || 0
  const C = Number(store.monthlyContribution) || 0
  const r = monthlyRate.value
  if (r <= 0) return S0 + C * months
  const finalBalance = S0 * Math.pow(1 + r, months) + C * ((Math.pow(1 + r, months) - 1) / r)
  return Number(finalBalance.toFixed(2))
}

const financialIndependenceYears = computed(() => {
  const S0 = Number(store.emergencyFund) || 0
  const C = Number(store.monthlyContribution) || 0
  const targetIncome = Number(targetPassiveIncome.value) || 0
  const r = monthlyRate.value

  if (r <= 0 || targetIncome <= 0) return { years: 0, months: 0, targetWealth: 0, unreachable: true }

  const targetWealth = Number((targetIncome / r).toFixed(2))

  if (S0 >= targetWealth) {
    return { years: 0, months: 0, targetWealth, unreachable: false, alreadyReached: true }
  }

  if (C <= 0) {
    return { years: 0, months: 0, targetWealth, unreachable: true }
  }

  const num = targetWealth + (C / r)
  const den = S0 + (C / r)
  const months = Math.ceil(Math.log(num / den) / Math.log(1 + r))

  if (isNaN(months) || months < 0 || !isFinite(months)) {
    return { years: 0, months: 0, targetWealth, unreachable: true }
  }

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  return { years, months: remainingMonths, totalMonths: months, targetWealth, unreachable: false }
})

// -------------------------------------------------------
// Speculative numbers
// -------------------------------------------------------
const speculativeData = computed(() => {
  const fi = financialIndependenceYears.value
  const r  = monthlyRate.value
  const C  = Number(store.monthlyContribution) || 0
  const S0 = Number(store.emergencyFund) || 0

  const N = fi.unreachable || fi.alreadyReached ? 0 : (fi.totalMonths || 0)
  const targetWealth = fi.targetWealth || 0

  const totalContributions = S0 + C * N
  const balanceAtN = calculateAccumulation(N)
  const totalInterestEarned = Math.max(0, balanceAtN - totalContributions)

  const incomeAt20y = calculateAccumulation(240) * r

  return {
    totalContributions: Number(totalContributions.toFixed(2)),
    totalInterestEarned: Number(totalInterestEarned.toFixed(2)),
    incomeAt20y: Number(incomeAt20y.toFixed(2)),
    targetWealth: Number(targetWealth.toFixed(2))
  }
})

// -------------------------------------------------------
// Chart.js — 4 charts
// -------------------------------------------------------
let chartIncome = null
let chartStacked = null
let chartExpenseCategory = null
let chartExpenseBreakdown = null
let chartInflation = null

const buildChartData = () => {
  const r  = monthlyRate.value
  const C  = Number(store.monthlyContribution) || 0
  const S0 = Number(store.emergencyFund) || 0
  const tw = financialIndependenceYears.value.targetWealth || 0

  // 30 years = 360 months, sample yearly (every 12 months)
  const labels = []
  const balances = []
  const contributions = []
  const interests = []
  const incomes = []

  for (let y = 0; y <= 30; y++) {
    const m = y * 12
    labels.push(`Ano ${y}`)
    const bal = calculateAccumulation(m)
    const totalIn = S0 + C * m
    balances.push(Number(bal.toFixed(2)))
    contributions.push(Number(Math.min(bal, totalIn).toFixed(2)))
    interests.push(Number(Math.max(0, bal - totalIn).toFixed(2)))
    incomes.push(Number((bal * r).toFixed(2)))
  }

  return { labels, balances, contributions, interests, incomes, targetWealth: tw }
}

const renderCharts = async () => {
  await nextTick()

  const cvIncome = document.getElementById('chart-income')
  const cvStack  = document.getElementById('chart-stacked')
  if (!cvIncome || !cvStack) return

  const { labels, balances, contributions, interests, incomes, targetWealth } = buildChartData()

  const palette = {
    navy:   '#1e3a5f',
    gold:   '#b8860b',
    green:  '#2d6a4f',
    purple: '#5a2882',
    cream:  '#f5f0e6',
    border: '#d4c9a8'
  }

  // ---- Chart 2: Monthly Income Bar ----
  const milestones = [1, 2, 5, 10, 15, 20, 25, 30]
  if (chartIncome) chartIncome.destroy()
  chartIncome = new Chart(cvIncome, {
    type: 'bar',
    data: {
      labels: milestones.map(y => `${y}a`),
      datasets: [{
        label: 'Renda Passiva Mensal (R$)',
        data: milestones.map(y => Number((calculateAccumulation(y * 12) * monthlyRate.value).toFixed(2))),
        backgroundColor: 'rgba(30,58,95,0.75)',
        borderColor: palette.navy,
        borderWidth: 1,
        borderRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês` } }
      },
      scales: {
        y: { ticks: { callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR', { notation: 'compact' }) }, grid: { color: '#e8e2d4' } },
        x: { grid: { display: false } }
      }
    }
  })

  // ---- Chart 3: Stacked Area ----
  if (chartStacked) chartStacked.destroy()
  chartStacked = new Chart(cvStack, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Juros Acumulados (R$)',
          data: interests,
          backgroundColor: 'rgba(45,106,79,0.45)',
          borderColor: palette.green,
          borderWidth: 1.5,
          fill: true,
          tension: 0.35,
          pointRadius: 2
        },
        {
          label: 'Capital Aportado (R$)',
          data: contributions,
          backgroundColor: 'rgba(30,58,95,0.30)',
          borderColor: palette.navy,
          borderWidth: 1.5,
          fill: true,
          tension: 0.35,
          pointRadius: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Georgia, serif', size: 11 } } },
        tooltip: { callbacks: { label: ctx => ` R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` } }
      },
      scales: {
        y: { stacked: false, ticks: { callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR', { notation: 'compact' }) }, grid: { color: '#e8e2d4' } },
        x: { grid: { display: false } }
      }
    }
  })

  // ---- Chart 4: Compras vs Passivos ----
  const cvExpCat = document.getElementById('chart-expense-category')
  if (cvExpCat) {
    if (chartExpenseCategory) chartExpenseCategory.destroy()
    const catData = categoryTotals.value
    const hasCatData = catData.length > 0
    const catColors = ['#1e3a5f', '#b8860b']
    chartExpenseCategory = new Chart(cvExpCat, {
      type: 'doughnut',
      data: {
        labels: hasCatData ? catData.map(d => d.name) : ['Nenhum gasto'],
        datasets: [{
          data: hasCatData ? catData.map(d => d.total) : [1],
          backgroundColor: hasCatData ? catData.map((_, i) => catColors[i % catColors.length]) : ['#e8e2d4'],
          borderColor: hasCatData ? catData.map((_, i) => catColors[i % catColors.length]) : ['#e8e2d4'],
          borderWidth: 1.5,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: 0,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: 'Georgia, serif', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                if (!hasCatData) return ' Nenhum gasto'
                const total = catData.reduce((s, d) => s + d.total, 0)
                const pct = ((ctx.raw / total) * 100).toFixed(1)
                return ` ${ctx.label}: R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`
              }
            }
          }
        }
      }
    })
  }

  // ---- Chart 5: Gastos por Categoria ----
  const cvExpBrk = document.getElementById('chart-expense-breakdown')
  if (cvExpBrk) {
    if (chartExpenseBreakdown) chartExpenseBreakdown.destroy()
    const brkData = categoryBreakdown.value
    const hasBrkData = brkData.length > 0
    const brkColors = ['#1e3a5f', '#b8860b', '#2d6a4f', '#5a2882', '#701c1c', '#4c566a', '#8a6f3e', '#cdc7b1']
    chartExpenseBreakdown = new Chart(cvExpBrk, {
      type: 'doughnut',
      data: {
        labels: hasBrkData ? brkData.map(d => d.name) : ['Nenhum gasto'],
        datasets: [{
          data: hasBrkData ? brkData.map(d => d.total) : [1],
          backgroundColor: hasBrkData ? brkData.map((_, i) => brkColors[i % brkColors.length]) : ['#e8e2d4'],
          borderColor: hasBrkData ? brkData.map((_, i) => brkColors[i % brkColors.length]) : ['#e8e2d4'],
          borderWidth: 1.5,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: 0,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 14,
              font: { family: 'Georgia, serif', size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                if (!hasBrkData) return ' Nenhum gasto'
                const total = brkData.reduce((s, d) => s + d.total, 0)
                const pct = ((ctx.raw / total) * 100).toFixed(1)
                return ` ${ctx.label}: R$ ${Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${pct}%)`
              }
            }
          }
        }
      }
    })
  }

  // ---- Chart 6: Inflation-Adjusted ----
  const cvInflation = document.getElementById('chart-inflation')
  if (cvInflation) {
    if (chartInflation) chartInflation.destroy()
    const inflRate = Number(inflationRate.value) || 4
    const realBalances = balances.map((bal, i) => {
      const years = i
      const factor = Math.pow(1 + inflRate / 100, years)
      return Number((bal / factor).toFixed(2))
    })
    chartInflation = new Chart(cvInflation, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Saldo Nominal (R$)',
            data: balances,
            borderColor: '#1e3a5f',
            backgroundColor: 'rgba(30,58,95,0.08)',
            borderWidth: 2,
            fill: false,
            tension: 0.35,
            pointRadius: 2,
            pointBackgroundColor: '#1e3a5f',
            pointBorderColor: '#1e3a5f',
            pointHoverRadius: 4
          },
          {
            label: 'Poder de Compra Real (R$)',
            data: realBalances,
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45,106,79,0.08)',
            borderWidth: 2,
            fill: false,
            tension: 0.35,
            pointRadius: 2,
            pointBackgroundColor: '#2d6a4f',
            pointBorderColor: '#2d6a4f',
            pointHoverRadius: 4,
            borderDash: [5, 3]
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Georgia, serif', size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const label = ctx.dataset.label || ''
                const val = Number(ctx.raw).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                return ` ${label}: R$ ${val}`
              },
              afterBody: items => {
                if (items.length === 2) {
                  const diff = items[0].raw - items[1].raw
                  return `\nPerda para inflação: R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
                return ''
              }
            }
          }
        },
        scales: {
          y: { ticks: { callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR', { notation: 'compact' }) }, grid: { color: '#e8e2d4' } },
          x: { grid: { display: false } }
        }
      }
    })
  }
}
watch([selicRate, inflationRate, () => store.monthlyContribution, targetPassiveIncome, () => store.emergencyFund, () => store.transactions], () => {
  renderCharts()
}, { debounce: 300 })

watch(() => store.monthlyContribution, () => {
  store.saveToLocalStorage()
})
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.welcome-bar {
  text-align: left;
}

.welcome-bar h2 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.salary-control-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-end;
}

.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.welcome-bar {
  text-align: left;
}

.welcome-bar h2 {
  font-size: 1.6rem;
  margin-bottom: 0.25rem;
}

.salary-control-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-end;
}

.salary-control-card label {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.salary-input-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.35rem 0.75rem;
}

.currency-prefix {
  font-size: 0.9rem;
  color: var(--text-primary);
  font-weight: bold;
  margin-right: 0.35rem;
}

.salary-input {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: bold;
  width: 110px;
  outline: none;
  font-family: "Times New Roman", Times, Georgia, serif;
  text-align: right;
}

/* Status Cards Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
}

.status-card {
  text-align: left;
  border: 1px solid var(--border-color);
  border-left: 5px solid var(--border-color);
  border-radius: 3px;
  background: #ffffff;
}

.border-blue {
  border-left-color: var(--text-primary); /* Navy Blue border */
}

.border-purple {
  border-left-color: var(--accent-color); /* Gold border */
}

.border-danger {
  border-left-color: var(--border-color);
}


.card-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.card-value {
  font-size: 1.6rem;
  font-weight: bold;
  margin: 0.4rem 0;
  color: var(--text-primary);
}

.card-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.card-limit-stacked {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.2rem 0;
}

.card-limit-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--text-primary);
  white-space: nowrap;
}

.card-limit-spent {
  color: var(--accent-color);
}

.card-limit-max {
  color: var(--text-muted, #888);
}

.card-invest-planned {
  color: var(--accent-color);
}

.card-invest-available {
  color: var(--text-muted, #888);
}

.card-bg-success {
  background: rgba(40, 167, 69, 0.06) !important;
}

.card-bg-danger {
  background: rgba(220, 53, 69, 0.08) !important;
}

.card-limit-divider {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 70%;
  margin: 0.15rem 0;
}

.card-limit-line {
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.card-limit-x {
  font-size: 0.55rem;
  font-weight: bold;
  color: var(--text-secondary);
  line-height: 1;
}

.text-blue {
  color: var(--text-primary);
}

.text-purple {
  color: var(--accent-color);
}

.text-orange {
  color: var(--accent-color);
}

/* Diagram Section */
.diagram-section {
  text-align: left;
}

.calculation-mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  padding: 0.4rem 0.75rem;
  border-radius: 3px;
}

.mode-label {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.toggle-switch-sm {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggle-switch-sm input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider-sm {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cdc7b1;
  transition: .4s;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.toggle-slider-sm:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-primary);
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider-sm {
  background-color: var(--accent-color);
  border-color: var(--accent-hover);
}

input:checked + .toggle-slider-sm:before {
  transform: translateX(16px);
  background-color: #ffffff;
}

/* Settlement Table */
.settlement-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  font-size: 0.92rem;
}

.settlement-table th {
  text-align: left;
  padding: 0.65rem 1rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
  font-weight: bold;
}

.settlement-table th.text-right,
.settlement-table td.text-right {
  text-align: right;
}

.settlement-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
  vertical-align: middle;
}

.settlement-table td.formula {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-style: italic;
}

.row-section-header td {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-primary);
  background: #f3efe2;
  border-top: 1px solid var(--border-color);
}

.row-danger td {
  background: #fdf2f2;
}

.row-total td {
  background: rgba(30, 70, 37, 0.05);
  border-top: 2px solid var(--success-color);
  font-weight: bold;
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.tax-inline-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: #fdf2f2;
  border: 1px solid #f8b4b4;
  color: var(--danger-color);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
  font-size: 0.78rem;
  margin-left: 0.4rem;
}

.tax-input-inline {
  background: transparent;
  border: none;
  color: inherit;
  font-weight: bold;
  width: 26px;
  text-align: center;
  font-size: 0.78rem;
  outline: none;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.tax-input-inline::-webkit-outer-spin-button,
.tax-input-inline::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

/* Limit Usage Styles */
.row-limit-usage td {
  background: #fdfbf7;
  font-size: 0.9rem;
  border-bottom: 2px solid var(--border-color);
}

.limit-exceeded td {
  background: #fdf2f2;
  color: var(--danger-color);
}

/* Emergency Fund Section */
.emergency-fund-card {
  text-align: left;
}

.fund-badge {
  background: rgba(30, 70, 37, 0.08);
  color: var(--success-color);
  border: 1px solid rgba(30, 70, 37, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 2px;
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: bold;
}

.fund-balance-display {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  position: relative;
}

.fund-balance-display::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  border: 1px solid rgba(138, 111, 62, 0.15);
  pointer-events: none;
}

.fund-label {
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.fund-balance-display h2 {
  font-size: 2.2rem;
  font-weight: bold;
  color: var(--success-color);
  margin-top: 0.25rem;
}

.fund-progress-area {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.fund-progress-labels {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: bold;
}

.meta-progress-bar {
  width: 100%;
  height: 8px;
  background: #cdc7b1;
  border-radius: 4px;
  overflow: hidden;
}

.meta-progress-fill {
  height: 100%;
  background: var(--success-color);
  border-radius: 4px;
}

.fund-actions-area {
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.fund-actions-area label {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.fund-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.fund-input-box {
  flex: 1;
  margin-bottom: 0 !important;
}

.fund-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-success {
  background: var(--success-color);
  color: #fff;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 3px;
  padding: 0 1.25rem;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-success:hover {
  background: #112d19;
}

.btn-danger-outline {
  background: transparent;
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  border-radius: 3px;
  padding: 0 1.25rem;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger-outline:hover {
  background: var(--danger-color);
  color: #fff;
}

.btn-sim-interest {
  background: #ffffff;
  color: var(--text-primary);
  border: 1px solid var(--text-primary);
  border-radius: 3px;
  padding: 0.6rem 1rem;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  transition: all 0.2s;
}

.btn-sim-interest:hover {
  background: rgba(11, 29, 51, 0.05);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* Mini Expense history */
.mini-expenses-card {
  text-align: left;
}

.btn-link {
  font-size: 0.85rem;
  color: var(--accent-color);
  text-decoration: underline;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-link:hover {
  color: var(--accent-hover);
}

.empty-state {
  padding: 2rem 0;
  color: var(--text-secondary);
  text-align: center;
}

.mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mini-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.mini-item:last-child {
  border-bottom: none;
}

.mini-item-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-desc {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: bold;
}

.mini-amount {
  font-size: 0.85rem;
  font-weight: bold;
}

.mini-val-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.tx-val-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tx-interest-arrow {
  color: var(--danger-color);
  font-size: 0.55rem;
  font-weight: bold;
  opacity: 0.8;
  white-space: nowrap;
  line-height: 1;
}

.tx-val-original {
  color: var(--text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
}

.tx-val-counted {
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-primary);
  white-space: nowrap;
}


/* Help trigger button ("?") */
.help-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid var(--accent-color);
  color: var(--accent-color);
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: background 0.2s, color 0.2s;
  font-family: "Times New Roman", Times, Georgia, serif;
  flex-shrink: 0;
  margin-top: 2px;
}
.help-trigger-btn:hover {
  background: var(--accent-color);
  color: #fff;
}

.toggle-table-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: #fff;
  color: var(--text-primary);
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toggle-table-btn:hover {
  border-color: var(--accent-color);
  background: #fdfcf7;
}

/* Modal overlay */
.help-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.help-modal-box {
  background: #fdfaf3;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 8px 40px rgba(0,0,0,0.18);
  font-family: "Times New Roman", Times, Georgia, serif;
  max-height: 90vh;
  overflow-y: auto;
}

.help-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.help-modal-header h4 {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

.help-modal-close {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  font-size: 0.85rem;
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background 0.15s;
}
.help-modal-close:hover {
  background: #f0ebe0;
}

.help-intro {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
  line-height: 1.6;
}

.help-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
@media (max-width: 500px) {
  .help-grid { grid-template-columns: 1fr; }
}

.help-item {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.help-item strong {
  font-size: 0.88rem;
  color: var(--text-primary);
}

.help-item p {
  font-size: 0.83rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
}

.help-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.15rem 0.45rem;
  border-radius: 2px;
  margin-bottom: 0.2rem;
  width: fit-content;
}

.badge-limit  { background: rgba(30,70,120,0.10); color: #1e4678; border: 1px solid rgba(30,70,120,0.2); }
.badge-bonus  { background: rgba(90,40,130,0.10); color: #5a2882; border: 1px solid rgba(90,40,130,0.2); }
.badge-juros  { background: rgba(180,90,0,0.10);  color: #b45a00; border: 1px solid rgba(180,90,0,0.2); }
.badge-penalty{ background: rgba(160,30,30,0.10); color: #a01e1e; border: 1px solid rgba(160,30,30,0.2); }

.help-summary-text {
  background: #f5f0e6;
  border-left: 3px solid var(--accent-color);
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--text-primary);
  border-radius: 0 3px 3px 0;
}

/* Simulator Section Styles */
.simulator-section {
  text-align: left;
  margin-top: 1rem;
  width: 100%;
}

.selic-badge-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
}

.selic-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(30, 70, 37, 0.08);
  color: var(--success-color);
  border: 1px solid rgba(30, 70, 37, 0.2);
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: var(--success-color);
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 0 rgba(30, 70, 37, 0.4);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(30, 70, 37, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(30, 70, 37, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(30, 70, 37, 0);
  }
}

.selic-update-text {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.simulator-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  background: #fcfbf8;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1.5rem;
}

.sim-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sim-input-group label {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-display-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.4rem 0.6rem;
  height: 38px;
}

.input-display-box .value-text {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--text-primary);
  margin-left: 0.3rem;
  margin-right: auto;
}

.btn-apply-interest-inline {
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 2px;
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s;
  font-family: "Times New Roman", Times, Georgia, serif;
}
.btn-apply-interest-inline:hover {
  background: var(--accent-hover);
}

.input-prefix-group {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  padding: 0.4rem 0.6rem;
  height: 38px;
}

.input-prefix-group input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-left: 0.3rem;
  background: transparent;
  font-family: "Times New Roman", Times, Georgia, serif;
}

.simulator-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.sim-card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.sim-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.sim-card-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sim-card-value {
  font-size: 1.6rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0.2rem 0;
}

.sim-card-sub {
  font-size: 0.78rem;
  line-height: 1.4;
}

.target-indep-card {
  border: 1.5px solid var(--border-color);
  background: #faf7ff;
}

.sim-card-dividendos {
  border-left: 4px solid var(--accent-color);
  background: #fcf9f2;
}

.text-accent {
  color: var(--accent-color) !important;
}

.target-indep-card.reached-card {
  background: #f3fdf5;
  border-color: rgba(30, 70, 37, 0.3);
}

.target-indep-card .text-purple {
  color: #5a2882;
}

.target-indep-card .text-muted {
  color: var(--text-secondary);
}

/* Charts section */
.charts-section {
  margin-top: 2rem;
}

.charts-title {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 700px) {
  .charts-grid { grid-template-columns: 1fr; }
}

.chart-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow: hidden;
  min-width: 0;
}

.chart-card canvas {
  max-width: 100%;
}

.chart-wide {
  margin-bottom: 1.25rem;
}

.chart-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.chart-card-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.chart-card-sub {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Speculative numbers */
.speculative-panel {
  margin-top: 2rem;
}

.speculative-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.spec-card {
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: transform 0.2s;
}

.spec-card:hover {
  transform: translateY(-2px);
}

.spec-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  line-height: 1.3;
}

.spec-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-primary);
}

.spec-value.text-success { color: var(--success-color); }
.spec-value.text-purple  { color: #5a2882; }
.spec-value.text-muted   { color: var(--text-secondary); font-size: 1rem; }

@media (max-width: 768px) {
  .welcome-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .welcome-bar h2 { font-size: 1.3rem; }
  .salary-control-card { align-items: flex-start; width: 100%; }
  .salary-input-group { width: 100%; }
  .salary-input { width: 100%; }
}
@media (max-width: 600px) {
  .card-value { font-size: 1.2rem; }
  .card-limit-value { font-size: 1.2rem; }
  .card-limit-divider { width: 60%; }
  .settlement-table { font-size: 0.75rem; }
  .settlement-table th,
  .settlement-table td { padding: 0.35rem 0.4rem; }
  .settlement-table td.formula { font-size: 0.65rem; }
  .fund-input-group { flex-direction: column; gap: 0.5rem; }
  .fund-buttons { width: 100%; }
  .fund-buttons button { flex: 1; }
  .fund-balance-display h2 { font-size: 1.6rem; }
  .simulator-inputs-grid { padding: 1rem; gap: 1rem; }
  .sim-card-value { font-size: 1.2rem; }
  .help-modal-box { padding: 1.25rem; margin: 0.5rem; }
}

/* Category limit warnings */
.limit-warnings {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.limit-warnings-title {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: var(--danger-color);
}

.limit-warnings-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.limit-warning-card {
  padding: 0.75rem 1rem;
  background: #fdf2f2;
  border: 1px solid #f8b4b4;
  border-left: 3px solid var(--danger-color);
  border-radius: 3px;
}

.lw-label {
  font-size: 0.82rem;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
}

.lw-values {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.78rem;
}

.lw-spent {
  color: var(--danger-color);
  font-weight: bold;
}

.lw-max {
  color: var(--text-secondary);
}

.lw-pct {
  font-weight: bold;
  color: var(--danger-color);
  margin-left: auto;
}

.lw-pct-recommended {
  font-weight: bold;
  color: var(--danger-color);
  margin-left: auto;
  white-space: nowrap;
}

.lw-bar {
  margin-top: 0.4rem;
  height: 6px;
  background: #e8e2d4;
  border-radius: 3px;
  overflow: hidden;
}

.lw-bar-fill {
  height: 100%;
  background: var(--danger-color);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.limit-ok {
  border-color: #def7ec;
  background: #f3faf5;
}

.limit-ok-text {
  font-size: 0.85rem;
  color: var(--success-color);
  font-weight: bold;
  text-align: center;
}

.limit-warnings-section {
  margin-top: 1.5rem;
}

.limit-ok-title {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  color: var(--success-color);
}

.limit-ok-card {
  padding: 0.75rem 1rem;
  background: #f3faf5;
  border: 1px solid #def7ec;
  border-left: 3px solid var(--success-color);
  border-radius: 3px;
}

.lw-healthy-spent {
  color: var(--success-color);
  font-weight: bold;
}

.lw-pct-healthy {
  font-weight: bold;
  color: var(--success-color);
  margin-left: auto;
  white-space: nowrap;
}

.lw-bar-fill-ok {
  background: var(--success-color);
}
</style>
