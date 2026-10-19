// Generates the ES256 key pair: the private JWK goes to the worker secret, the public JWK into the site build.
const { privateKey, publicKey } = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const priv = await crypto.subtle.exportKey('jwk', privateKey)
const pub = await crypto.subtle.exportKey('jwk', publicKey)
console.log('SIGNING_JWK (worker secret):')
console.log(JSON.stringify(priv))
console.log('\nVITE_LICENSE_JWK (site build variable):')
console.log(JSON.stringify(pub))
