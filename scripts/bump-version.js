#!/usr/bin/env node

/**
 * Bump version (x.x.x -> x.x.(x+1)) and reset iOS build number to 1.
 * Android versionCode is incremented; versionName is set to the new version.
 * Updates: app.json, package.json, android/app/build.gradle, ios/subnote/Info.plist, ios/subnote.xcodeproj/project.pbxproj
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function incrementPatch(version) {
  const parts = version.split(".");
  if (parts.length < 3) return version;
  const patch = parseInt(parts[2], 10) || 0;
  parts[2] = String(patch + 1);
  return parts.join(".");
}

function main() {
  // 1. app.json (expo.version)
  const appJsonPath = path.join(root, "app.json");
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
  const currentVersion = appJson.expo?.version || "1.0.0";
  const newVersion = incrementPatch(currentVersion);

  appJson.expo = appJson.expo || {};
  appJson.expo.version = newVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + "\n");
  console.log("app.json: version", currentVersion, "->", newVersion);

  // 2. package.json (version)
  const pkgPath = path.join(root, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("package.json: version", currentVersion, "->", newVersion);

  // 3. android/app/build.gradle (versionCode += 1, versionName = newVersion)
  const buildGradlePath = path.join(root, "android", "app", "build.gradle");
  let gradle = fs.readFileSync(buildGradlePath, "utf8");
  const versionCodeMatch = gradle.match(/versionCode\s+(\d+)/);
  const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1], 10) : 1;
  const newVersionCode = currentVersionCode + 1;
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`);
  gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`);
  fs.writeFileSync(buildGradlePath, gradle);
  console.log("android/app/build.gradle: versionName ->", newVersion, ", versionCode ->", newVersionCode);

  // 4. ios/subnote/Info.plist (CFBundleShortVersionString, CFBundleVersion)
  const infoPlistPath = path.join(root, "ios", "subnote", "Info.plist");
  let infoPlist = fs.readFileSync(infoPlistPath, "utf8");
  infoPlist = infoPlist.replace(
    /<key>CFBundleShortVersionString<\/key>\s*<string>[^<]+<\/string>/,
    `<key>CFBundleShortVersionString</key>\n    <string>${newVersion}</string>`
  );
  infoPlist = infoPlist.replace(
    /<key>CFBundleVersion<\/key>\s*<string>[^<]+<\/string>/,
    `<key>CFBundleVersion</key>\n    <string>1</string>`
  );
  fs.writeFileSync(infoPlistPath, infoPlist);
  console.log("ios/subnote/Info.plist: CFBundleShortVersionString ->", newVersion, ", CFBundleVersion -> 1");

  // 5. ios/subnote.xcodeproj/project.pbxproj (CURRENT_PROJECT_VERSION = 1, MARKETING_VERSION = newVersion)
  const pbxPath = path.join(root, "ios", "subnote.xcodeproj", "project.pbxproj");
  let pbx = fs.readFileSync(pbxPath, "utf8");
  pbx = pbx.replace(/CURRENT_PROJECT_VERSION = \d+;/g, "CURRENT_PROJECT_VERSION = 1;");
  pbx = pbx.replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${newVersion};`);
  fs.writeFileSync(pbxPath, pbx);
  console.log("ios/subnote.xcodeproj/project.pbxproj: MARKETING_VERSION ->", newVersion, ", CURRENT_PROJECT_VERSION -> 1");

  console.log("\nDone. Version is now", newVersion, "(build 1).");
}

main();
