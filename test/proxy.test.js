/* global describe, it, expect */

const { createInfoServer, fetchProxy } = require('./util')
const micro = require('micro')
const listen = require('test-listen')
const fetch = require('node-fetch')
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
    it('should proxy for a method in the list', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', method: ['GET', 'POST'], dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/blog/hello')
      expect(data.url).toBe('/blog/hello')

      proxy.close()
      s1.close()
    })

    it('should not proxy for a method which is not in the list', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', method: ['GET', 'POST'], dest: s1.url }
      ])
      await listen(proxy)

      const { res } = await fetchProxy(proxy, '/blog/hello', { method: 'OPTIONS' })
      expect(res.status).toBe(404)

      proxy.close()
      s1.close()
    })

    it('should proxy for any method if no methods provided', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/blog/hello', { method: 'OPTIONS' })
      expect(data.method).toBe('OPTIONS')

      proxy.close()
      s1.close()
    })
  })

  describe('other', () => {
    it('should proxy the POST body', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const body = 'hello-body'
      const { data } = await fetchProxy(proxy, '/blog/hello', {
        method: 'POST',
        body
      })

      expect(data.body).toBe(body)

      proxy.close()
      s1.close()
    })

    it('should forward request headers', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const token = 'a4n59lx83'
      const { data } = await fetchProxy(proxy, '/blog/hello', {
        method: 'POST',
        headers: {
          'zeit-token': token
        }
      })

      expect(data.headers['zeit-token']).toBe(token)

      proxy.close()
      s1.close()
    })

    it('should override host header using dest', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/blog/**', dest: s1.url }
      ])
      await listen(proxy)

      const { data } = await fetchProxy(proxy, '/blog/hello', {
        method: 'POST',
        headers: {
          host: 'my-host.com'
        }
      })

      expect(data.headers['host']).not.toBe('my-host.com')
      expect(data.headers['host']).toContain('localhost')

      proxy.close()
      s1.close()
    })

    it('should forward original status code', async () => {
      const s1 = await createInfoServer()
      const proxy = createProxy([
        { pathname: '/**', dest: s1.url }
      ])
      await listen(proxy)

      const { res } = await fetchProxy(proxy, '/404')

      expect(res.status).toBe(404)

      proxy.close()
      s1.close()
    })

    it('should send back response headers', async () => {
      const header = 'THE_HEADER'
      const s1 = micro(async (req, res) => {
        res.writeHead(200, {
          'output-header': header
        })
        res.end()
      })
      await listen(s1)

      const proxy = createProxy([
        { pathname: '/blog/**', dest: `http://localhost:${s1.address().port}` }
      ])
      await listen(proxy)

      const res = await fetch(`http://localhost:${proxy.address().port}/blog/hello`)
      expect(res.headers.get('output-header')).toBe(header)

      proxy.close()
      s1.close()
    })
  })
})
