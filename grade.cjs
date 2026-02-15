#!/usr/bin/env node
/**
 * Lab 7-1-mongoDB — Autograder (grade.cjs)
 *
 * Scoring:
 * - Part A: MongoDB Cloud = 50 marks (full marks for everyone; not autograded)
 * - Part B: Mongoose TODO 1..6 = 30 marks (6 TODOs × 5 marks each)
 * - Submission = 20 marks (on-time=20, late=10, missing/empty server.js=0)
 * - Total = 100
 *
 * IMPORTANT (late check):
 * - Lateness is determined using the latest *student* commit (non-bot),
 *   NOT the latest workflow/GitHub Actions commit.
 *
 * Status codes:
 * - 0 = on time
 * - 1 = late
 * - 2 = no submission OR empty server.js
 *
 * Outputs:
 * - artifacts/grade.csv  (structure unchanged)
 * - artifacts/feedback/README.md
 * - GitHub Actions Step Summary (GITHUB_STEP_SUMMARY)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const LAB_NAME = "7-1-mongoDB";

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

/** Due date: 17 Nov 2025 11:59 PM Riyadh time (UTC+03:00) */
const DUE_ISO = "2025-11-17T23:59:00+03:00";
const DUE_EPOCH_MS = Date.parse(DUE_ISO);

const CLOUD_MAX = 50; // full marks always
const MONGOOSE_MAX = 30; // TODO 1..6 × 5 marks
const SUBMISSION_MAX = 20;
const TOTAL_MAX = 100;

const SERVER_FILE = path.join("7-1-mongodb", "server.js");

/** ---------- Student ID ---------- */
function getStudentId() {
  const repoFull = process.env.GITHUB_REPOSITORY || ""; // org/repo
  const repoName = repoFull.includes("/") ? repoFull.split("/")[1] : repoFull;

  const fromRepoSuffix =
    repoName && repoName.includes("-") ? repoName.split("-").slice(-1)[0] : "";

  return (
    process.env.STUDENT_USERNAME ||
    fromRepoSuffix ||
    process.env.GITHUB_ACTOR ||
    repoName ||
    "student"
  );
}

/** ---------- Git helpers: latest *student* commit time (exclude bots/workflows) ---------- */
function getLatestStudentCommitEpochMs() {
  try {
    // IMPORTANT: do NOT rely on workflow commits
    const out = execSync('git log --format=%ct|%an|%ae|%cn|%ce|%s -n 400', {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!out) return null;

    const lines = out.split("\n");
    for (const line of lines) {
      const parts = line.split("|");
      const ct = parts[0];
      const an = parts[1] || "";
      const ae = parts[2] || "";
      const cn = parts[3] || "";
      const ce = parts[4] || "";
      const subject = parts.slice(5).join("|") || "";

      const hay = `${an} ${ae} ${cn} ${ce} ${subject}`.toLowerCase();

      // Common bot/workflow signals
      const isBot =
        hay.includes("[bot]") ||
        hay.includes("github-actions") ||
        hay.includes("actions@github.com") ||
        hay.includes("github classroom") ||
        hay.includes("classroom[bot]") ||
        hay.includes("dependabot") ||
        hay.includes("autograding") ||
        hay.includes("workflow");

      if (isBot) continue;

      const seconds = Number(ct);
      if (!Number.isFinite(seconds)) continue;
      return seconds * 1000;
    }

    // If ALL commits look like bots, fall back to latest commit time (best-effort)
    const fallback = execSync("git log -1 --format=%ct", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    const seconds = Number(fallback);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  } catch {
    return null;
  }
}

function wasSubmittedLate() {
  const commitMs = getLatestStudentCommitEpochMs();

  // If we can't determine commit time, do NOT penalize (best effort)
  if (!Number.isFinite(commitMs)) return false;

  // Correct logic: late iff latest student commit is AFTER due time
  return commitMs > DUE_EPOCH_MS;
}

/** ---------- File helpers ---------- */
function readTextSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function stripJsComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|\s)\/\/.*$/gm, "$1");
}

