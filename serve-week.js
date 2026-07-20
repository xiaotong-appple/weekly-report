#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const indexPath = path.join(root, 'index.html');
const port = process.env.PORT || 3000;

function getWeekPages() {
  return fs.readdirSync(root)
    .filter((file) => /^week\d+\.html$/i.test(file))
    .map((file) => ({
      file,
      week: parseInt(file.match(/^week(\d+)\.html$/i)[1], 10),
    }))
    .sort((a, b) => a.week - b.week);
}

function getLatestWeekPage() {
  const weekPages = getWeekPages();
  return weekPages[weekPages.length - 1];
}

function buildNav() {
  const weekPages = getWeekPages();
  const links = weekPages
    .map((page) => `      <a href="${page.file}">Week ${page.week}</a>`)
    .join('\n');
  return `<nav class="top-nav">\n    <div class="top-nav-inner">\n${links}\n    </div>\n  </nav>`;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.json': return 'application/json; charset=utf-8';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  let requestPath = req.url.split('?')[0];
  if (requestPath === '/') {
    const latestWeek = getLatestWeekPage();
    if (latestWeek) {
      res.writeHead(302, { Location: `/${latestWeek.file}` });
      return res.end();
    }
    requestPath = '/index.html';
  }
  const filePath = path.join(root, decodeURIComponent(requestPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }

  if (path.basename(filePath).toLowerCase() === 'index.html') {
    const content = fs.readFileSync(filePath, 'utf8');
    const nav = buildNav();
    const updated = content.replace(
      /<nav class="top-nav">[\s\S]*?<\/nav>/,
      nav
    );
    if (updated === content) {
      res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
      return res.end('Could not update index navigation.');
    }
    res.writeHead(200, {'Content-Type': contentType(filePath)});
    return res.end(updated);
  }

  const data = fs.readFileSync(filePath);
  res.writeHead(200, {'Content-Type': contentType(filePath)});
  res.end(data);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log('This server serves index.html with the latest week links on every request.');
});
