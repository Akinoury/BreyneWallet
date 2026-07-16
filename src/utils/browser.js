import { Capacitor } from '@capacitor/core'

export async function openInAppBrowser(url) {
  if (Capacitor.isNativePlatform()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url, presentationStyle: 'popover' })
  } else {
    window.open(url, '_blank')
  }
}
