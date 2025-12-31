// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// テスト用の環境変数を設定
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = 'test-youtube-api-key'

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
