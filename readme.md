## micro-proxy - simplest proxy server for microservices

With `micro-proxy`, you can create a proxy server for your microservices based on `now.sh` [path alias rules](https://zeit.co/docs/features/path-aliases).

### Installation

```js
now i -g micro-proxy
```

Then add following rules to a filename called `rules.json`:

```json
{
  "rules": [
    {"pathname": "/blog", "method":["GET", "POST", "OPTIONS"], "dest": "http://localhost:5000"},
    {"pathname": "/**", "dest": "http://localhost:4000"}
  ]
}
```

> Visit [path alias](https://zeit.co/docs/features/path-aliases) documentation to learn more about rules.

Run the proxy server with:

```
micro-proxy -r rules.json -p 9000
```

Now you can access the proxy via: `http://localhost:9000`

### Programmatic Usage

You can run the proxy programmatically inside your codebase.
For that, add `micro-proxy` to your project with:

```
npm install micro-proxy
```

Then create the proxy server like this:

```js
const createProxy = require('micro-proxy')
const proxy = createProxy([
  {"pathname": "/blog", "method":["GET", "POST", "OPTIONS"], "dest": "http://localhost:5000"},
  {"pathname": "/**", "dest": "http://localhost:4000"}
])

proxy.listen(9000, (err) => {
  if (err) {
    throw err
  }
  console.log(`> Ready on http://localhost:9000`)
})
```

### Production Usage

You can use `micro-proxy` as a production deployment.

But if you are using [ZEIT now](https://zeit.co/now), you can simply use path [alias rules](https://zeit.co/docs/features/path-aliases) instead.<br/>
(It's a FREE service available for all ZEIT now deployments.)
