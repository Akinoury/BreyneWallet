<template>
  <Teleport to="body">
    <div class="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Tutorial de boas-vindas">
      <div class="tutorial-card">
        <header class="tutorial-header">
          <div class="tutorial-brand">
            <img src="/icon-header.png" alt="" class="tutorial-logo" />
            <span><span class="logo-accent">Breyne</span>Wallet</span>
          </div>
          <button class="tutorial-close" @click="dismiss" title="Fechar tutorial" aria-label="Fechar tutorial">✕</button>
        </header>

        <div class="tutorial-progress" aria-hidden="true">
          <span
            v-for="(s, i) in steps"
            :key="i"
            class="tutorial-progress-seg"
            :class="{ done: i < currentIndex, current: i === currentIndex }"
            @click="goTo(i)"
          ></span>
        </div>

        <div class="tutorial-body">
          <Transition :name="'tut-' + direction" mode="out-in">
            <div :key="currentIndex" class="tutorial-step">
              <div class="tutorial-icon">{{ steps[currentIndex].icon }}</div>
              <h3 class="tutorial-title">{{ steps[currentIndex].title }}</h3>
              <div class="tutorial-text">
                <p v-for="(par, i) in steps[currentIndex].paragraphs" :key="i">{{ par }}</p>
              </div>

              <!-- VISUAL: Boas-vindas -->
              <div v-if="steps[currentIndex].visual === 'welcome'" class="tutorial-visual visual-welcome">
                <img src="/pig.png" alt="Fundo de emergência" class="visual-pig" />
                <div class="visual-chip-row">
                  <span class="visual-chip">🐷 Fundo de Emergência</span>
                  <span class="visual-chip chip-gold">🔁 Lógica Reversa</span>
                  <span class="visual-chip chip-purple">📈 Investimentos</span>
                </div>
              </div>

              <!-- VISUAL: Fundo de Emergência -->
              <div v-else-if="steps[currentIndex].visual === 'fund'" class="tutorial-visual visual-fund">
                <div class="fund-mini-bar">
                  <span class="fund-mini-fill" :style="{ width: '40%' }"></span>
                </div>
                <div class="fund-mini-labels">
                  <span>Meta ideal: 6 salários</span>
                  <span class="text-bold">Retorno Total volta aqui →</span>
                </div>
              </div>

              <!-- VISUAL: Lógica Reversa dos Juros -->
              <div v-else-if="steps[currentIndex].visual === 'reverse'" class="tutorial-visual visual-reverse">
                <div class="reverse-flow">
                  <div class="flow-node">
                    <span class="flow-icon">💼</span>
                    <span class="flow-label">Salário</span>
                    <span class="flow-sub">entrada</span>
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-node">
                    <span class="flow-icon">📏</span>
                    <span class="flow-label">Limite de Consumo</span>
                    <span class="flow-sub flow-sub-danger">70% do salário</span>
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-node">
                    <span class="flow-icon">💸</span>
                    <span class="flow-label">Compras + Passivos</span>
                    <span class="flow-sub">+ juros de 15%</span>
                  </div>
                  <div class="flow-arrow down-arrow">↓</div>
                  <div class="flow-node flow-node-warn">
                    <span class="flow-icon">⚠️</span>
                    <span class="flow-label">Se passar do limite</span>
                    <span class="flow-sub flow-sub-danger">penalidade de 30%</span>
                  </div>
                  <div class="flow-arrow">→</div>
                  <div class="flow-node flow-node-ok">
                    <span class="flow-icon">🐷</span>
                    <span class="flow-label">Retorno ao Fundo</span>
                    <span class="flow-sub">juros de volta pra você</span>
                  </div>
                </div>
                <div class="reverse-caption">
                  Quem sempre paga juros ao banco, agora cobra de si mesmo — e o que "sobra" investe no próprio futuro.
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <footer class="tutorial-footer">
          <button v-if="currentIndex > 0" class="tutorial-skip" @click="prev">← Anterior</button>
          <button v-else class="tutorial-skip" @click="dismiss">Pular</button>

          <div class="tutorial-dots" aria-hidden="true">
            <span
              v-for="(s, i) in steps"
              :key="i"
              class="tutorial-dot"
              :class="{ active: i === currentIndex }"
              @click="goTo(i)"
            ></span>
          </div>

          <button v-if="currentIndex < steps.length - 1" class="tutorial-next" @click="next">
            Próximo →
          </button>
          <button v-else class="tutorial-next" @click="dismiss">
            Começar 💼
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

