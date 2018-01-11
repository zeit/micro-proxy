/* global describe, it, expect */

const WebSocket = require('ws')
const listen = require('test-listen')

const { createWsServer, receiveWsMessageOnce } = require('./util')
const createProxy = require('../')

describe('Basic WS Operations', () => {
  describe('ws', () => {
    it('should receive websocket messages', async () => {
      const s1 = await createWsServer()
      const proxy = createProxy([
        { pathname: '/ws', dest: s1.url }
      ])

      await listen(proxy)

      const ws = new WebSocket(`ws://localhost:${proxy.address().port}/ws`)

      const msg = await receiveWsMessageOnce(ws, 'fingerprint')
      expect(msg).toBe('fingerprint')

      proxy.close()
      s1.close()
    })

    it('should send and receive websocket messages', async () => {
      const s1 = await createWsServer()
      const proxy = createProxy([
        { pathname: '/ws', dest: s1.url }
      ])

      await listen(proxy)

      const ws = new WebSocket(`ws://localhost:${proxy.address().port}/ws`)

      const msg1 = await receiveWsMessageOnce(ws, 'fingerprint')
      expect(msg1).toBe('fingerprint')

      const message = 'ping'

      ws.send(message)
      const msg2 = await receiveWsMessageOnce(ws, message)
      expect(msg2).toBe(message)

      proxy.close()
      s1.close()
    })
  })
})
