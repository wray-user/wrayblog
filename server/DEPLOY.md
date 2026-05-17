# Wray Blog Server Deploy

## 1. Upload only source files

Upload these files/directories to the server:

```txt
server.js
package.json
package-lock.json
models/
.env
```

Do not upload:

```txt
node_modules/
```

Install dependencies on the server with:

```bash
npm ci
```

## 2. Environment variables

Create `/home/ubuntu/wrayblog-server/.env` or configure these variables in PM2:

```bash
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/wrayblog
ADMIN_USER=admin
ADMIN_PASSWORD=replace-with-your-password
ADMIN_TOKEN=replace-with-a-long-random-token
```

`ADMIN_TOKEN` is used by protected write APIs:

```txt
POST   /api/posts
PUT    /api/posts/:slug
DELETE /api/posts/:slug
```

Requests must include:

```txt
Authorization: Bearer <ADMIN_TOKEN>
```

## 3. Start MongoDB

If MongoDB is installed directly on Ubuntu:

```bash
sudo systemctl enable mongod
sudo systemctl start mongod
sudo systemctl status mongod
```

If you use Docker:

```bash
docker run -d \
  --name wrayblog-mongo \
  --restart unless-stopped \
  -p 127.0.0.1:27017:27017 \
  -v wrayblog-mongo-data:/data/db \
  mongo:7
```

Keep MongoDB bound to `127.0.0.1`. Do not expose port `27017` to the public internet.

## 4. Start Node with PM2

```bash
sudo npm install -g pm2
pm2 start server.js --name wrayblog-api
pm2 save
pm2 startup
```

Check:

```bash
curl http://127.0.0.1:3000/api/health
```

## 5. Nginx proxy

Add this inside your `server { ... }` block:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```