const steps = [
  {
    icon: '🏦',
    title: 'Bem-vindo ao BreyneWallet!',
    visual: 'welcome',
    paragraphs: [
      'Aqui você passa a ser o seu próprio banco: suas compras e passivos geram juros que voltam para o SEU Fundo de Emergência — em vez de engordar o banco.',
      'Dê um passeio rápido para conhecer cada área e entender a lógica reversa dos juros.'
    ]
  },
  {
    icon: '🏠',
    title: 'Home & Tabela de Acerto de Contas',
    visual: null,
    paragraphs: [
      'Na Home você informa o seu salário. A partir dele, o app calcula o Limite de Consumo (70%), o valor planejado para investir (30%) e o Bônus de Investidor (5%).',
      'A Tabela de Acerto de Contas fecha o ciclo do mês: Compras + Passivos = Gastos Correntes, sobre os quais incidem juros — e tudo isso compõe o Retorno Total ao Fundo.'
    ]
  },
  {
    icon: '🐷',
    title: 'Fundo de Emergência',
    visual: 'fund',
    paragraphs: [
      'Aportar e resgatar é direto na Home. Acompanhe o progresso até a meta ideal de 6 salários.',
      'O Retorno Total do seu ciclo é devolvido a este fundo — é assim que consumo vira reserva.',
      'Com o Simulador Selic (na aba Investimentos) você projeta o rendimento e a sua Liberdade Financeira.'
    ]
  },
  {
    icon: '💸',
    title: 'Despesas: Compras & Passivos',
    visual: null,
    paragraphs: [
      'Toda despesa entra como Compra ou Passivo, com a categoria que você escolher. O app aplica uma seta de juros ↑15% sobre o valor — esse é o custo real do consumo desnecessário.',
      'Use o menu ⋮ para limpar compras, passivos ou tudo de uma vez, mantendo registros fixos e bônus.'
    ]
  },
  {
    icon: '📈',
    title: 'Investimentos & Mercados',
    visual: null,
    paragraphs: [
      'Monte sua carteira de ativos Nacionais e Internacionais, com conversão automática usando o câmbio do Banco Central.',
      'Lá também está o Simulador Selic: patrimônio, projeções de 1, 5 e 10 anos e o marco da Liberdade Financeira.',
      'Em "📈 Mercados" você acompanha cotações ao vivo e pode criar alertas de preço.'
    ]
  },
  {
    icon: '🏷️',
    title: 'Cupons & Configurações',
    visual: null,
    paragraphs: [
      'Cupons reúne os melhores descontos das suas lojas favoritas, com filtros por loja e cupons verificados.',
      'Nas Configurações você ajusta as taxas da sua lógica (limite, juros, penalidade, investimento), ativa a biometria e gerencia sua conta.'
    ]
  },
  {
    icon: '🔁',
    title: 'A Lógica Reversa dos Juros',
    visual: 'reverse',
    paragraphs: [
      'Para quem vive endividado, juro é dívida com o banco: cada parcelamento cresce contra você.',
      'O BreyneWallet reverte isso. Aqui, comprar demais cobra juros de você mesmo: Compras e Passivos sofrem uma taxa de 15% que é somada ao seu consumo e precisa ser devolvida ao SEU Fundo.',
      'Se o Consumo + Juros superar 70% do salário, uma penalidade de 30% sobre o excedente ainda é descontada dos seus investimentos.',
      'Ou seja: quanto mais você gasta, mais o seu próprio banco cobra. Poupar e investir vira a forma mais barata de viver — e os juros voltam a trabalhar a seu favor, no seu fundo.'
    ]
  }
]

const currentIndex = ref(0)
const direction = ref('next')

const next = () => {
  if (currentIndex.value < steps.length - 1) {
    direction.value = 'next'
    currentIndex.value += 1
  }
}

const prev = () => {
  if (currentIndex.value > 0) {
    direction.value = 'prev'
    currentIndex.value -= 1
  }
}

