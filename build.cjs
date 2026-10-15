// Use content-addressed filenames so cached CSS/JS cannot mismatch new HTML.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'public'));
fs.mkdirSync(out, { recursive: true });
const names = new Map();
for (const name of ['style.css', 'core.js', 'app.js', 'management-help.js', 'tutorial.js']) {
  const data = fs.readFileSync(path.join(__dirname, name));
  const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);
  const ext = path.extname(name);
  const versioned = `${path.basename(name, ext)}.${hash}${ext}`;
  names.set(name, versioned);
  fs.writeFileSync(path.join(out, versioned), data);
}
for (const name of ['index.html']) {
  let html = fs.readFileSync(path.join(__dirname, name), 'utf8');
  for (const [original, versioned] of names) {
    html = html.replaceAll(`"${original}"`, `"${versioned}"`);
  }
  fs.writeFileSync(path.join(out, name), html);
}
fs.cpSync(path.join(__dirname, 'assets'), path.join(out, 'assets'), { recursive: true });
console.log(`Static site prepared: ${out}`);
console.log(Object.fromEntries(names));
