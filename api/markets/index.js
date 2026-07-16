import { handleOptions, setCorsHeaders } from '../_lib/cors.js'

const YAHOO_QUOTE = 'https://query2.finance.yahoo.com/v7/finance/quote'
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart'
const AWESOME_API = 'https://economia.awesomeapi.com.br/json/last'
const COINGECKO = 'https://api.coingecko.com/api/v3/simple/price'

const NYSE_SET = new Set([
  'BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA','XOM','CVX','PG','PEP','PFE','MRK',
  'MCD','CAT','GE','IBM','HD','UNH','HON','LMT','RTX','LOW','T','ABBV',
  'PLD','AMT','EQIX','CCI','WELL','PSA','SPG','DLR','O','VICI','WPC','STAG','IRM',
  'AVB','EQR','MMM','TRV','AXP','NKE','BLK','BX','GS','MA','CVS','AMGN','LLY','BMY',
  'UNP','UPS','MDLZ','MO','ESS','MAA','UDR','CPT','INVH','CRH','FLTR',
  'BAC','C','WFC','SPGI','SCHW','EL','CL','TGT','CI','WM','ALL','PRU','MET',
  'SNOW','SNAP','SQ','SHOP','PLTR','PINS','BAX','MDT','SYK','BSX','ZBH',
  'CSX','NSC','RSG','EW','MMC','CB','APD','ECL','NEM','FCX'
])

const REIT_SET = new Set([
  'PLD','AMT','EQIX','CCI','WELL','PSA','SPG','DLR','O','VICI',
  'WPC','STAG','IRM','AVB','EQR','ESS','MAA','UDR','CPT','INVH',
  'SU','ARE','BXP','KIM','FRT','REG','SLG','WELL'
])

const ETF_SET = new Set([
  'IVVB11','BOVA11','SMAL11','SPXI11','FIXA11','IMAB11','PIBB11','XINA11','GOLD11',
  'QBTC11','HASH11','BITH11','CRPT11','BRAX11','DIVO11','MOAT11','MATB11','BIOM11',
  'SOLAR11','NFTS11','USDB11','EURB11','ACWI11','NASD11','SPYI11',
  'SPY','QQQ','IVV','VOO','VTI','BND','VXUS','IWM','XLK','XLF','XLE','XLV','XLI',
  'GLD','SLV','TLT','AGG','VNQ','LQD','HYG','EFA','EWJ','EWZ','EEM','ACWI','VEU','AAXJ',
  'ARKK','ARKW','ARKG','TQQQ','SQQQ','SOXX','SMH','IBB','XBI','KRE'
])

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { symbols, chart, range } = req.query

  if (chart) {
    const data = await fetchJSON(`${YAHOO_CHART}/${chart}?range=${range || '1mo'}&interval=1d`)
    return res.json(data || { error: 'Chart data not available' })
  }

  const list = symbols ? symbols.split(',').map(s => s.trim()).filter(Boolean) : ALL_SYMBOLS

  const [stocks, forex, crypto] = await Promise.all([
    fetchQuotes(list),
    fetchForex(),
    fetchJSON(`${COINGECKO}?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,avalanche-2,chainlink&vs_currencies=usd&include_24hr_change=true`)
  ])

  return res.json({ stocks, forex: forex || {}, crypto: crypto || {} })
}

