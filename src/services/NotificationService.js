import { Capacitor } from '@capacitor/core'

const DAILY_NOTIFICATION_ID = 100
let nextImmediateId = 200
const STORAGE_KEY_ENABLED = 'breyne_notifications_enabled'
const STORAGE_KEY_HOUR = 'breyne_notifications_hour'
const STORAGE_KEY_LAST_MESSAGE_INDEX = 'breyne_notifications_last_index'

const MORNING_MESSAGES = [
  'Hora de revisar suas finanças!',
  'Organize seus gastos hoje.',
  'Que tal atualizar sua carteira?',
  'Mantenha o foco nos seus objetivos financeiros.',
  'Pequenas economias hoje, grandes conquistas amanhã.',
  'Reserve um momento para cuidar do seu orçamento.',
  'Você está no controle da sua vida financeira!',
  'Acompanhe seus investimentos e veja seu patrimônio crescer.',
  'Registre suas despesas do dia para manter o controle.',
  'Planeje seus gastos e evite surpresas no fim do mês.',
  'Sua jornada financeira começa com um passo por dia.',
  'Revise suas metas financeiras e mantenha o rumo.',
  'Um minuto organizando suas contas hoje evita dores de cabeça.',
  'Que tal verificar se está dentro do orçamento hoje?',
  'Cada real bem administrado é um passo para a liberdade financeira.',
  'Hoje é um ótimo dia para revisar seus limites de consumo.',
  'Acompanhe de perto seus gastos e mantenha a saúde financeira.',
  'Seu futuro agradece cada decisão financeira consciente.',
  'Que tal dar uma olhada nas suas transações recentes?',
  'Mantenha a disciplina financeira e colha os frutos.'
]

const EVENING_MESSAGES = [
  'Como foi seu dia financeiro? Faça um resumo rápido.',
  'Antes de dormir, confira se registrou todos os gastos do dia.',
  'Balanço do dia: seus gastos estão dentro do planejado?',
  'Aproveite para revisar suas despesas do dia.',
  'Que tal planejar os gastos de amanhã hoje?',
  'Um resumo noturno das finanças ajuda a manter o controle.',
  'Confira se alguma transação ficou pendente de registro.',
  'Seu orçamento agradece quando você revisa antes de dormir.',
  'A tranquilidade financeira vem com a organização diária.',
  'Prepare o terreno para um mês financeiramente saudável.'
]

const LIMIT_EXCEEDED_MESSAGES = [
  'Seus gastos ultrapassaram o limite de consumo!',
  'Atenção: você excedeu o orçamento disponível.',
  'Seus gastos estão acima do permitido. Hora de reavaliar!',
  'Limite de consumo ultrapassado! Revise suas despesas.',
  'Alerta: você está gastando mais do que o planejado.',
  'Excedente de consumo detectado. Considere cortar gastos.',
  'Cuidado! As despesas estão acima do limite estabelecido.',
  'Seu orçamento foi estourado. Reveja seus hábitos.',
  'Os gastos atuais superam o limite. Ajuste a rota!'
]

const HEALTH_GOOD_MESSAGES = [
  'Sua saúde financeira está em dia!',
  'Continue assim! Suas finanças estão equilibradas.',
  'Você está dentro do orçamento. Ótimo trabalho!',
  'Suas contas estão sob controle. Continue mantendo esse ritmo.',
  'Parabéns! Sua gestão financeira está no caminho certo.',
  'Tudo nos conformes. Sua carteira está saudável.',
  'Excelente! Você está no azul e no controle.',
  'Finanças em ordem — é assim que se constroi patrimonio.',
  'Você esta gerenciando bem seus recursos. Parabéns!'
]

const NEAR_LIMIT_MESSAGES = [
  'Atenção: você está se aproximando do limite de consumo.',
  'Gastos controlados, mas o limite esta proximo. Atencao redobrada.',
  'Voce ja utilizou grande parte do orcamento. Planeje com cuidado.',
  'Fique de olho! O limite de consumo esta quase sendo atingido.',
  'Consumo proximo do teto. Hora de pisar no freio.'
]

