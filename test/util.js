const micro = require('micro')
const listen = require('test-listen')
const fetch = require('node-fetch')
const tempfile = require('tempfile')
const { spawn } = require('child_process')
const { writeFileSync, unlinkSync } = require('fs')

exports.createInfoServer = async (port) => {
  const server = micro(async (req) => {
    const { method, headers, url } = req
    const body = await micro.text(req)
    return {
      method,
      headers,
      url,
      body
    }
  })

  await listen(server, port)

  return {
    port: server.address().port,
    url: `http://localhost:${server.address().port}`,
    close: () => {
      server.close()
    }
  }
}

exports.fetchProxy = async (proxy, path, options) => {
  const res = await fetch(`http://localhost:${proxy.address().port}${path}`, options)
  if (res.status !== 200) {
    return { res }
  }

  const data = await res.json()
  return { data, res }
}

exports.startProxyCLI = async (rules, args = []) => {
  const configFile = tempfile('.json')
  writeFileSync(configFile, JSON.stringify({
    rules
  }))

  const proxy = spawn('./bin/micro-proxy', ['-r', configFile, ...args])
  proxy.stderr.pipe(process.stderr)

  return new Promise((resolve, reject) => {
    proxy.stdout.on('data', (d) => {
      if (/Ready/.test(d.toString())) {
        resolve({
          close: () => {
            proxy.kill()
            unlinkSync(configFile)
          }
        })
      }
    })
  })
}