async function fetchJSON(url) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 10000)
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json,text/html,*/*',
        'Referer': 'https://finance.yahoo.com/'
      },
      signal: ac.signal
    })
    clearTimeout(timer)
    return r.ok ? await r.json() : null
  } catch { clearTimeout(timer); return null }
}

async function fetchForex() {
  const data = await fetchJSON(`${AWESOME_API}/USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL`)
  if (data && (data.USDBRL || data.EURBRL || data.GBPBRL || data.JPYBRL)) return data
  const [usd, eur, gbp, jpy] = await Promise.all([
    fetchJSON(`${AWESOME_API}/USD-BRL`),
    fetchJSON(`${AWESOME_API}/EUR-BRL`),
    fetchJSON(`${AWESOME_API}/GBP-BRL`),
    fetchJSON(`${AWESOME_API}/JPY-BRL`)
  ])
  return { ...(usd || {}), ...(eur || {}), ...(gbp || {}), ...(jpy || {}) }
}

function classify(symbol, exchange) {
  const s = symbol.toUpperCase().replace('.SA','').replace('.IR','').replace('.L','')
  if (ETF_SET.has(s)) return 'ETFs'
  if (REIT_SET.has(s) && exchange !== 'B3') return 'REITs'
  if (s.endsWith('11') && exchange === 'B3') return 'FIIs'
  return 'Ações'
}

function getExchange(symbol) {
  const s = symbol.toUpperCase()
  if (s.endsWith('.SA')) return 'B3'
  if (s.endsWith('.IR') || s.endsWith('.L')) return 'IRL'
  if (NYSE_SET.has(s)) return 'NYSE'
  return 'NASDAQ'
}

function getCurrency(exchange) {
  if (exchange === 'B3') return 'BRL'
  if (exchange === 'IRL') return 'EUR'
  return 'USD'
}

async function fetchQuotes(symbols) {
  const results = []
  const batchSize = 50

  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const url = `${YAHOO_QUOTE}?symbols=${batch.join(',')}`
    const data = await fetchJSON(url)

    if (data?.quoteResponse?.result?.length) {
      for (const q of data.quoteResponse.result) {
        const exchange = getExchange(q.symbol)
        results.push(formatQuote(q, exchange))
      }
    } else {
      const fallback = await fetchQuotesChart(batch)
      results.push(...fallback)
    }
  }

  return results
}

function formatQuote(q, exchange) {
  return {
    symbol: q.symbol,
    exchange,
    assetType: classify(q.symbol, exchange),
    shortName: q.shortName || q.symbol,
    longName: q.longName || '',
    price: q.regularMarketPrice ?? q.regularMarketPreviousClose ?? 0,
    change: q.regularMarketChange ?? 0,
    changePercent: q.regularMarketChangePercent ?? 0,
    prevClose: q.regularMarketPreviousClose ?? q.regularMarketPrice ?? 0,
    open: q.regularMarketOpen ?? 0,
    high: q.regularMarketDayHigh ?? 0,
    low: q.regularMarketDayLow ?? 0,
    volume: q.regularMarketVolume ?? 0,
    marketCap: q.marketCap ?? 0,
    bid: q.bid ?? null,
    ask: q.ask ?? null,
    marketState: q.marketState || 'CLOSED',
    currency: getCurrency(exchange)
  }
}

async function fetchQuotesChart(symbols) {
  const results = []
  for (let i = 0; i < symbols.length; i += 30) {
    const batch = symbols.slice(i, i + 30)
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        const data = await fetchJSON(`${YAHOO_CHART}/${symbol}?range=2d&interval=1d`)
        if (!data?.chart?.result?.[0]) return null
        const meta = data.chart.result[0].meta
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
          currency: getCurrency(exchange)
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
  // NASDAQ (50)
  'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','NFLX','AVGO','ADBE',
  'CRM','INTC','AMD','QCOM','CSCO','AMAT','MU','PYPL','ASML','COST',
  'PEP','NKE','SBUX','GILD','TMUS',
  'ARM','DDOG','CRWD','PANW','WDAY','MRNA','ISRG','VRTX','REGN','ADI',
  'TXN','ABNB','DASH','COIN','MDB','FTNT','ROKU','HOOD','MELI','WBD',
  'RIVN','LCID','AFRM','U','ZS',

  // NYSE (50)
  'BRK-B','JPM','V','JNJ','WMT','KO','DIS','BA','XOM','CVX',
  'PG','PFE','MRK','MCD','CAT','GE','IBM','HD','UNH','HON',
  'LMT','RTX','LOW','T','ABBV',
  'BLK','GS','MS','BAC','C','WFC','SPGI','SCHW','AXP','EL',
  'CL','TGT','CI','WM','ALL','PRU','MET','SNOW','SNAP','SQ',
  'SHOP','PLTR','PINS','BAX','SYK',

  // B3 Ações (50)
  'PETR4.SA','VALE3.SA','ITUB4.SA','BBAS3.SA','BBDC4.SA','ABEV3.SA','WEGE3.SA','ELET3.SA',
  'JBSS3.SA','RENT3.SA','LREN3.SA','MGLU3.SA','AZUL4.SA','EMBR3.SA','SUZB3.SA','CSNA3.SA',
  'GGBR4.SA','GOAU4.SA','CMIG4.SA','BBSE3.SA','EGIE3.SA','TAEE3.SA','SANB11.SA','BRKM5.SA','RADL3.SA',
  'ITSA4.SA','CPLE6.SA','ENGI11.SA','NEOE3.SA','ALOS3.SA','CASH3.SA','ARZZ3.SA',
  'VIVA3.SA','PSSA3.SA','SULA11.SA','ODPV3.SA','HAPV3.SA','PRIO3.SA','RECV3.SA',
  'PETR3.SA','USIM5.SA','BRAP4.SA','VIVT3.SA','TIMS3.SA','KLBN11.SA','ENEV3.SA','EQTL3.SA','COGN3.SA',

  // B3 FIIs (50)
  'KNRI11.SA','HGLG11.SA','XPLG11.SA','MXRF11.SA','BCFF11.SA','KNCR11.SA','KNIP11.SA',
  'VGIP11.SA','VGHF11.SA','VRTA11.SA','MCCI11.SA','CPTS11.SA','HFOF11.SA','RBRR11.SA',
  'IRDM11.SA','JSRE11.SA','KNHY11.SA','MGFF11.SA','CVBI11.SA','BTLG11.SA',
  'CPLG11.SA','TRXF11.SA','XPML11.SA','GSFI11.SA','CPUR11.SA','RBRF11.SA','TORD11.SA',
  'VILG11.SA','HSML11.SA','LVBI11.SA',
  'RCRB11.SA','RBVA11.SA','KNSC11.SA','KNUQ11.SA','SDIL11.SA','VISC11.SA',
  'TGAR11.SA','ALZR11.SA','RZTR11.SA','XPCI11.SA','SNLG11.SA','RECR11.SA','FEXC11.SA',
  'RURB11.SA','RBRL11.SA','RBRP11.SA','RBRY11.SA','SADI11.SA','BRCO11.SA','PABY11.SA',

  // B3 ETFs (25)
  'IVVB11.SA','BOVA11.SA','SMAL11.SA','SPXI11.SA','FIXA11.SA','IMAB11.SA','PIBB11.SA',
  'XINA11.SA','GOLD11.SA','QBTC11.SA','HASH11.SA','BITH11.SA','CRPT11.SA','BRAX11.SA',
  'DIVO11.SA','MOAT11.SA','MATB11.SA','BIOM11.SA','SOLAR11.SA','NFTS11.SA',
  'USDB11.SA','EURB11.SA','ACWI11.SA','NASD11.SA','SPYI11.SA',

  // US ETFs (25)
  'SPY','QQQ','IVV','VOO','VTI','BND','VXUS','IWM','XLK','XLF',
  'GLD','SLV','TLT','AGG','VNQ','XLE','LQD','HYG','EFA','EWJ',
  'EWZ','EEM','ACWI','ARKK','TQQQ',

  // US REITs (25)
  'PLD','AMT','EQIX','CCI','WELL','PSA','SPG','DLR','O','VICI',
  'WPC','STAG','IRM','AVB','EQR','ESS','MAA','UDR','CPT','INVH',
  'ARE','BXP','KIM','FRT','REG',

  // Ireland (30)
  'KRX.L','RYA.L','DCC.L','GL9.IR','A5G.IR','BIRG.IR','KRZ.L','IRES.IR',
  'DHG.IR','EG7.IR','IR5B.IR','MLC.L','PTSB.IR','KMR.L','GVR.IR',
  'GRP.IR','OIZ.IR','HMSO.L','BME.L','HIK.L',
  'CNA.L','SGRO.L','LAND.L','III.L','ADM.L','RRS.L','FRES.L','POLY.L','CCH.L','FERG.L'
]
