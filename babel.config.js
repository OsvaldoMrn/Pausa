module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // AÑADE ESTA SECCIÓN DE 'PLUGINS'
    plugins: [
      // ESTA LÍNEA ES LA QUE FALTA
      // Importante: Debe ser el ÚLTIMO plugin de la lista
      'react-native-reanimated/plugin',
    ],
  };
};