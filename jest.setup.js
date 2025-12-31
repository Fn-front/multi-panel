// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// テスト用の環境変数を設定
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = 'test-youtube-api-key'

// テスト警告を抑制
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      // react-playerの動的ロードによるact警告を抑制
      if (args[0].includes('An update to ForwardRef(LoadableComponent) inside a test was not wrapped in act')) {
        return
      }
      // HTMLFormElement.requestSubmitの未実装警告を抑制（polyfillで対応済み）
      if (args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit')) {
        return
      }
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

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
