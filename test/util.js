const micro = require('micro')
const listen = require('test-listen')
const fetch = require('node-fetch')

exports.createInfoServer = async () => {
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

  await listen(server)

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
