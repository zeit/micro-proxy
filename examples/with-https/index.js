const createProxy = require('../../')

const cert = require('openssl-self-signed-certificate')

const httpsOptions = {
  key: cert.key,
  cert: cert.cert,
  passphrase: cert.passphrase
}

const proxy = createProxy([
  { pathname: '/gh', dest: 'https://github.com/zeit/micro-proxy' },
  { pathname: '/**', dest: 'https://duckduckgo.com' }
], httpsOptions)

proxy.listen(9000, err => {
  if (err) {
    throw err
  }
  console.log(`> Ready on https://localhost:9000`)
})
