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

// HTMLFormElement.prototype.requestSubmit のpolyfill
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function (submitter) {
    if (submitter) {
      submitter.click()
    } else {
      this.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  }
}
