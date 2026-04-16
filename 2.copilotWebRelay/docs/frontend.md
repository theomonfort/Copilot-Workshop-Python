# フロントエンド ドキュメント

## 概要

フロントエンドは **React 19** + **Vite** で構築されたシングルページアプリケーションです。WebSocket を通じてバックエンドと通信し、Copilot の応答をリアルタイムにストリーミング表示します。

## ファイル構成

```
frontend/src/
├── App.tsx       # メインチャットコンポーネント
├── App.css       # チャット UI スタイル（ダークテーマ）
├── main.tsx      # React エントリーポイント
└── index.css     # グローバルスタイル
```

## コンポーネント

### `App` コンポーネント (`App.tsx`)

アプリケーション全体を管理する単一コンポーネントです。

#### 状態管理

| 状態           | 型                 | 初期値  | 説明                              |
|---------------|--------------------|---------|-----------------------------------|
| `messages`    | `ChatMessage[]`    | `[]`    | チャットメッセージ一覧              |
| `input`       | `string`           | `""`    | テキスト入力の現在値               |
| `isConnected` | `boolean`          | `false` | WebSocket 接続状態                |
| `isResponding`| `boolean`          | `false` | Copilot が応答中かどうか           |

#### `ChatMessage` インターフェース

```typescript
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean  // ストリーミング中は true
  isError?: boolean     // エラーメッセージは true
}
```

#### Refs

| Ref              | 型                          | 用途                       |
|-----------------|-----------------------------|----------------------------|
| `wsRef`         | `WebSocket \| null`         | WebSocket インスタンス保持  |
| `messagesEndRef`| `HTMLDivElement \| null`    | 最下部への自動スクロール    |
| `textareaRef`   | `HTMLTextAreaElement \| null`| テキストエリアの高さリセット |

#### WebSocket 接続

コンポーネントマウント時（`useEffect`）に WebSocket 接続を確立します。

- URL は `window.location.host` から動的に生成（HTTPS 環境では `wss://` を使用）
- 接続先: `ws://<host>/ws`
- アンマウント時に `ws.close()` で切断

#### メッセージ送信 (`sendMessage`)

以下の条件がすべて満たされた場合のみ送信可能:
- 入力が空白でない
- WebSocket が `OPEN` 状態
- `isResponding` が `false`（Copilot が応答中でない）

送信時の処理:
1. ユーザーメッセージと空のアシスタントメッセージ（`isStreaming: true`）を状態に追加
2. `{ type: "chat", content: "..." }` を WebSocket で送信
3. テキストエリアの高さをリセット

#### メッセージ受信処理

| メッセージタイプ | 処理内容                                                          |
|---------------|------------------------------------------------------------------|
| `delta`       | 最後のアシスタントメッセージの `content` に `data.content` を追記  |
| `done`        | 最後のアシスタントメッセージの `isStreaming` を `false` に更新     |
| `error`       | エラーメッセージを表示（既存のストリーミング中メッセージを置換または新規追加） |

#### キーボードショートカット

| キー            | 動作                      |
|----------------|---------------------------|
| `Enter`        | メッセージ送信              |
| `Shift + Enter`| テキストエリアで改行        |

#### テキストエリア自動リサイズ

入力内容に応じてテキストエリアの高さを自動調整します（最大 `200px`）。

---

## Markdown レンダリング

アシスタントのメッセージは `react-markdown` + `remark-gfm` でレンダリングされます。

### 対応している Markdown 要素

- **GFM (GitHub Flavored Markdown)**: テーブル、タスクリスト、打ち消し線など
- **コードブロック**: 言語指定付きは `react-syntax-highlighter`（`vscDarkPlus` テーマ）でシンタックスハイライト
- **インラインコード**: `.inline-code` クラスでスタイル適用
- 見出し（h1〜h4）、リスト、リンク、引用符、テーブルなど

### コードブロック処理の例

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      if (match) {
        // シンタックスハイライト付きコードブロック
        return <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
          {codeString}
        </SyntaxHighlighter>
      }
      // インラインコード
      return <code className={`inline-code ${className || ''}`} {...props}>{children}</code>
    },
  }}
>
  {msg.content}
</ReactMarkdown>
```

---

## UI 構成

```
┌─────────────────────────────────────┐
│ header                              │
│  "Copilot Chat"          ● 接続中  │
├─────────────────────────────────────┤
│ chat-area (スクロール可能)           │
│                                     │
│              [ユーザーメッセージ]    │
│  [アシスタントメッセージ]            │
│              [ユーザーメッセージ]    │
│  [● ● ●] ← タイピングインジケーター │
│                                     │
├─────────────────────────────────────┤
│ input-area                          │
│  [メッセージを入力...    ] [→送信]  │
└─────────────────────────────────────┘
```

---

## スタイル (`App.css`)

### ダークテーマ CSS 変数

| 変数                | デフォルト値  | 用途                    |
|--------------------|-------------|-------------------------|
| `--bg-primary`     | `#1a1a2e`   | アプリ背景              |
| `--bg-secondary`   | `#16213e`   | ヘッダー・フッター背景   |
| `--bg-input`       | `#0f1629`   | 入力エリア背景           |
| `--bg-user-msg`    | `#4a6cf7`   | ユーザーメッセージ背景   |
| `--bg-assistant-msg`| `#252a3a`  | アシスタントメッセージ背景|
| `--bg-error-msg`   | `#3d1f1f`   | エラーメッセージ背景     |
| `--text-primary`   | `#e0e0e0`   | メインテキスト色         |
| `--text-secondary` | `#a0a0b8`   | サブテキスト色           |
| `--accent`         | `#4a6cf7`   | アクセントカラー（送信ボタンなど）|
| `--green`          | `#34d399`   | 接続中ステータス色       |
| `--red`            | `#f87171`   | 切断・エラー色           |

### レスポンシブ対応

`max-width: 600px` のブレークポイントで、メッセージバブルの最大幅を `75%` から `88%` に拡大し、パディングを縮小します。

### タイピングインジケーター

3 つの円が `bounce` アニメーションで交互に上下し、Copilot が応答を準備中であることを示します（応答テキストが届くまで表示）。

---

## エントリーポイント (`main.tsx`)

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`StrictMode` を使用しており、開発環境では副作用（WebSocket 接続など）が 2 回実行される場合があります。
