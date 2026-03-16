Minimal Node.js HTTP/HTTPS proxy

Usage

1. Install Node.js (>=14).
2. From the project folder run:

```powershell
npm install
npm start
```

3. Configure your browser or system to use `localhost:8080` as the HTTP/HTTPS proxy.

Notes

- HTTP requests are proxied by sending the request to the target host.
- HTTPS (TLS) is handled via the `CONNECT` method which tunnels raw TCP between client and destination.
- This proxy does not implement authentication, caching, or filtering. Use for testing only.

Environment

- `PORT` — override the listening port (default `8080`).
