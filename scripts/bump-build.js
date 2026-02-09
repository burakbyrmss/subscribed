#!/usr/bin/env node

/**
 * Increment build number only (x.x.x (n) -> x.x.x (n+1)).
 * Updates: android/app/build.gradle, ios/subnote/Info.plist, ios/subnote.xcodeproj/project.pbxproj
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function getCurrentBuildNumber() {
  // Read from android (versionCode)
  const buildGradlePath = path.join(root, "android", "app", "build.gradle");
  const gradle = fs.readFileSync(buildGradlePath, "utf8");
  const match = gradle.match(/versionCode\s+(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function main() {
  const currentBuild = getCurrentBuildNumber();
  const newBuild = currentBuild + 1;

  // 1. android/app/build.gradle (versionCode)
  const buildGradlePath = path.join(root, "android", "app", "build.gradle");
  let gradle = fs.readFileSync(buildGradlePath, "utf8");
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newBuild}`);
  fs.writeFileSync(buildGradlePath, gradle);
  console.log("android/app/build.gradle: versionCode", currentBuild, "->", newBuild);

  // 2. ios/subnote/Info.plist (CFBundleVersion)
  const infoPlistPath = path.join(root, "ios", "subnote", "Info.plist");
  let infoPlist = fs.readFileSync(infoPlistPath, "utf8");
  infoPlist = infoPlist.replace(
    /<key>CFBundleVersion<\/key>\s*<string>[^<]+<\/string>/,
    `<key>CFBundleVersion</key>\n    <string>${newBuild}</string>`
  );
  fs.writeFileSync(infoPlistPath, infoPlist);
  console.log("ios/subnote/Info.plist: CFBundleVersion", currentBuild, "->", newBuild);

  // 3. ios/subnote.xcodeproj/project.pbxproj (CURRENT_PROJECT_VERSION)
  const pbxPath = path.join(root, "ios", "subnote.xcodeproj", "project.pbxproj");
  let pbx = fs.readFileSync(pbxPath, "utf8");
  pbx = pbx.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${newBuild};`);
  fs.writeFileSync(pbxPath, pbx);
  console.log("ios/subnote.xcodeproj/project.pbxproj: CURRENT_PROJECT_VERSION", currentBuild, "->", newBuild);

  console.log("\nDone. Build number is now", newBuild + ".");
}

main();
