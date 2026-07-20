#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const indexPath = path.join(root, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('index.html not found in project root.');
  process.exit(1);
}

const files = fs.readdirSync(root);
const weekPages = files
  .filter((file) => /^week\d+\.html$/.test(file))
  .map((file) => ({
    file,
    week: parseInt(file.match(/^week(\d+)\.html$/i)[1], 10),
  }))
  .sort((a, b) => a.week - b.week);

if (weekPages.length === 0) {
  console.error('No weekN.html files found in project root.');
  process.exit(1);
}

const navLinks = weekPages
  .map((page) => `      <a href="${page.file}">Week ${page.week}</a>`)
  .join('\n');

const replacement = `<nav class="top-nav">\n    <div class="top-nav-inner">\n${navLinks}\n    </div>\n  </nav>`;

const content = fs.readFileSync(indexPath, 'utf8');
const updated = content.replace(
  /<nav class="top-nav">\s*<div class="top-nav-inner">[\s\S]*?<\/div>\s*<\/nav>/,
  replacement
);

if (updated === content) {
  console.error('Failed to update index navigation. The expected nav block was not found.');
  process.exit(1);
}

fs.writeFileSync(indexPath, updated, 'utf8');
console.log(`index.html navigation updated with ${weekPages.length} week pages.`);
