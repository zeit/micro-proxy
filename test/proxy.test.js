/* global describe, it, expect */

const { createInfoServer, fetchProxy } = require('./util')
const listen = require('test-listen')
const createProxy = require('../')

describe('Basic Proxy Operations', () => {
  describe('rules', () => {
    it('should proxy with a exactly matching pathname rule', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/abc', dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/abc')
      expect(data.url).toBe('/abc')

      proxy.close()
      s1.close()
    })

    it('should proxy with a wildcard matching pathname rule', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/abc', dest: 'http://localhost' },
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/blog/hello')
      expect(data.url).toBe('/blog/hello')

      proxy.close()
      s1.close()
    })

    it('should proxy with no pathname as the catch all rule', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/abc', dest: 'http://localhost' },
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/blog/hello')
      expect(data.url).toBe('/blog/hello')

      proxy.close()
      s1.close()
    })

    it('should send 404 if no matching rule found', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/abc', dest: 'http://localhost' }
      ])
      await listen(proxy)

      const { res } = await fetchProxy(proxy, '/blog/hello')
      expect(res.status).toBe(404)

      proxy.close()
      s1.close()
    })

    it('should proxy to the first matching rule', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/abc/**', dest: s1.url },
        { pathname: '/abc/blog/**', dest: 'http://localhost' }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/abc/blog/nice-one')
      expect(data.url).toBe('/abc/blog/nice-one')

      proxy.close()
      s1.close()
    })
  })

  describe('methods', () => {
    it('should proxy for method in the list')
    it('should not proxy for a method which is not in the list')
    it('should proxy for any method if no methods provided')
  })

  describe('other', () => {
    it('should proxy the POST body')
    it('should forward request headers')
    it('should send back response headers')
  })
})