const FINANCIAL_TIPS = [
  'Separe sempre uma parte da sua renda para investimentos.',
  'Evite compras por impulso — espere 24 horas antes de decidir.',
  'Um fundo de emergencia equivalente a 6 meses de despesas traz seguranca.',
  'Diversificar investimentos reduz riscos e aumenta oportunidades.',
  'Registrar todos os gastos, mesmo os pequenos, ajuda a enxergar para onde vai o dinheiro.',
  'Reveja assinaturas e servicos que voce nao usa mais.',
  'Parcelamento pode esconder juros altos. Prefira pagar a vista quando possivel.',
  'Defina metas financeiras claras: curto, medio e longo prazo.',
  'Acompanhe seu score de credito regularmente.',
  'Invista em conhecimento financeiro — e o investimento com maior retorno.'
]

function getLastMessageIndex() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY_LAST_MESSAGE_INDEX)) || -1 } catch { return -1 }
}

function setLastMessageIndex(index) {
  try { localStorage.setItem(STORAGE_KEY_LAST_MESSAGE_INDEX, String(index)) } catch {}
}

function pickNextMessage(array) {
  const lastIndex = getLastMessageIndex()
  let nextIndex
  do {
    nextIndex = Math.floor(Math.random() * array.length)
  } while (nextIndex === lastIndex && array.length > 1)
  setLastMessageIndex(nextIndex)
  return array[nextIndex]
}

function isAndroid() {
  try {
    return Capacitor.getPlatform() === 'android'
  } catch {
    return false
  }
}

class NotificationService {
  get enabled() {
    try { return localStorage.getItem(STORAGE_KEY_ENABLED) !== 'false' } catch { return true }
  }

  set enabled(val) {
    try { localStorage.setItem(STORAGE_KEY_ENABLED, val ? 'true' : 'false') } catch {}
  }

  get notificationHour() {
    try {
      const h = parseInt(localStorage.getItem(STORAGE_KEY_HOUR))
      return h >= 0 && h <= 23 ? h : 9
    } catch { return 9 }
  }

  set notificationHour(h) {
    const clamped = Math.max(0, Math.min(23, h))
    try { localStorage.setItem(STORAGE_KEY_HOUR, String(clamped)) } catch {}
  }

