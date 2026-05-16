module.exports = {
  packagerConfig: {
    icon: './app_icon/ico',
    asar: {
      unpack: 'node_modules'
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  // plugins: [{
  //   name: '@electron-forge/plugin-auto-unpack-natives',
  //   config: {}
  // }]
};
