mv ./dist/node_modules ./dist_node_modules
rm -rf ./dist
# make app
mv ./@watsonserve/electron/build ./dist
cp -rf ./@watsonserve/electron/app_icon ./dist/
cp ./@watsonserve/electron/src/ico.ico ./dist/
cp ./@watsonserve/electron/src/icoTemplate.png ./dist/
# make views
mv ./@watsonserve/web/build ./dist/views
# make bg
mkdir ./dist/bg
cp ./@watsonserve/audio-player/index.html ./dist/bg/
cp ./@watsonserve/audio-player/*.js ./dist/bg/
cp ./@watsonserve/audio-player/index.wasm ./dist/bg/
# make env
cp ./@watsonserve/electron/dist.json ./dist/package.json
cp ./@watsonserve/electron/forge.config.js ./dist/
cp ./.yarnrc ./dist/

cp ./.space-setting.json ./dist/
mv ./dist_node_modules ./dist/node_modules
