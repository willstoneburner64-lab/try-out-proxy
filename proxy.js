const http = require('http');
const net = require('net');
const url = require('url');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // For proxy requests, `req.url` is usually an absolute URL. If not, fall back to Host header.
  const parsed = url.parse(req.url);
  const targetHost = parsed.hostname || (req.headers.host || '').split(':')[0];
  const targetPort = parsed.port || 80;
  const path = parsed.path || req.url;

  if (!targetHost) {
    res.writeHead(400);
    res.end('Bad request: unable to determine target host');
    return;
  }

  const options = {
    host: targetHost,
    port: targetPort,
    path: path,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err.message);
    res.writeHead(502);
    res.end('Bad gateway');
  });

  req.pipe(proxyReq);
});

server.on('connect', (req, clientSocket, head) => {
  // CONNECT requests: req.url is "host:port"
  const [host, port] = req.url.split(':');
  console.log(`CONNECT ${host}:${port}`);

  const serverSocket = net.connect(port || 443, host, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head && head.length) serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', (err) => {
    console.error('Tunneling socket error:', err.message);
    clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
    clientSocket.end();
  });
});

server.on('clientError', (err, socket) => {
  console.error('Client error:', err.message);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
