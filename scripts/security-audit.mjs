import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', '.vscode', '.idea']);
const IGNORED_FILES = new Set(['package-lock.json', 'yarn.lock']);

let detectedIssues = 0;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      if (IGNORED_FILES.has(entry.name)) continue;
      // Skip binary files
      if (entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name.endsWith('.webp') || entry.name.endsWith('.ico')) continue;

      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for Gemini API key pattern (AIzaSy...)
      if (/AIzaSy[A-Za-z0-9_-]{33}/.test(content)) {
        console.error(`[ALERT] Real Google API key detected in: ${fullPath}`);
        detectedIssues++;
      }

      // Check for OpenAI key pattern (sk-...)
      if (/sk-[A-Za-z0-9]{20,}/.test(content)) {
        console.error(`[ALERT] Real OpenAI key detected in: ${fullPath}`);
        detectedIssues++;
      }

      // Check for GitHub tokens (ghp_...)
      if (/ghp_[A-Za-z0-9]{20,}/.test(content)) {
        console.error(`[ALERT] GitHub token detected in: ${fullPath}`);
        detectedIssues++;
      }

      // Check for private URLs / IPs / credentials
      if (/https?:\/\/[a-zA-Z0-9_\-\.]+:[0-9]+@(?!localhost)/.test(content)) {
        console.error(`[ALERT] Embedded URL with credentials in: ${fullPath}`);
        detectedIssues++;
      }
    }
  }
}

console.log('--- Starting Static Security Audit ---');
scanDir('.');
if (detectedIssues === 0) {
  console.log('✅ Clean! No API keys, tokens, or hardcoded credentials detected.');
} else {
  console.error(`❌ Security audit failed with ${detectedIssues} issue(s).`);
  process.exit(1);
}
