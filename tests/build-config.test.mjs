import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import test from "node:test"

const configCheck = `
  import config from "./next.config.mjs"
  process.stdout.write(config.distDir)
`

test("uses Vercel's standard build directory and keeps the local cache isolated", () => {
  for (const [vercel, expected] of [["1", ".next"], ["", ".next-fecocy"]]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", configCheck], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, VERCEL: vercel },
    })

    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout, expected)
  }
})
