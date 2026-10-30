import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const textExtensions = /(?:^|\/)(?:Dockerfile|[^/]+\.(?:env|example|json|js|mjs|ts|tsx|kt|kts|md|xml|yml|yaml|properties|txt))$/i;
const forbidden = [
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub token", pattern: /gh[ps]_[0-9A-Za-z]{30,}/ },
  { name: "Supabase service token", pattern: /SUPABASE_SERVICE_ROLE_KEY[ \t]*=[ \t]*[^\s#]+/ },
];

const findings = [];
for (const file of tracked.filter((name) => textExtensions.test(name))) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  for (const rule of forbidden) if (rule.pattern.test(content)) findings.push(`${file}: ${rule.name}`);
}

if (findings.length) {
  console.error(`Secret hygiene check failed:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log(`Secret hygiene check passed across ${tracked.length} tracked files.`);
