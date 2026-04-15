import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const projectRoot = process.cwd();
const extensionCandidates = [".ts", ".tsx", ".js", ".mjs", ""];

function resolveAliasPath(specifier) {
  const basePath = path.join(projectRoot, specifier.slice(2));

  for (const extension of extensionCandidates) {
    const candidate = `${basePath}${extension}`;

    if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const extension of [".ts", ".tsx", ".js", ".mjs"]) {
      const indexCandidate = path.join(basePath, `index${extension}`);

      if (fs.existsSync(indexCandidate)) {
        return indexCandidate;
      }
    }
  }

  return basePath;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const absolutePath = resolveAliasPath(specifier);
    return defaultResolve(pathToFileURL(absolutePath).href, context, defaultResolve);
  }

  return defaultResolve(specifier, context, defaultResolve);
}
