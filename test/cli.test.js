/* global describe, it, expect
 */

const fetch = require('node-fetch')
const { createInfoServer, startProxyCLI } = require('./util')

describe('CLI commands', () => {
  it('should load rules from a file', async () => {
    const s1 = await createInfoServer()
    const proxy = await startProxyCLI([
      { pathname: '/blog/**', dest: s1.url },
      { pathname: '/hello', dest: './test/fixtures/micro-example.js' }
    ])

    const res1 = await fetch('http://localhost:9000/blog/hello')
    const data1 = await res1.json()
    expect(data1.url).toBe('/blog/hello')

    const res2 = await fetch('http://localhost:9000/hello')
    const data2 = await res2.json()
    expect(data2.message).toBe('hello world')

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
