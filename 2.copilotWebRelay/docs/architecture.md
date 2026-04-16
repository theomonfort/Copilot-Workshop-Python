# アーキテクチャ概要

## システム構成

Copilot Web Relay は、ブラウザから GitHub Copilot とリアルタイムチャットを行うための Web アプリケーションです。npm workspaces を使用して **backend** と **frontend** の 2 つのパッケージで構成されています。

```
2.copilotWebRelay/
├── package.json          # ルートワークスペース設定
├── backend/              # Express + WebSocket サーバー
│   └── src/server.ts
└── frontend/             # React (Vite) クライアント
    └── src/App.tsx
```

## コンポーネント図

```
ブラウザ (React)
     │
     │  WebSocket (ws://.../ws)
     ▼
Express サーバー (port 3001)
     │
     │  @github/copilot-sdk
     ▼
GitHub Copilot API
```

## バックエンド

- **フレームワーク**: Express 4.x
- **WebSocket**: `ws` ライブラリ (`WebSocketServer`)
- **Copilot 統合**: `@github/copilot-sdk` の `CopilotClient`
- **ポート**: デフォルト `3001`（環境変数 `PORT` で変更可）

### 処理フロー

1. WebSocket クライアントが `/ws` に接続すると、`CopilotClient` を初期化して `client.start()` を呼び出す。
2. 最初のメッセージ送信時に `client.createSession({ model: "gpt-4.1", onPermissionRequest: approveAll })` でセッションを作成する。
3. セッションは接続ごとに 1 つ再利用し、メッセージはキュー (`messageQueue`) で順次処理する。
4. `assistant.message_delta` イベントでストリーミングデルタを受け取り、クライアントに送信する。
5. `session.idle` イベントで応答完了を通知し、次のキューを処理する。
6. WebSocket 切断時に `session.disconnect()` と `client.stop()` でリソースを解放する。

## フロントエンド

- **フレームワーク**: React 19 + TypeScript (Vite 8)
- **WebSocket**: ブラウザネイティブ `WebSocket` API
- **Markdown レンダリング**: `react-markdown` + `remark-gfm` + `react-syntax-highlighter`
- **テーマ**: ダークテーマ（CSS カスタムプロパティ）

### WebSocket プロキシ

開発時、Vite の dev server (`localhost:5173`) は `/ws` へのリクエストを `localhost:3001` にプロキシする。

```ts
// vite.config.ts
server: {
  proxy: {
    '/ws': { target: 'http://localhost:3001', ws: true }
  }
}
```

## データフロー

```
ユーザー入力
    │ { type: "chat", content: "..." }
    ▼
フロントエンド (WebSocket 送信)
    │
    ▼
バックエンド (メッセージキュー → session.send)
    │
    ▼ assistant.message_delta × N
    │ { type: "delta", content: "..." }
    ▼
フロントエンド (ストリーミング表示)
    │
    ▼ session.idle
    │ { type: "done" }
    ▼
フロントエンド (ストリーミング完了)
```
