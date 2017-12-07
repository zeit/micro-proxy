const micro = require('micro')
const listen = require('test-listen')
const { resolve } = require('path')

module.exports = (rules, rulesDirectoryPath) => Promise.all(
  rules.map(async ({ dest, ...rest }) => {
    let mountedDest = dest
    let service = null

    // If dest is a file, mount the micro service
    // and replace the file path by the mounted url
    if (dest.slice(0, 2) === './') {
      try {
        const destFilePath = resolve(rulesDirectoryPath, dest)
        const func = require(destFilePath)
        service = micro(func)
        mountedDest = await listen(service)
        console.log(`. Started ${dest} on ${mountedDest}`)
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
      service,
      ...rest
    }
  })
)
