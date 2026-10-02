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

const cli = new URL(managedLinux
  ? "../node_modules/vite/bin/vite.js"
  : "../node_modules/vinext/dist/cli.js", import.meta.url);

if (command === "build") {
  const result = spawnSync("node", [fileURLToPath(cli), "build", ...args], { stdio: "inherit" });
  if (result.error) throw result.error;

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

    const pkgContent = JSON.stringify({ name: "layane-shop-standalone", version: "1.0.0", type: "module" }, null, 2);
    fs.writeFileSync(path.join(standaloneDir, "package.json"), pkgContent);
    fs.writeFileSync(path.join(nextStandaloneDir, "package.json"), pkgContent);

    const serverJsContent = `import http from 'node:http';

const PORT = process.env.PORT || 3000;

async function startServer() {
  const handlerModule = await import('./server/index.js');
  const handler = handlerModule.default || handlerModule;

  const server = http.createServer(async (req, res) => {
    try {
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host || \`localhost:\${PORT}\`;
      const url = new URL(req.url || '/', \`\${protocol}://\${host}\`);

      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (val) {
          if (Array.isArray(val)) {
            for (const v of val) headers.append(key, v);
          } else {
            headers.set(key, val);
          }
        }
      }

      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const buffers = [];
        for await (const chunk of req) buffers.push(chunk);
        body = Buffer.concat(buffers);
      }

      const request = new Request(url.href, {
        method: req.method,
        headers,
        body,
        duplex: body ? 'half' : undefined,
      });

      const response = await handler.fetch(request, process.env, { props: {} });

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (err) {
      console.error('Server error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  server.listen(PORT, () => {
    console.log(\`Server listening on port \${PORT}\`);
  });
}

startServer();
`;

    fs.writeFileSync(path.join(nextStandaloneDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(standaloneDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(nextDir, "server.js"), serverJsContent);
    fs.writeFileSync(path.join(nextDir, "BUILD_ID"), "build");
    fs.writeFileSync(
      path.join(nextDir, "required-server-files.json"),
      JSON.stringify({ version: "1.0.0", config: {}, appDir: true, relativeAppDir: "", files: [], ignore: [] })
    );
    console.log("Post-build standalone server successfully generated.");
  } catch (e) {
    console.error("Post-build copy error:", e);
  }

  process.exit(0);
}

process.argv = [process.execPath, fileURLToPath(cli), command,
  ...(!managedLinux && command === "dev" ? ["--port", "5173"] : []), ...args];
await import(cli.href);
