/* global describe, it, expect
 */

const fetch = require('node-fetch')
const { createInfoServer, startProxyCLI } = require('./util')

describe('CLI commands', () => {
  it('should load rules from a file', async () => {
    const s1 = await createInfoServer()
    const proxy = await startProxyCLI([
      { pathname: '/blog/**', dest: s1.url }
    ])

    const res = await fetch('http://localhost:9000/blog/hello')
    const data = await res.json()
    expect(data.url).toBe('/blog/hello')

    s1.close()
    proxy.close()
  })

  it('should listen to a given port', async () => {
    const s1 = await createInfoServer()
    const proxy = await startProxyCLI([
      { pathname: '/blog/**', dest: s1.url }
    ], ['-p', '8090'])

    const res = await fetch('http://localhost:8090/blog/hello')
    const data = await res.json()
    expect(data.url).toBe('/blog/hello')

    s1.close()
    proxy.close()
  })
})
