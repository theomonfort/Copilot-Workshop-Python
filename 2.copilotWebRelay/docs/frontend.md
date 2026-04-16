# フロントエンドドキュメント

## 概要

フロントエンドは React 19 + TypeScript で実装されたシングルページアプリケーションです。Vite 8 でビルドし、バックエンドとは WebSocket で通信します。

## ファイル構成

```
frontend/
├── src/
│   ├── main.tsx      # React エントリポイント
│   ├── App.tsx       # メインチャットコンポーネント
│   ├── App.css       # チャット UI スタイル（ダークテーマ）
│   └── index.css     # グローバルスタイル
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── index.html
└── vite.config.ts
```

## コンポーネント

### `App` コンポーネント (`src/App.tsx`)

アプリケーション全体を管理するメインコンポーネントです。

#### State

| State | 型 | 説明 |
|---|---|---|
| `messages` | `ChatMessage[]` | チャット履歴 |
| `input` | `string` | テキストエリアの入力値 |
| `isConnected` | `boolean` | WebSocket 接続状態 |
| `isResponding` | `boolean` | Copilot が応答中かどうか |

#### `ChatMessage` 型

```ts
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean  // ストリーミング受信中
  isError?: boolean     // エラーメッセージ
}
```

#### Refs

| Ref | 対象 | 用途 |
|---|---|---|
| `wsRef` | `WebSocket` | WebSocket インスタンスの保持 |
| `messagesEndRef` | `<div>` | 最下部へのスクロール用アンカー |
| `textareaRef` | `<textarea>` | テキストエリアの高さリセット |

#### 主要な処理

**WebSocket 接続 (`useEffect`)**
- コンポーネントマウント時に `ws://{host}/ws` へ接続（HTTPS 環境では `wss://`）。
- `onopen` / `onclose` / `onerror` でコネクション状態を更新。
- `onmessage` で `delta` / `done` / `error` の 3 種類のメッセージを処理。
- アンマウント時に `ws.close()` でクリーンアップ。

**メッセージ送信 (`sendMessage`)**
- WebSocket が OPEN 状態かつ `isResponding` が `false` のときのみ送信可能。
- ユーザーメッセージと空のアシスタントメッセージ (`isStreaming: true`) を同時に `messages` に追加。
- `{ type: "chat", content: trimmed }` を送信。

**`delta` 受信**
- 最後のアシスタントメッセージ (`isStreaming: true`) の `content` に追記。

**`done` 受信**
- 最後のアシスタントメッセージの `isStreaming` を `false` に更新。

**`error` 受信**
- ストリーミング中のアシスタントメッセージがあればエラー内容で上書き。
- なければ新規エラーメッセージを追加。

#### キーボードショートカット

| キー | 動作 |
|---|---|
| `Enter` | メッセージ送信 |
| `Shift + Enter` | 改行 |

#### テキストエリアの自動リサイズ

入力に応じてテキストエリアが最大 200px まで自動で高さを変化します。

---

## Markdown レンダリング

アシスタントのメッセージは `react-markdown` で Markdown としてレンダリングします。

- **GFM 拡張** (`remark-gfm`): テーブル、タスクリスト、取り消し線などをサポート。
- **シンタックスハイライト** (`react-syntax-highlighter`): コードブロックを `vscDarkPlus` テーマで表示。
- **インラインコード**: `.inline-code` クラスで背景色付きスタイルを適用。

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '')
      if (match) {
        return <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      }
      return <code className={`inline-code ${className || ''}`}>{children}</code>
    }
  }}
>
  {msg.content}
</ReactMarkdown>
```

---

## CSS テーマ (`src/App.css`)

ダークテーマを CSS カスタムプロパティで定義しています。

### カラー変数

| 変数 | 値 | 用途 |
|---|---|---|
| `--bg-primary` | `#1a1a2e` | アプリ背景 |
| `--bg-secondary` | `#16213e` | ヘッダー・フッター背景 |
| `--bg-input` | `#0f1629` | 入力エリア背景 |
| `--bg-user-msg` | `#4a6cf7` | ユーザーメッセージ背景 |
| `--bg-assistant-msg` | `#252a3a` | アシスタントメッセージ背景 |
| `--bg-error-msg` | `#3d1f1f` | エラーメッセージ背景 |
| `--accent` | `#4a6cf7` | アクセントカラー（ボタン等） |
| `--green` | `#34d399` | 接続中インジケーター |
| `--red` | `#f87171` | 未接続インジケーター・エラー |

### レイアウト

- `max-width: 900px` のセンタリングレイアウト
- ヘッダー・フッターは `flex-shrink: 0`、チャットエリアは `flex: 1` でスクロール可能
- レスポンシブ対応: 600px 以下でパディングとメッセージ幅を調整

### UI 要素

- **タイピングインジケーター**: 3 つのドットがバウンスアニメーション（アシスタント応答待ち時）
- **接続状態ドット**: 接続中は緑色グロー、未接続は赤色グロー
- **メッセージアニメーション**: フェードイン + 下から 4px スライド

---

## エントリポイント (`src/main.tsx`)

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

React の `StrictMode` を有効にして `App` コンポーネントをマウントします。
