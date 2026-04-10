import puppeteer, { Browser } from 'puppeteer'
import { execSync } from 'child_process'

function getChromiumPath(): string | undefined {
  // Use system Chromium on Linux (VPS) to avoid missing shared libraries
  if (process.platform === 'linux') {
    const candidates = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ]
    for (const path of candidates) {
      try {
        execSync(`test -f ${path}`)
        return path
      } catch {
        // not found, try next
      }
    }
  }
  return undefined // let Puppeteer use its bundled Chrome on Mac/Windows
}

export async function launchBrowser(): Promise<Browser> {
  const executablePath = getChromiumPath()
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}
