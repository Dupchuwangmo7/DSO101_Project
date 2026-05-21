// Mock for @xenova/transformers — ESM module not compatible with Jest/CommonJS
// The real module is used at runtime; this mock is only used during testing.
const pipeline = jest.fn().mockResolvedValue(
  jest.fn().mockResolvedValue([{ label: 'MOCK', score: 1.0 }])
);
 
module.exports = { pipeline };
 