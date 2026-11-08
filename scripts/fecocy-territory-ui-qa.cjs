const { createRequire } = require('node:module')
const path = require('node:path')
const fs = require('node:fs/promises')
const assert = require('node:assert/strict')
// Existing test tooling is read only. No install or edits in another repository.
const testRequire = createRequire(path.resolve('../fecot-managment/package.json'))
const { build } = testRequire('esbuild'), { chromium } = testRequire('@playwright/test')
async function cssFiles(directory) {
  const css = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) css.push(...await cssFiles(path.join(directory, entry.name)))
    else if (entry.name.endsWith('.css')) css.push(await fs.readFile(path.join(directory, entry.name), 'utf8'))
  }
  return css
}
;(async () => {
  await fs.mkdir('test-results/fecocy', { recursive: true })
  const bundle = await build({ entryPoints: ['tests/fecocy/ui-entry.tsx'], bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'isolated-next', setup(builder) { builder.onResolve({ filter: /^next\/(navigation|link)$/ }, () => ({ path: path.resolve('tests/fecocy/navigation-shim.tsx') })) } }] })
  const css = (await cssFiles('.next/static')).join('\n')
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', route => route.request().isNavigationRequest() ? route.fulfill({ contentType: 'text/html', body: '<html lang="fr"><body><div id="root"></div></body></html>' }) : route.abort())
    await page.goto('http://fecocy-qa.test/')
    await page.addStyleTag({ content: css }); await page.addScriptTag({ content: bundle.outputFiles[0].text })
    await page.getByRole('heading', { name: 'Ligues', exact: true }).waitFor()
    const list = page.locator('div:not([hidden]) > [data-slot="table-container"]')
    void list
    assert.equal(await page.locator('tbody tr').count(), 10)
    assert.equal(await page.locator('tbody tr:first-child td:first-child').textContent(), '01')
    assert.equal(await page.locator('tbody').getByText('Non renseigné', { exact: true }).count(), 10)
    assert.equal(await page.getByRole('button', { name: /Ajouter|Modifier/ }).count(), 0)
    await page.getByRole('button', { name: 'Page suivante' }).click()
    assert.equal(await page.locator('tbody tr:first-child td:first-child').textContent(), '11')
    await page.getByRole('button', { name: 'Page suivante' }).click()
    assert.equal(await page.locator('tbody tr').count(), 6)
    await page.getByPlaceholder('Rechercher une ligue...').fill('KINSHASA')
    assert.equal(await page.locator('tbody tr').count(), 1)
    await page.getByRole('button', { name: /Voir LIGUE DE CYCLISME.*KINSHASA/ }).click()
    await page.getByRole('heading', { name: /Fiche Ligue.*KINSHASA/ }).waitFor()
    await page.getByText('Informations générales', { exact: true }).waitFor()
    assert.equal(await page.getByText('01', { exact: true }).filter({ visible: true }).count(), 1)
    assert.equal(await page.getByText('KINSHASA', { exact: true }).filter({ visible: true }).count(), 1)
    await page.getByText('Ententes liées', { exact: true }).last().waitFor()
    assert.equal(await page.getByText('Aucune donnée trouvée', { exact: true }).filter({ visible: true }).count(), 2)
    await page.screenshot({ path: 'test-results/fecocy/league-01.png', fullPage: true })
    await page.getByRole('button', { name: 'Retour à la liste' }).click()
    assert.equal(await page.getByPlaceholder('Rechercher une ligue...').inputValue(), 'KINSHASA')
    await page.getByPlaceholder('Rechercher une ligue...').fill('')
    await page.getByRole('combobox', { name: 'Province', exact: true }).click()
    await page.getByRole('option', { name: 'KWANGO', exact: true }).click()
    assert.equal(await page.locator('tbody tr').count(), 1)
    assert.equal(await page.locator('tbody tr:first-child td:first-child').textContent(), '02')
    await page.screenshot({ path: 'test-results/fecocy/leagues.png', fullPage: true })
    for (const kind of ['ententes', 'clubs']) {
      await page.evaluate(kind => window.fecocyRender(kind), kind)
      await page.getByRole('heading', { name: kind === 'clubs' ? 'Clubs' : 'Ententes', exact: true }).waitFor()
      await page.getByText('Aucune donnée trouvée', { exact: true }).filter({ visible: true }).waitFor()
      await page.screenshot({ path: `test-results/fecocy/${kind}-empty.png`, fullPage: true })
    }
    await page.evaluate(() => window.fecocyRender('ligues'))
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('heading', { name: 'Ligues', exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    await page.screenshot({ path: 'test-results/fecocy/leagues-mobile.png', fullPage: true })
    assert.deepEqual(errors, [])
    console.log('FECOCY real-capture UI: 26 IDs, league 01 Kinshasa detail, empty children, search/filter/pagination/state/mobile passed. No remote requests or writes.')
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
