#!/usr/bin/env node

/**
 * Deployment test script to verify build and functionality
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting deployment test...\n");

// Test 1: Clean build
console.log("1. Testing clean build...");
try {
  execSync("rm -rf .next out", { stdio: "inherit" });
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build successful\n");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Test 2: Verify static export
console.log("2. Verifying static export...");
const outDir = path.join(process.cwd(), "out");
if (!fs.existsSync(outDir)) {
  console.error("❌ Output directory not found");
  process.exit(1);
}

const indexFile = path.join(outDir, "index.html");
if (!fs.existsSync(indexFile)) {
  console.error("❌ index.html not found in output");
  process.exit(1);
}

console.log("✅ Static export successful\n");

// Test 3: Verify essential files
console.log("3. Verifying essential files...");
const essentialFiles = [
  "index.html",
  "_next/static/css",
  "_next/static/chunks",
];

for (const file of essentialFiles) {
  const filePath = path.join(outDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Essential file missing: ${file}`);
    process.exit(1);
  }
}

console.log("✅ All essential files present\n");

// Test 4: Check bundle size
console.log("4. Checking bundle size...");
const statsFile = path.join(process.cwd(), ".next/analyze/client.html");
if (fs.existsSync(statsFile)) {
  console.log("📊 Bundle analysis available at .next/analyze/client.html");
}

// Test 5: Verify HTML content
console.log("5. Verifying HTML content...");
const htmlContent = fs.readFileSync(indexFile, "utf8");

const requiredContent = [
  "Cross Country Timer",
  "viewport",
  "mobile-web-app-capable",
];

for (const content of requiredContent) {
  if (!htmlContent.includes(content)) {
    console.error(`❌ Required content missing: ${content}`);
    process.exit(1);
  }
}

console.log("✅ HTML content verified\n");

console.log("🎉 All deployment tests passed!");
console.log("\nNext steps:");
console.log("- Deploy to Vercel: vercel --prod");
console.log("- Or deploy to any static host using the /out directory");
console.log("- Run bundle analysis: npm run build:analyze");
