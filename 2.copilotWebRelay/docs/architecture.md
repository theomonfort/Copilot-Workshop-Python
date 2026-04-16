# アーキテクチャ概要

## システム構成

Copilot Web Relay は、ブラウザから GitHub Copilot とリアルタイムチャットを行うための Web アプリケーションです。**npm workspaces** による monorepo 構成で、`backend` と `frontend` の 2 つのパッケージで構成されています。

```
2.copilotWebRelay/
├── package.json          # ルートワークスペース設定
├── backend/              # Express + WebSocket サーバー
│   ├── src/
│   │   └── server.ts     # メインサーバー実装
│   ├── package.json
│   └── tsconfig.json
└── frontend/             # React チャット UI
    ├── src/
    │   ├── App.tsx        # メインコンポーネント
    │   ├── App.css        # スタイル
    │   ├── main.tsx       # エントリーポイント
    │   └── index.css
    ├── vite.config.ts
    └── package.json
```

## コンポーネント構成

```
ブラウザ (React)
    │
    │  WebSocket (/ws)
    │  ws:// または wss://
    ▼
バックエンド (Express + ws)
    │  ポート 3001
    │
    │  @github/copilot-sdk
    ▼
GitHub Copilot API
```

### バックエンド

- **フレームワーク**: Express 4.x
- **WebSocket**: `ws` ライブラリ（パス: `/ws`）
- **Copilot 統合**: `@github/copilot-sdk` の `CopilotClient`
- **ポート**: `3001`
- **実行環境**: Node.js ESM モジュール（`tsx` でトランスパイル不要な開発実行）

### フロントエンド

- **フレームワーク**: React 19 (Vite ビルド)
- **WebSocket**: ブラウザネイティブ `WebSocket` API
- **Markdown レンダリング**: `react-markdown` + `remark-gfm` + `react-syntax-highlighter`
- **開発サーバー**: Vite（`/ws` を `localhost:3001` にプロキシ）

## WebSocket 通信フロー

### 接続確立

1. フロントエンドが `/ws` に WebSocket 接続
2. バックエンドで `CopilotClient` を初期化 (`client.start()`)

### メッセージ送受信

```
フロントエンド                          バックエンド
    │                                      │
    │── { type: "chat", content: "..." } ──▶│
    │                                      │ messageQueue に追加
    │                                      │ processQueue() を呼び出し
    │                                      │ ensureSession() でセッション作成
    │                                      │ session.send({ prompt: content })
    │                                      │
    │◀── { type: "delta", content: "..." } ─│ assistant.message_delta イベント
    │◀── { type: "delta", content: "..." } ─│ (複数回ストリーミング)
    │◀── { type: "done" } ─────────────────│ session.idle イベント
    │                                      │
```

### エラー発生時

```
フロントエンド                          バックエンド
    │                                      │
    │◀── { type: "error", content: "..." } ─│ 初期化失敗 or 処理中エラー
    │                                      │
```

### 切断時

バックエンドは切断時に以下のクリーンアップを実施:
1. `session.disconnect()` でセッション終了
2. `client.stop()` でクライアント停止

## メッセージキュー

バックエンドはメッセージキュー (`messageQueue`) を実装しており、Copilot セッションが処理中（`isProcessing = true`）の場合、次のメッセージをキューに積んで順番に処理します。これにより、複数メッセージの連続送信に対応しています。

## セッション管理

各 WebSocket 接続に対して個別の `CopilotClient` と `session` が作成されます。セッションは初回のメッセージ送信時（`ensureSession()`）に生成され、モデルは `gpt-4.1` が使用されます。
