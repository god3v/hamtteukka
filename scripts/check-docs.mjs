#!/usr/bin/env node
// Checks the structure of Markdown documents under docs/ (AGENTS.md "문서 작성 규칙").
//
//   node scripts/check-docs.mjs            # every docs/**/*.md
//   node scripts/check-docs.mjs a.md b.md  # only the given files
//
// Exit code 0 when every file passes, 1 when any problem is found.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DOC_TYPES = ["reference", "explanation", "how-to", "tutorial"];
const MERMAID_TYPES = [
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "erDiagram",
  "stateDiagram-v2",
  "timeline",
  "gantt",
];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a list of problems found in one document. An empty list means the document passes. */
export function checkDoc(content) {
  const problems = [];
  const lines = content.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");

  let bodyStart = 0;
  if (lines[0] !== "---") {
    problems.push("frontmatter가 없다. 첫 줄을 ---로 열고 doc_type, status, updated를 적는다");
  } else {
    const end = lines.indexOf("---", 1);
    if (end === -1) {
      problems.push("frontmatter를 닫는 --- 줄이 없다");
    } else {
      bodyStart = end + 1;
      const fields = {};
      for (const line of lines.slice(1, end)) {
        const match = line.match(/^([A-Za-z_]+):\s*(.*)$/);
        if (match) fields[match[1]] = match[2].replace(/\s+#.*$/, "").trim();
      }
      if (!fields.doc_type) problems.push("frontmatter에 doc_type이 없다");
      else if (!DOC_TYPES.includes(fields.doc_type))
        problems.push(`doc_type은 ${DOC_TYPES.join(", ")} 가운데 하나여야 한다 (현재: ${fields.doc_type})`);
      if (!fields.status) problems.push("frontmatter에 status가 없다");
      if (!fields.updated) problems.push("frontmatter에 updated가 없다");
      else if (!DATE.test(fields.updated))
        problems.push(`updated는 YYYY-MM-DD 형식이어야 한다 (현재: ${fields.updated})`);
    }
  }

  const body = lines.slice(bodyStart);
  const titleIndex = body.findIndex((line) => /^# \S/.test(line));
  if (titleIndex === -1) {
    problems.push("# 제목 줄이 없다");
  } else {
    const nextHeading = body.findIndex((line, i) => i > titleIndex && /^#{1,6} /.test(line));
    const lead = body
      .slice(titleIndex + 1, nextHeading === -1 ? undefined : nextHeading)
      .join("\n")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`\n]*`/g, "");
    const sentences = lead.match(/[.!?](?=\s|$)/g) ?? [];
    if (sentences.length < 2) problems.push("제목 아래 리드가 두 문장보다 짧다");
  }

  let inMermaid = false;
  let typeSeen = false;
  let inMermaidFrontmatter = false;
  body.forEach((line, i) => {
    const trimmed = line.trim();
    if (!inMermaid) {
      if (/^```mermaid\s*$/.test(trimmed)) {
        inMermaid = true;
        typeSeen = false;
        inMermaidFrontmatter = false;
      }
      return;
    }
    if (trimmed.startsWith("```")) {
      if (!typeSeen) problems.push(`${bodyStart + i + 1}행: Mermaid 블록에 다이어그램 유형이 없다`);
      inMermaid = false;
      return;
    }
    if (typeSeen) return;
    if (trimmed === "---") {
      inMermaidFrontmatter = !inMermaidFrontmatter;
      return;
    }
    if (inMermaidFrontmatter || trimmed === "" || trimmed.startsWith("%%")) return;
    typeSeen = true;
    const type = trimmed.split(/\s+/)[0];
    if (!MERMAID_TYPES.includes(type))
      problems.push(
        `${bodyStart + i + 1}행: 쓸 수 없는 Mermaid 유형(${type})이다. ${MERMAID_TYPES.join(", ")} 가운데 하나를 쓴다`,
      );
  });
  if (inMermaid) problems.push("닫히지 않은 Mermaid 코드 블록이 있다");

  return problems;
}

function listDocs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listDocs(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

function toDisplayPath(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function main(args) {
  const files = args.length > 0 ? args.map((arg) => path.resolve(arg)) : listDocs(path.join(ROOT, "docs"));
  let failed = 0;
  for (const file of files) {
    if (!existsSync(file)) {
      console.error(`${toDisplayPath(file)}: 파일이 없다`);
      failed += 1;
      continue;
    }
    const problems = checkDoc(readFileSync(file, "utf8"));
    if (problems.length === 0) continue;
    failed += 1;
    console.error(`${toDisplayPath(file)}`);
    for (const problem of problems) console.error(`  - ${problem}`);
  }
  console.log(`문서 ${files.length}개 검사, 문제 있는 문서 ${failed}개`);
  return failed === 0 ? 0 : 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const thisPath = fileURLToPath(import.meta.url);
const isMain =
  process.platform === "win32" ? invokedPath.toLowerCase() === thisPath.toLowerCase() : invokedPath === thisPath;
if (isMain) process.exitCode = main(process.argv.slice(2));