const goTo = (i) => {
  if (i < 0 || i >= steps.length || i === currentIndex.value) return
  direction.value = i > currentIndex.value ? 'next' : 'prev'
  currentIndex.value = i
}

const dismiss = () => {
  emit('close')
}

function onKeydown(e) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'Escape') dismiss()
}

function onAppError() {
  dismiss()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('error', onAppError)
  window.addEventListener('unhandledrejection', onAppError)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('error', onAppError)
  window.removeEventListener('unhandledrejection', onAppError)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.tutorial-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  padding-top: calc(1.5rem + env(safe-area-inset-top, 0px));
  padding-bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  background: rgba(11, 29, 51, 0.72);
  animation: overlayIn 0.3s ease-out forwards;
}

@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .tutorial-overlay {
    background: rgba(11, 29, 51, 0.6);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }
}

.tutorial-card {
  width: min(540px, 100%);
  max-height: min(92vh, 680px);
  max-height: min(92dvh, 680px);
  height: auto;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 60px rgba(11, 29, 51, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  animation: cardIn 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards;
  text-align: left;
}

.tutorial-card::before {
  content: '';
  position: absolute;
  top: 3px; left: 3px; right: 3px; bottom: 3px;
  border: 1px solid rgba(138, 111, 62, 0.18);
  border-radius: calc(var(--radius-lg) - 3px);
  pointer-events: none;
  z-index: 1;
}

.tutorial-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem 0.75rem 1.4rem;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.tutorial-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Playfair Display", "Times New Roman", Times, serif;
  font-weight: bold;
  font-size: 1.15rem;
  letter-spacing: 1px;
  color: var(--text-primary);
}

.tutorial-logo {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.tutorial-close {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tutorial-close:hover {
  background: #fdf2f2;
  border-color: rgba(112, 28, 28, 0.4);
  color: var(--danger-color);
  transform: rotate(90deg);
}

.tutorial-progress {
  display: flex;
  gap: 0.3rem;
  padding: 0.85rem 1.4rem 0;
  flex-shrink: 0;
}

.tutorial-progress-seg {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.3s;
}

.tutorial-progress-seg.done {
  background: var(--text-primary);
}

.tutorial-progress-seg.current {
  background: var(--accent-color);
  box-shadow: 0 0 0 1px rgba(138, 111, 62, 0.3);
}

.tutorial-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 1.5rem 1.75rem;
}

.tutorial-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  text-align: center;
}

.tutorial-icon {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.3rem;
  border-radius: 50%;
  background: rgba(11, 29, 51, 0.05);
  border: 1.5px solid var(--border-color);
  box-shadow: inset 0 0 0 4px #fff, 0 6px 16px rgba(11, 29, 51, 0.1);
  animation: iconBounce 0.5s ease-out forwards;
  flex-shrink: 0;
}

.tutorial-title {
  font-size: 1.25rem;
  color: var(--text-primary);
  line-height: 1.3;
}

.tutorial-text {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
}

.tutorial-text p {
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.tutorial-visual {
  margin-top: 0.5rem;
  width: 100%;
}

/* Welcome visual */
.visual-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0 0.25rem 0;
}

.visual-pig {
  width: 92px;
  height: auto;
  animation: pigBounce 1.6s ease-in-out infinite;
}

.visual-chip-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
}

.visual-chip {
  font-size: 0.72rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  background: rgba(30, 70, 37, 0.08);
  color: var(--success-color);
  border: 1px solid rgba(30, 70, 37, 0.2);
}

.visual-chip.chip-gold {
  background: rgba(138, 111, 62, 0.08);
  color: var(--accent-color);
  border-color: rgba(138, 111, 62, 0.25);
}

.visual-chip.chip-purple {
  background: rgba(90, 40, 130, 0.1);
  color: #5a2882;
  border-color: rgba(90, 40, 130, 0.2);
}

/* Fund visual */
.visual-fund {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0.5rem;
  background: #fcfbf8;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.fund-mini-bar {
  height: 12px;
  background: var(--border-color);
  border-radius: 999px;
  overflow: hidden;
}

.fund-mini-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--success-color), #2d6a4f);
  animation: fillGrow 1s ease-out forwards;
}

.fund-mini-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
  gap: 0.3rem;
}

.fund-mini-labels .text-bold {
  color: var(--success-color);
}

