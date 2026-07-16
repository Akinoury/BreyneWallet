import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

const YAHOO = 'https://query1.finance.yahoo.com/v8/finance/chart'
const AWESOME_API = 'https://economia.awesomeapi.com.br/last'
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { symbols, chart, range } = req.query

  if (chart) {
    const data = await fetchJSON(`${YAHOO}/${chart}?range=${range || '1mo'}&interval=1d`)
    return res.json(data || { error: 'Chart data not available' })
  }

  const list = symbols ? symbols.split(',').map(s => s.trim()).filter(Boolean) : ALL_SYMBOLS
  const stocks = await fetchQuotes(list)
  const [forex, crypto] = await Promise.all([
    fetchJSON(`${AWESOME_API}/USD-BRL,EUR-BRL,JPY-BRL`),
    fetchJSON(`${COINGECKO}?ids=bitcoin,ethereum,binancecoin&vs_currencies=brl&include_24hr_change=true`)
  ])

  return res.json({ stocks, forex: forex || {}, crypto: crypto || {} })
}

async function fetchJSON(url) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 10000)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: ac.signal
    })
    clearTimeout(timer)
    return r.ok ? await r.json() : null
  } catch { clearTimeout(timer); return null }
}

function classify(symbol, exchange) {
  const s = symbol.toUpperCase().replace('.SA','').replace('.IR','').replace('.L','')
  if (s.endsWith('11')) return exchange === 'B3' ? 'FIIs' : 'REITs'
  if (['IVVB11','BOVA11','SMAL11','SPXI11','FIXA11','IMAB11','PIBB11','XINA11','GOLD11','QBTC11','HASH11','BITH11','CRPT11','BRAX11','DIVO11','MOAT11'].includes(s)) return 'ETFs'
  return 'Ações'
}

function getExchange(symbol) {
  const s = symbol.toUpperCase()
  if (s.endsWith('.SA')) return 'B3'
  if (s.endsWith('.IR')) return 'IRL'
  if (s.endsWith('.L')) return 'IRL'
  const nyse = ['BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA','XOM','CVX','PG','PEP','PFE','MRK','MCD','CAT','GE','IBM','MMM','TRV','AXP','HD','NKE','UNH','HON']
  if (nyse.includes(s)) return 'NYSE'
  return 'NASDAQ'
}

function getCurrency(exchange) {
  if (exchange === 'B3') return 'BRL'
  if (exchange === 'IRL') return 'EUR'
  return 'USD'
}

async function fetchQuotes(symbols) {
  const results = []
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5)
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        const data = await fetchJSON(`${YAHOO}/${symbol}?range=5d&interval=1d`)
        if (!data?.chart?.result?.[0]) return null
        const meta = data.chart.result[0].meta
        const quotes = data.chart.result[0].indicators?.quote?.[0]
        const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0
        const prevClose = meta.chartPreviousClose ?? price
        const change = price - prevClose
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
        const exchange = getExchange(symbol)
        return {
          symbol: symbol.toUpperCase(),
          exchange,
          assetType: classify(symbol, exchange),
          shortName: meta.shortName || symbol,
          longName: meta.longName || '',
          price,
          change,
          changePercent,
          prevClose,
          open: meta.regularMarketOpen || 0,
          high: meta.regularMarketDayHigh || 0,
          low: meta.regularMarketDayLow || 0,
          volume: meta.regularMarketVolume || 0,
          marketCap: meta.marketCap || 0,
          bid: meta.bid || null,
          ask: meta.ask || null,
          marketState: meta.marketState || 'CLOSED',
          currency: getCurrency(exchange),
          logo: meta.logourl || ''
        }
      })
    )
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value)
    }
  }
  return results
}

const ALL_SYMBOLS = [
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','NFLX','AVGO','ADBE','CRM','INTC','AMD','QCOM','CSCO','AMAT','MU','ZM','SNAP','PYPL',
  'BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA','XOM','CVX','PG','PEP','PFE','MRK','MCD','CAT','GE','IBM','MMM','HD',
  'PETR4.SA','VALE3.SA','ITUB4.SA','BBAS3.SA','BBDC4.SA','ABEV3.SA','WEGE3.SA','ELET3.SA','JBSS3.SA','RENT3.SA','LREN3.SA','MGLU3.SA','AZUL4.SA','EMBR3.SA','SUZB3.SA','CSNA3.SA','GGBR4.SA','GOAU4.SA','CMIG4.SA','BBSE3.SA',
  'KNRI11.SA','HGLG11.SA','XPLG11.SA','MXRF11.SA','BCFF11.SA','KNCR11.SA','KNIP11.SA','VGIP11.SA','VGHF11.SA','VRTA11.SA','MCCI11.SA','CPTS11.SA','HFOF11.SA','RBRR11.SA','IRDM11.SA','JSRE11.SA','KNHY11.SA','MGFF11.SA','CVBI11.SA','BTLG11.SA',
  'IVVB11.SA','BOVA11.SA','SMAL11.SA','SPXI11.SA','FIXA11.SA','IMAB11.SA','PIBB11.SA','XINA11.SA','GOLD11.SA','QBTC11.SA','HASH11.SA','BITH11.SA','CRPT11.SA','BRAX11.SA','DIVO11.SA','MOAT11.SA',
  'CRH','DCC','KRX','FLTR','IQQQ.IR','ISF.IR','JAM.L','RCP.L','GVC.L','BME.L','HIK.L','PPB.L','MNP.L','PZC.L'
]
