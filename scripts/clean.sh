#!/bin/bash

set +e

echo "🧹 Universal JS/React Native cleanup started..."

# -----------------------------------
# Helpers
# -----------------------------------

remove_if_exists () {
  if [ -e "$1" ]; then
    echo "🗑 Removing $1"
    rm -rf "$1"
  fi
}

# -----------------------------------
# Kill processes
# -----------------------------------

echo ""
echo "🔪 Killing Metro / Node processes..."

pkill -f "metro" || true
pkill -f "react-native" || true

# -----------------------------------
# Watchman
# -----------------------------------

if command -v watchman >/dev/null 2>&1; then
  echo ""
  echo "👀 Clearing Watchman..."
  watchman watch-del-all || true
fi

# -----------------------------------
# Root project caches
# -----------------------------------

echo ""
echo "📦 Cleaning root caches..."

remove_if_exists "node_modules"

# Package manager caches / locks
remove_if_exists "package-lock.json"
remove_if_exists "yarn.lock"
remove_if_exists "pnpm-lock.yaml"
remove_if_exists "bun.lockb"

# General JS caches
remove_if_exists ".turbo"
remove_if_exists ".nx"
remove_if_exists ".cache"
remove_if_exists ".eslintcache"

# -----------------------------------
# Next.js
# -----------------------------------

echo ""
echo "▲ Cleaning Next.js..."

remove_if_exists ".next"
remove_if_exists "out"

# -----------------------------------
# Expo
# -----------------------------------

echo ""
echo "📱 Cleaning Expo..."

remove_if_exists ".expo"
remove_if_exists ".expo-shared"

# -----------------------------------
# Vite
# -----------------------------------

echo ""
echo "⚡ Cleaning Vite..."

remove_if_exists "dist"
remove_if_exists ".vite"

# -----------------------------------
# React Native Android
# -----------------------------------

echo ""
echo "🤖 Cleaning Android..."

remove_if_exists "android/.gradle"
remove_if_exists "android/build"
remove_if_exists "android/app/build"
remove_if_exists "android/.cxx"
remove_if_exists "android/app/.cxx"

# -----------------------------------
# React Native iOS
# -----------------------------------

echo ""
echo "🍎 Cleaning iOS..."

remove_if_exists "ios/build"
remove_if_exists "ios/Pods"
remove_if_exists "ios/Podfile.lock"

# Xcode DerivedData
remove_if_exists "$HOME/Library/Developer/Xcode/DerivedData"

# -----------------------------------
# Metro / Haste caches
# -----------------------------------

echo ""
echo "🚇 Cleaning Metro cache..."

remove_if_exists "/tmp/metro-*"
remove_if_exists "/tmp/haste-map-*"

# -----------------------------------
# Gradle global cache (optional)
# Uncomment if wanted
# -----------------------------------

# remove_if_exists "$HOME/.gradle/caches"
# remove_if_exists "$HOME/.gradle/daemon"

# -----------------------------------
# npm/yarn/pnpm cache (optional)
# Uncomment if wanted
# -----------------------------------

# npm cache clean --force
# yarn cache clean
# pnpm store prune

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. npm install / yarn / pnpm"
echo "2. cd ios && pod install (React Native only)"
echo "3. Rebuild project"