/* Reverse logic visual */
.visual-reverse {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.75rem;
  background: linear-gradient(180deg, #fcfbf8, #f4f1e9);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.reverse-flow {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.35rem;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.8rem;
  text-align: left;
}

.flow-node-warn {
  border-color: rgba(112, 28, 28, 0.35);
  background: #fdf7f7;
}

.flow-node-ok {
  border-color: rgba(30, 70, 37, 0.3);
  background: #f4fbf6;
}

.flow-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.flow-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--text-primary);
  flex: 1;
}

.flow-sub {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-align: right;
}

.flow-sub-danger {
  color: var(--danger-color);
  font-weight: bold;
}

.flow-arrow {
  text-align: center;
  color: var(--accent-color);
  font-size: 1rem;
  line-height: 1;
  font-weight: bold;
}

.reverse-caption {
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--text-secondary);
  border-top: 1px dashed var(--border-color);
  padding-top: 0.6rem;
}

.tutorial-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1.4rem 1.2rem 1.4rem;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  background: #fff;
}

.tutorial-skip {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: bold;
  padding: 0.5rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 92px;
}

.tutorial-skip:hover {
  background: rgba(11, 29, 51, 0.05);
  color: var(--text-primary);
}

.tutorial-next {
  background: var(--text-primary);
  color: #faf9f5;
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 0.5rem 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 92px;
}

.tutorial-next:hover {
  background: var(--accent-color);
}

.tutorial-dots {
  display: flex;
  gap: 0.35rem;
}

.tutorial-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.25s;
}

.tutorial-dot.active {
  background: var(--accent-color);
  transform: scale(1.3);
}

/* Transitions */
.tut-next-enter-active,
.tut-next-leave-active,
.tut-prev-enter-active,
.tut-prev-leave-active {
  transition: all 0.28s ease-out;
}

.tut-next-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.tut-next-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

.tut-prev-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.tut-prev-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

/* Animations */
@keyframes overlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(22px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes iconBounce {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); }
}

@keyframes pigBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes fillGrow {
  from { width: 0; }
}

/* Small screens */
@media (max-width: 600px) {
  .tutorial-overlay {
    padding: 0.75rem;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    padding-top: calc(0.75rem + env(safe-area-inset-top, 0px));
    padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
    align-items: flex-end;
  }

  .tutorial-card {
    width: 100%;
    max-height: 94vh;
    max-height: 94dvh;
    border-radius: var(--radius-lg);
  }

  .tutorial-header {
    padding: 0.9rem 1rem 0.6rem 1rem;
  }

  .tutorial-progress {
    padding: 0.7rem 1rem 0;
  }

  .tutorial-body {
    padding: 1.1rem 1.15rem;
  }

  .tutorial-icon {
    width: 64px;
    height: 64px;
    font-size: 1.9rem;
  }

  .tutorial-title {
    font-size: 1.1rem;
  }

  .tutorial-text p {
    font-size: 0.9rem;
  }

  .tutorial-footer {
    padding: 0.75rem 1rem 1rem 1rem;
  }

  .tutorial-skip,
  .tutorial-next {
    font-size: 0.75rem;
    padding: 0.45rem 0.6rem;
    min-width: 76px;
  }

  .flow-label {
    font-size: 0.8rem;
  }

  .flow-sub {
    font-size: 0.68rem;
  }
}

@media (max-width: 380px) {
  .tutorial-dots {
    display: none;
  }

  .tutorial-footer {
    justify-content: space-between;
  }
}

@media (max-height: 560px) {
  .tutorial-card {
    max-height: 96vh;
    max-height: 96dvh;
  }

  .tutorial-icon {
    width: 48px;
    height: 48px;
    font-size: 1.4rem;
  }

  .tutorial-body {
    padding: 0.8rem 1rem;
  }

  .tutorial-footer {
    padding-top: 0.6rem;
    padding-bottom: 0.8rem;
  }

  .tutorial-title {
    font-size: 1rem;
  }

  .tutorial-text p {
    font-size: 0.85rem;
  }
}

@media (max-width: 600px) and (max-height: 480px) {
  .tutorial-progress {
    display: none;
  }

  .tutorial-header {
    padding-top: 0.6rem;
    padding-bottom: 0.4rem;
  }
}
</style>