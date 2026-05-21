'use strict';
const pipeline = jest.fn(() =>
  Promise.resolve(
    jest.fn(() => Promise.resolve([{ label: 'MOCK', score: 1.0 }]))
  )
);
module.exports = { pipeline };
 