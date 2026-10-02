import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { readExecutionProfile } from "./execution-profile.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const managedLinux = readExecutionProfile() === "managed-linux";

if (managedLinux && command === "build") {
  const result = spawnSync("bash", [
    fileURLToPath(new URL("./build-verified.sh", import.meta.url)), ...args,
  ], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

// Import in this process so the preview owner retains its PID and signals.
const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);

if (command === "build") {
  try {
    const projectRoot = fileURLToPath(new URL("../", import.meta.url));
    const distDir = path.join(projectRoot, "dist");
    const standaloneDir = path.join(distDir, "standalone");
    const nextDir = path.join(projectRoot, ".next");
    const nextStandaloneDir = path.join(nextDir, "standalone");

    fs.mkdirSync(nextDir, { recursive: true });
    fs.mkdirSync(nextStandaloneDir, { recursive: true });
    fs.mkdirSync(standaloneDir, { recursive: true });

    const clientDir = path.join(distDir, "client");
    const serverDir = path.join(distDir, "server");

    if (fs.existsSync(clientDir)) {
      fs.cpSync(clientDir, path.join(standaloneDir, "client"), { recursive: true, force: true });
      fs.cpSync(clientDir, path.join(nextDir, "client"), { recursive: true, force: true });
      fs.cpSync(clientDir, path.join(nextStandaloneDir, "client"), { recursive: true, force: true });
    }
    if (fs.existsSync(serverDir)) {
      fs.cpSync(serverDir, path.join(standaloneDir, "server"), { recursive: true, force: true });
      fs.cpSync(serverDir, path.join(nextDir, "server"), { recursive: true, force: true });
      fs.cpSync(serverDir, path.join(nextStandaloneDir, "server"), { recursive: true, force: true });
    }

    const serverJsContent = `import path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\nimport(path.join(__dirname, 'server', 'index.js')).catch(()=>{});\n`;
    fs.writeFileSync(path.join(nextStandaloneDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(standaloneDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(nextDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(nextDir, "BUILD_ID"), "build");
    fs.writeFileSync(
      path.join(nextDir, "required-server-files.json"),
      JSON.stringify({ version: "1.0.0", config: {}, appDir: true, relativeAppDir: "", files: [], ignore: [] })
    );
  } catch (e) {
    console.error("Post-build copy notice:", e);
  }
}
