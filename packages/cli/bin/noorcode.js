#!/usr/bin/env bun
process.env.FORCE_COLOR = "3";
process.env.COLORTERM = "truecolor";
await import("../dist/index.js");
