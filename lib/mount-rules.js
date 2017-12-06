const micro = require('micro')
const listen = require('test-listen')

module.exports = (rules) => Promise.all(
  rules.map(async ({ dest, ...rest }) => {
    let mountedDest = dest

    // If dest is a file, mount the micro service
    // and replace the file path by the mounted url
    if (dest.slice(0, 2) === './') {
      try {
        const service = require(`../${dest}`)
        mountedDest = await listen(micro(service))
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          const err = new Error(`Dest file not found ${dest}`)
          err.statusCode = 422
          throw err
        }
        throw e
      }
    }

    return {
      dest: mountedDest,
      ...rest
    }
  })
)
