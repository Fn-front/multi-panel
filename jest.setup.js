// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// fetchのpolyfillを追加
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    clone: () => ({ ok: true }),
  })
)
