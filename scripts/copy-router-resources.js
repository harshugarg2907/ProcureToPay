const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appRoot = path.join(root, "app");
const resourcesRoot = path.join(appRoot, "router", "resources");

const copies = [
  { from: "common/webapp", to: "common" },
  { from: "login-page/webapp", to: "login-page" },
  { from: "home", to: "home" },
  { from: "dashboard", to: "dashboard" },
  { from: "procurement-pages", to: "procurement-pages" },
  { from: "p2p-list-object", to: "p2p-list-object" },
  { from: "p2p-object-pages", to: "p2p-object-pages" },
  { from: "p2p-analytical", to: "p2p-analytical" },
  { from: "p2p-transactional", to: "p2p-transactional" },
  { from: "p2p-ui", to: "p2p-ui" },
  { from: "user-management", to: "user-management" }
];

function ensureInside(parent, target) {
  const relative = path.relative(parent, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${target}`);
  }
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    console.warn(`Skipping missing UI source: ${path.relative(root, source)}`);
    return;
  }

  ensureInside(resourcesRoot, target);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, {
    recursive: true,
    filter: (entry) => !entry.includes(`${path.sep}node_modules${path.sep}`)
  });
  console.log(`Copied ${path.relative(root, source)} -> ${path.relative(root, target)}`);
}

fs.mkdirSync(resourcesRoot, { recursive: true });

for (const copy of copies) {
  copyDirectory(path.join(appRoot, copy.from), path.join(resourcesRoot, copy.to));
}
