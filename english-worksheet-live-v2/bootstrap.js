import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(root, "payload");
const parts = [
  "p00a", "p00b",
  "p01", "p02", "p03", "p04", "p05",
  "p06", "p07", "p08", "p09", "p10"
];

const encoded = parts
  .map((name) => fs.readFileSync(path.join(payloadDir, name), "utf8").trim())
  .join("");

const archive = Buffer.from(encoded, "base64");
const actual = crypto.createHash("sha256").update(archive).digest("hex");
const expected = "be2f7ef48a02e92a30f01fe2860452975946eab8817b001c7b1af49ef6d856ae";

if (actual !== expected) {
  throw new Error(`payload checksum mismatch: ${actual}`);
}

const runtime = path.join(root, "runtime");
fs.rmSync(runtime, { recursive: true, force: true });
fs.mkdirSync(runtime, { recursive: true });

const archivePath = path.join(root, "payload.tar.xz");
fs.writeFileSync(archivePath, archive);
execFileSync("tar", ["-xJf", archivePath, "-C", runtime], { stdio: "inherit" });

const appRoot = path.join(runtime, "english_payload");
const entry = path.join(appRoot, "src", "server.js");

if (!fs.existsSync(entry)) {
  throw new Error("English worksheet server.js was not restored");
}

const child = spawn(process.execPath, [entry], {
  cwd: appRoot,
  env: process.env,
  stdio: "inherit"
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
