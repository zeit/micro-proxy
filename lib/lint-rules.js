/* eslint-disable */

const { METHODS: HTTP_METHODS } = require('http')
const { parse } = require('url')

const ALLOWED_KEYS = new Set(['method', 'pathname', 'dest'])
const ALLOWED_METHODS = new Set(HTTP_METHODS)
const MAX_RULES_LIMIT = 20

module.exports = function lintRules (rules) {
  const cleanedRules = []

  if (rules.length > MAX_RULES_LIMIT) {
    const err = new Error(
      `Maximum rule count of 20 exceeded. Found ${rules.length} rules.`
    )
    err.statusCode = 422
    throw err
  }

  for (let rule of rules) {
    // Don't let in unwanted entries
    lintKeys(rule)

    // Make sure methods is an array etc.
    rule = lintAndFixMethods(rule)
    rule = lintDest(rule)
    rule = lintAndFixPathname(rule)
    cleanedRules.push(rule)
  }

  return cleanedRules
}

function lintKeys (rule) {
  for (const key of Object.keys(rule)) {
    if (!ALLOWED_KEYS.has(key)) {
      if (key.toLowerCase() === 'path') {
        const err = new Error(`Did you mean pathname`)
        err.statusCode = 422
        throw err
      }
      const err = new Error(
        `Illegal key ${key} in rule ${JSON.stringify(
          rule
        )}, allowed keys: [${Array.from(ALLOWED_KEYS)}]`
      )
      err.statusCode = 422
      throw err
    }
  }
}

function lintAndFixMethods (rule) {
  if (rule.method && !Array.isArray(rule.method)) {
    rule.method = Array.of(rule.method)
  }
  // It's ok to have no methods
  if (rule.method) {
    lintMethods(rule.method)
  }
  return rule
}

function lintMethods (methods) {
  for (const method of methods) {
    if (method && !ALLOWED_METHODS.has(method)) {
      const err = new Error(
        `Illegal HTTP method ${JSON.stringify(
          method
        )}, allowed methods: [${Array.from(ALLOWED_METHODS)}]`
      )
      err.statusCode = 422
      throw err
    }
  }
}

function lintDest (rule) {
  if (!rule.dest) {
    const err = new Error(`Missing destination ${JSON.stringify(rule)}`)
    err.statusCode = 422
    throw err
  }

  const {
    host,
    protocol
  } = parse(rule.dest)

  if (!host) {
    const err = new Error(`Missing host for ${JSON.stringify(rule)}`)
    err.statusCode = 422
    throw err
  }

  if (!protocol) {
    const err = new Error(`Missing protocol for ${JSON.stringify(rule)}`)
    err.statusCode = 422
    throw err
  }

  return rule
}

function lintAndFixPathname (rule) {
  if (!rule.pathname) {
    return rule
  }
  // Strip down possible query and stuff
  rule.pathname = parse(rule.pathname).pathname
  // glob
  if (rule.pathname.indexOf('*') > 0) {
    // Since this output will be thrown into regex engine, we need to make sure they don't inject regex...
    let pathnameRe = rule.pathname
    // Escape all possible regex particles
    pathnameRe = pathnameRe.replace(/[\-\[\]\{\}\(\)\+\?\.\\\^\$\|]/g, /\\$&/)

    // glob
    pathnameRe = pathnameRe.replace(/\*\*/g, '(.*)') // ** -> .*
    pathnameRe = pathnameRe.replace(/([^.])(\*)/g, '$1([^/]*)') // * -> .* within path separators
    pathnameRe = pathnameRe.replace('?', '.') // ? -> .

    rule.pathnameRe = `^${pathnameRe}$`
  }
  return rule
}
