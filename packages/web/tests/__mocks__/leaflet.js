const L = {
  map: jest.fn(() => ({
    setView: jest.fn().mockReturnThis(),
    remove: jest.fn(),
    addLayer: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
  marker: jest.fn(() => ({ addTo: jest.fn(), bindPopup: jest.fn().mockReturnThis() })),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
};

module.exports = L;
