#!/usr/bin/env node
/**
 * Generates print-ready HTML from PROJECT_DOCUMENTATION.md
 * Open docs/PROJECT_DOCUMENTATION.html in browser → Print → Save as PDF
 * Or open .md in Microsoft Word → Save as .docx
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const md = readFileSync(join(root, "docs/PROJECT_DOCUMENTATION.md"), "utf8");

const escapeHtml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lines = md.split("\n");
let html = "";
let inCode = false;
let codeLang = "";

for (const line of lines) {
    if (line.startsWith("```")) {
        if (!inCode) {
            inCode = true;
            codeLang = line.slice(3).trim();
            html += `<pre><code class="${codeLang}">`;
        } else {
            inCode = false;
            html += `</code></pre>\n`;
        }
        continue;
    }
    if (inCode) {
        html += escapeHtml(line) + "\n";
        continue;
    }
    if (line.startsWith("# ")) {
        html += `<h1>${line.slice(2)}</h1>\n`;
    } else if (line.startsWith("## ")) {
        html += `<h2>${line.slice(3)}</h2>\n`;
    } else if (line.startsWith("### ")) {
        html += `<h3>${line.slice(4)}</h3>\n`;
    } else if (line.startsWith("|") && line.includes("---")) {
        continue;
    } else if (line.startsWith("|")) {
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        html += "<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>\n";
    } else if (line === "---") {
        html += "<hr>\n";
    } else if (line.startsWith("> ")) {
        html += `<blockquote>${line.slice(2)}</blockquote>\n`;
    } else if (line.trim() === "") {
        html += "<br>\n";
    } else {
        html += `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>\n`;
    }
}

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FixItNow Backend — Project Documentation</title>
  <style>
    @media print { body { font-size: 11pt; } h1,h2 { page-break-after: avoid; } pre { page-break-inside: avoid; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #222; line-height: 1.6; }
    h1 { color: #1a56db; border-bottom: 3px solid #1a56db; padding-bottom: 8px; }
    h2 { color: #1e40af; margin-top: 2em; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { color: #374151; margin-top: 1.5em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9em; }
    td, th { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
    tr:nth-child(even) { background: #f9fafb; }
    pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
    code { font-family: 'Consolas', monospace; }
    blockquote { border-left: 4px solid #1a56db; margin: 1em 0; padding: 8px 16px; background: #eff6ff; font-style: italic; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
    .cover { text-align: center; padding: 60px 0; }
    .cover h1 { font-size: 2.5em; border: none; }
    .cover p { font-size: 1.2em; color: #666; }
  </style>
</head>
<body>
${html}
</body>
</html>`;

writeFileSync(join(root, "docs/PROJECT_DOCUMENTATION.html"), fullHtml);
console.log("Generated docs/PROJECT_DOCUMENTATION.html");
console.log("→ Open in Chrome → Print → Save as PDF");
console.log("→ Or open PROJECT_DOCUMENTATION.md in Word → Save as .docx");