function compactWs(s) {
  return s.replace(/\s+/g, " ").trim();
}

function isEmptyCode(code) {
  const stripped = compactWs(stripJsComments(code));
  return stripped.length < 10;
}

function hasRegex(code, re) {
  return re.test(code);
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** ---------- Requirement scoring ---------- */
function req(label, ok, detailIfFail = "") {
  return { label, ok: !!ok, detailIfFail };
}

function scoreFromRequirements(reqs, maxMarks) {
  const total = reqs.length;
  const ok = reqs.filter((r) => r.ok).length;
  if (!total) return { earned: 0, ok, total };
  return { earned: Math.round((maxMarks * ok) / total), ok, total };
}

function formatReqs(reqs) {
  return reqs.map((r) =>
    r.ok ? `- ✅ ${r.label}` : `- ❌ ${r.label}${r.detailIfFail ? ` — ${r.detailIfFail}` : ""}`
  );
}

/** ---------- Locate submission ---------- */
const studentId = getStudentId();

const hasServer = fs.existsSync(SERVER_FILE) && fs.statSync(SERVER_FILE).isFile();
const serverCode = hasServer ? readTextSafe(SERVER_FILE) : "";
const serverEmpty = hasServer ? isEmptyCode(serverCode) : true;

const loadNote = hasServer
  ? serverEmpty
    ? `⚠️ Found \`${SERVER_FILE}\` but it appears empty (or only comments).`
    : `✅ Found \`${SERVER_FILE}\`.`
  : `❌ Missing \`${SERVER_FILE}\`.`;

/** ---------- Submission status + marks ---------- */
const late = wasSubmittedLate();
let status = 0;

if (!hasServer || serverEmpty) status = 2;
else status = late ? 1 : 0;

const submissionMarks = status === 2 ? 0 : status === 1 ? 10 : 20;

const commitMs = getLatestStudentCommitEpochMs();
const commitIso = commitMs ? new Date(commitMs).toISOString() : "unknown";
const dueIsoForDisplay = new Date(DUE_EPOCH_MS).toISOString();

const submissionStatusText =
  status === 2
    ? "No submission detected (missing/empty server.js): submission marks = 0/20."
    : status === 1
    ? `Late submission: latest *student* commit is after due time. 10/20. (student commit: ${commitIso}; due: ${dueIsoForDisplay})`
    : `On-time submission: latest *student* commit is on/before due time. 20/20. (student commit: ${commitIso}; due: ${dueIsoForDisplay})`;

/** ---------- Mongoose TODO checks (server.js only) ---------- */
const code = compactWs(stripJsComments(serverCode));

/**
 * Flexible signals (don’t require exact code):
 * - Connection: mongoose.connect("mongodb+srv://...cluster0...") or mongoose.connect(process.env...)
 * - Schema/model: new mongoose.Schema({ name: String, age: Number, major: String }) and mongoose.model("Student", ...)
 * - Create: Student.insertMany([...]) OR new Student(...).save() with multiple docs
 * - Read: Student.find(...)
 * - Update: Student.updateOne(...) OR findOneAndUpdate / updateMany
 * - Delete: Student.deleteOne(...) OR findOneAndDelete / deleteMany
 */

const mongooseTasks = [
  {
    id: "TODO 1",
    name: "Establish Connection with MongoDB via Mongoose",
    marks: 5,
    requirements: () => {
      const reqs = [];
      const importsMongoose =
        hasRegex(code, /\bimport\s+mongoose\b/i) ||
        hasRegex(code, /\brequire\s*\(\s*["']mongoose["']\s*\)/i);

      const callsConnect =
        hasRegex(code, /\bmongoose\.connect\s*\(/i) ||
        hasRegex(code, /\bconnect\s*\(\s*["']mongodb\+srv:\/\//i);

      // allow env string too
      const hasSrvString =
        hasRegex(code, /mongodb\+srv:\/\//i) || hasRegex(code, /process\.env\./i);

      reqs.push(req("Imports mongoose", importsMongoose, "Import/require mongoose."));
      reqs.push(req("Calls mongoose.connect(...)", callsConnect, "Call mongoose.connect(connectionString)."));
      reqs.push(req("Uses mongodb+srv connection string (or env-based)", hasSrvString, "Use mongodb+srv://... or process.env."));
      return reqs;
    },
  },
  {
    id: "TODO 2",
    name: "Define the schema of the DB (Student schema + model)",
    marks: 5,
    requirements: () => {
      const reqs = [];

      const hasSchema = hasRegex(code, /new\s+mongoose\.schema\s*\(/i) || hasRegex(code, /mongoose\.schema\s*\(/i);
      const hasStudentSchemaName = hasRegex(code, /\bstudentSchema\b/i);
      const hasFields =
        hasRegex(code, /\bname\s*:\s*String\b/i) &&
        hasRegex(code, /\bage\s*:\s*Number\b/i) &&
        hasRegex(code, /\bmajor\s*:\s*String\b/i);

      const hasModel =
        hasRegex(code, /\bmongoose\.model\s*\(\s*["']student["']/i) ||
        (hasRegex(code, /\bmongoose\.model\s*\(/i) && hasRegex(code, /\bstudent\b/i));

      reqs.push(req("Creates a mongoose.Schema", hasSchema, "Use new mongoose.Schema({ ... })."));
      reqs.push(req("Mentions studentSchema (or equivalent variable)", hasStudentSchemaName || hasSchema, "Store schema in a variable (studentSchema)."));
      reqs.push(req("Schema includes name, age, major fields", hasFields, "Include name:String, age:Number, major:String."));
      reqs.push(req("Creates Student model using mongoose.model()", hasModel, 'Use mongoose.model("Student", studentSchema).'));
      return reqs;
    },
  },
  {
    id: "TODO 3",
    name: "Create Document (insertMany or equivalent)",
    marks: 5,
    requirements: () => {
      const reqs = [];

      const hasInsertMany = hasRegex(code, /\bstudent\.insertMany\s*\(/i) || hasRegex(code, /\.insertMany\s*\(/i);
      const hasArrayDocs = hasRegex(code, /\[\s*\{\s*name\s*:/i) && hasRegex(code, /\}\s*,\s*\{\s*name\s*:/i);
      const usesAsync = hasRegex(code, /\basync\s+function\b/i) || hasRegex(code, /\bawait\b/i);

      // accept save() twice too
      const hasSave = hasRegex(code, /\bnew\s+Student\s*\(/i) && hasRegex(code, /\.save\s*\(/i);

      reqs.push(req("Uses async/await (signal)", usesAsync, "Use async/await for DB calls."));
      reqs.push(req("Creates documents using insertMany(...) OR save()", hasInsertMany || hasSave, "Use Student.insertMany(...) or new Student(...).save()."));
      reqs.push(req("Includes multiple documents (array with at least 2 objects) (signal)", hasArrayDocs || hasSave, "Insert at least 2 students."));
      return reqs;
    },
  },
  {
    id: "TODO 4",
    name: "Read Documents (Student.find)",
    marks: 5,
    requirements: () => {
      const reqs = [];

      const hasFind = hasRegex(code, /\bStudent\.find\s*\(/i) || hasRegex(code, /\.find\s*\(/i);
      const logs = hasRegex(code, /\bconsole\.log\s*\(/i);

      reqs.push(req("Uses Student.find(...) (or equivalent)", hasFind, "Use Student.find() to read documents."));
      reqs.push(req("Outputs results (console.log)", logs, "Log the results."));
      return reqs;
    },
  },
  {
    id: "TODO 5",
    name: "Update Document (updateOne or equivalent)",
    marks: 5,
    requirements: () => {
      const reqs = [];

      const hasUpdate =
        hasRegex(code, /\bStudent\.updateOne\s*\(/i) ||
        hasRegex(code, /\bStudent\.updateMany\s*\(/i) ||
        hasRegex(code, /\bStudent\.findOneAndUpdate\s*\(/i);

      const hasFilterByName = hasRegex(code, /\{\s*name\s*:\s*["']ali["']\s*\}/i);
      const hasAgeUpdate = hasRegex(code, /\bage\s*:\s*22\b/i) || hasRegex(code, /\$set\s*:\s*\{\s*age\s*:\s*22/i);

      reqs.push(req("Uses an update method (updateOne/updateMany/findOneAndUpdate)", hasUpdate, "Use updateOne(...) or similar."));
      reqs.push(req("Targets Ali by name (signal)", hasFilterByName, 'Filter like { name: "Ali" }.'));
      reqs.push(req("Updates age field (signal)", hasAgeUpdate, "Update age to 22 (or update age)."));
      return reqs;
    },
  },
  {
    id: "TODO 6",
    name: "Delete Document (deleteOne or equivalent)",
    marks: 5,
    requirements: () => {
      const reqs = [];

      const hasDelete =
        hasRegex(code, /\bStudent\.deleteOne\s*\(/i) ||
        hasRegex(code, /\bStudent\.deleteMany\s*\(/i) ||
        hasRegex(code, /\bStudent\.findOneAndDelete\s*\(/i);

      const hasFilterByName = hasRegex(code, /\{\s*name\s*:\s*["']sara["']\s*\}/i);

      reqs.push(req("Uses a delete method (deleteOne/deleteMany/findOneAndDelete)", hasDelete, "Use deleteOne(...) or similar."));
      reqs.push(req("Targets Sara by name (signal)", hasFilterByName, 'Filter like { name: "Sara" }.'));
      return reqs;
    },
  },
];

/** ---------- Grade Mongoose TODOs ---------- */
let earnedMongoose = 0;

const mongooseResults = mongooseTasks.map((t) => {
  const reqs = status === 2 ? [req("No submission / empty server.js → cannot grade Mongoose TODOs", false)] : t.requirements();
  const { earned } = scoreFromRequirements(reqs, t.marks);
  const earnedSafe = status === 2 ? 0 : earned;
  earnedMongoose += earnedSafe;

  return { id: t.id, name: t.name, earned: earnedSafe, max: t.marks, reqs };
});

const cloudMarks = CLOUD_MAX; // always full
const totalEarned = Math.min(cloudMarks + earnedMongoose + submissionMarks, TOTAL_MAX);

/** ---------- Build Summary ---------- */
const now = new Date().toISOString();

let summary = `# Lab | ${LAB_NAME} | Autograding Summary

- Student: \`${studentId}\`
- ${loadNote}
- ${submissionStatusText}
- Due (Riyadh): \`${DUE_ISO}\`
- Status: **${status}** (0=on time, 1=late, 2=no submission/empty)
- Run: \`${now}\`

## Marks Breakdown

| Item | Marks |
|------|------:|
| Part A: MongoDB Cloud (manual / full) | ${cloudMarks}/${CLOUD_MAX} |
`;

for (const tr of mongooseResults) summary += `| ${tr.id}: ${tr.name} | ${tr.earned}/${tr.max} |\n`;
summary += `| Part B: Mongoose TODOs total | ${earnedMongoose}/${MONGOOSE_MAX} |\n`;
summary += `| Submission | ${submissionMarks}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalEarned} / ${TOTAL_MAX}**

## Detailed Feedback
`;

summary += `\n## Part A: MongoDB Cloud\n- ✅ Full marks awarded automatically: ${cloudMarks}/${CLOUD_MAX}\n`;

summary += `\n## Part B: Mongoose (server.js)\n`;
for (const tr of mongooseResults) {
  summary += `\n### ${tr.id}: ${tr.name}\n`;
  summary += formatReqs(tr.reqs).join("\n") + "\n";
}

/** ---------- Write outputs ---------- */
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

/** DO NOT change CSV structure */
const csv = `student_username,obtained_marks,total_marks,status
${studentId},${totalEarned},100,${status}
`;

fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), summary);

console.log(`✔ Lab graded: ${totalEarned}/100 (status=${status})`);
