import { Capacitor } from '@capacitor/core'

const DAILY_NOTIFICATION_ID = 100
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

let monthNames = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

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
          schedule: { at: scheduled, repeat: { every: 'day' } },
          channelId: 'breyne-daily',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Failed to schedule daily notification:', e)
    }
  }

  async notifyLimitExceeded(exceededValue, totalExpenses) {
    if (!isAndroid() || !this.enabled) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const message = pickNextMessage(LIMIT_EXCEEDED_MESSAGES)
      const body = `${message} Excedente: R$ ${Number(exceededValue).toFixed(2)}`

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'Limite de Consumo Excedido',
          body,
          schedule: { at: new Date(Date.now() + 1500) },
          channelId: 'breyne-alerts',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Failed to notify limit exceeded:', e)
    }
  }

  async notifyHealthGood() {
    if (!isAndroid() || !this.enabled) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const message = pickNextMessage(HEALTH_GOOD_MESSAGES)

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'Saude Financeira',
          body: message,
          schedule: { at: new Date(Date.now() + 1500) },
          channelId: 'breyne-alerts',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Failed to notify health good:', e)
    }
  }

  async notifyNearLimit(consumptionPercent) {
    if (!isAndroid() || !this.enabled) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const message = pickNextMessage(NEAR_LIMIT_MESSAGES)
      const body = `${message} (${Number(consumptionPercent).toFixed(1)}% do limite utilizado)`

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'Aviso de Consumo',
          body,
          schedule: { at: new Date(Date.now() + 1500) },
          channelId: 'breyne-alerts',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Failed to notify near limit:', e)
    }
  }

  async sendFinancialTip() {
    if (!isAndroid() || !this.enabled) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const message = pickNextMessage(FINANCIAL_TIPS)

      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'Dica Financeira',
          body: message,
          schedule: { at: new Date(Date.now() + 1500) },
          channelId: 'breyne-tips',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Failed to send tip:', e)
    }
  }

  async checkAndNotify(store) {
    if (!isAndroid() || !this.enabled) return
    const exceeded = Number(store.exceededValue) || 0
    const limit = Number(store.limitConsumption) || 0
    const current = Number(store.consumoAtual) || 0

    if (exceeded > 0) {
      await this.notifyLimitExceeded(exceeded, current)
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
    if (!isAndroid()) return
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: 'BreyneWallet',
          body: 'Notificacoes funcionando!',
          schedule: { at: new Date(Date.now() + 2000) },
          channelId: 'breyne-daily',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher_round'
        }]
      })
    } catch (e) {
      console.warn('Test notification failed:', e)
    }
  }
}

export const notificationService = new NotificationService()
