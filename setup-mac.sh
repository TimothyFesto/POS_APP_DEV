#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "================================================"
echo "M Generation II POS - macOS setup"
echo "================================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found."
  echo "Install Node.js LTS from https://nodejs.org/ and run this script again."
  exit 1
fi

node --version
npm --version

echo
echo "Checking macOS tools..."
if ! command -v sips >/dev/null 2>&1 || ! command -v iconutil >/dev/null 2>&1; then
  echo "sips/iconutil are required and are normally included with macOS."
  exit 1
fi

echo
echo "Creating macOS application icon (.icns)..."
rm -rf build/app-icon.iconset build/app-icon.icns
mkdir -p build/app-icon.iconset

# Generate the standard macOS icon sizes from the supplied PNG.
sips -z 16 16     build/app-icon.png --out build/app-icon.iconset/icon_16x16.png >/dev/null
sips -z 32 32     build/app-icon.png --out build/app-icon.iconset/icon_16x16@2x.png >/dev/null
sips -z 32 32     build/app-icon.png --out build/app-icon.iconset/icon_32x32.png >/dev/null
sips -z 64 64     build/app-icon.png --out build/app-icon.iconset/icon_32x32@2x.png >/dev/null
sips -z 128 128   build/app-icon.png --out build/app-icon.iconset/icon_128x128.png >/dev/null
sips -z 256 256   build/app-icon.png --out build/app-icon.iconset/icon_128x128@2x.png >/dev/null
sips -z 256 256   build/app-icon.png --out build/app-icon.iconset/icon_256x256.png >/dev/null
sips -z 512 512   build/app-icon.png --out build/app-icon.iconset/icon_256x256@2x.png >/dev/null
sips -z 512 512   build/app-icon.png --out build/app-icon.iconset/icon_512x512.png >/dev/null
sips -z 1024 1024 build/app-icon.png --out build/app-icon.iconset/icon_512x512@2x.png >/dev/null
iconutil -c icns build/app-icon.iconset -o build/app-icon.icns
rm -rf build/app-icon.iconset

echo ""
echo "Installing project dependencies..."
npm install

echo ""
echo "Building universal macOS DMG (Intel + Apple Silicon)..."
npm run dist:mac:universal

echo ""
echo "Build complete. Your DMG is in the release folder."
