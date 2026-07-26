const React = require('react');

module.exports = {
  MapContainer: ({ children }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => null,
  Marker: ({ children }) => React.createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }) => React.createElement('div', null, children),
  LayerGroup: ({ children }) => React.createElement('div', null, children),
};