  async requestPermissions() {
    if (!isAndroid()) return false
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.requestPermissions()
      return perm.display === 'granted'
    } catch {
      return false
    }
  }

  async createChannels() {
    if (!isAndroid()) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.createChannel({
        id: 'breyne-daily',
        name: 'Lembretes Diarios',
        description: 'Notificacoes diarias para gerenciar suas financas',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true
      })
      await LocalNotifications.createChannel({
        id: 'breyne-alerts',
        name: 'Alertas Financeiros',
        description: 'Alertas sobre limite de consumo e saude financeira',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true
      })
      await LocalNotifications.createChannel({
        id: 'breyne-tips',
        name: 'Dicas Financeiras',
        description: 'Dicas para melhorar sua gestao financeira',
        importance: 3,
        visibility: 1,
        sound: 'default',
        vibration: false
      })
    } catch (e) {
      console.warn('Failed to create notification channels:', e)
    }
  }

  async initialize() {
    if (!isAndroid()) return
    await this.createChannels()
    const granted = await this.requestPermissions()
    if (granted && this.enabled) {
      await this.scheduleDailyNotification()
    }
  }

  async scheduleDailyNotification() {
    if (!isAndroid() || !this.enabled) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')

      await LocalNotifications.cancel({ notifications: [{ id: DAILY_NOTIFICATION_ID }] })

      const hour = this.notificationHour
      const isMorning = hour >= 5 && hour < 18
      const pool = isMorning ? MORNING_MESSAGES : EVENING_MESSAGES
      const message = pickNextMessage(pool)

      const now = new Date()
      const scheduled = new Date(now)
      scheduled.setHours(hour, 0, 0, 0)
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1)
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: DAILY_NOTIFICATION_ID,
          title: 'BreyneWallet',
          body: message,
          schedule: { at: scheduled, every: 'day' },
          channelId: 'breyne-daily',
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_notification_large'
        }]
      })
    } catch (e) {
      console.warn('Failed to schedule daily notification:', e)
    }
  }

  async checkPermissions() {
    if (!isAndroid()) return { granted: false, reason: 'not-android' }
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()
      return { granted: perm.display === 'granted', detail: perm.display }
    } catch (e) {
      return { granted: false, reason: 'plugin-error', error: e.message }
    }
  }

  async scheduleImmediate(id, title, body, channelId) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [{
          id, title, body, channelId,
          smallIcon: 'ic_stat_notification',
          largeIcon: 'ic_notification_large'
        }]
      })
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message || 'Erro desconhecido' }
    }
  }

  async notifyLimitExceeded(exceededValue) {
    if (!isAndroid() || !this.enabled) return
    const message = pickNextMessage(LIMIT_EXCEEDED_MESSAGES)
    const body = `${message} Excedente: R$ ${Number(exceededValue).toFixed(2)}`
    await this.scheduleImmediate(nextImmediateId++, 'Limite de Consumo Excedido', body, 'breyne-alerts')
  }

  async notifyHealthGood() {
    if (!isAndroid() || !this.enabled) return
    const message = pickNextMessage(HEALTH_GOOD_MESSAGES)
    await this.scheduleImmediate(nextImmediateId++, 'Saude Financeira', message, 'breyne-alerts')
  }

  async notifyNearLimit(consumptionPercent) {
    if (!isAndroid() || !this.enabled) return
    const message = pickNextMessage(NEAR_LIMIT_MESSAGES)
    const body = `${message} (${Number(consumptionPercent).toFixed(1)}% do limite utilizado)`
    await this.scheduleImmediate(nextImmediateId++, 'Aviso de Consumo', body, 'breyne-alerts')
  }

  async sendFinancialTip() {
    if (!isAndroid() || !this.enabled) return
    const message = pickNextMessage(FINANCIAL_TIPS)
    await this.scheduleImmediate(nextImmediateId++, 'Dica Financeira', message, 'breyne-tips')
  }

  async checkAndNotify(storeData) {
    if (!isAndroid() || !this.enabled) return
    const exceeded = Number(storeData.exceededValue) || 0
    const limit = Number(storeData.limitConsumption) || 0
    const current = Number(storeData.consumoAtual) || 0

    if (exceeded > 0) {
      await this.notifyLimitExceeded(exceeded)
    } else {
      await this.notifyHealthGood()
    }

    if (limit > 0 && current < limit && current > 0) {
      const percent = (current / limit) * 100
      if (percent >= 80) {
        await this.notifyNearLimit(percent)
      }
    }
  }

  async cancelAll() {
    if (!isAndroid()) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(n => ({ id: n.id }))
        })
      }
    } catch (e) {
      console.warn('Failed to cancel notifications:', e)
    }
  }

  async reschedule() {
    if (!isAndroid()) return
    await this.cancelAll()
    if (this.enabled) {
      await this.scheduleDailyNotification()
    }
  }

  async sendTestNotification() {
    if (!isAndroid()) return { success: false, error: 'Apenas disponivel no Android' }
    const permCheck = await this.checkPermissions()
    if (!permCheck.granted) {
      const requested = await this.requestPermissions()
      if (!requested) {
        return { success: false, error: `Permissao negada (${permCheck.detail || permCheck.reason}). Va em Configuracoes > Notificacoes e permita.` }
      }
    }
    return await this.scheduleImmediate(nextImmediateId++, 'BreyneWallet', 'Notificacoes funcionando!', 'breyne-daily')
  }
}

export const notificationService = new NotificationService()
