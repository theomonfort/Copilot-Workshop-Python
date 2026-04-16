# セットアップ・開発ガイド

## 前提条件

- **Node.js**: v18 以上
- **npm**: v8 以上（workspaces 対応）
- **GitHub Copilot**: `@github/copilot-sdk` を使用するため、Copilot へのアクセス権が必要

## インストール

リポジトリのルートから以下を実行します：

```bash
cd 2.copilotWebRelay
npm install
```

> `npm install` は workspaces の設定により `backend/` と `frontend/` の依存パッケージを一括インストールします。

個別にインストールする場合：

```bash
npm run install:all
```

## 開発サーバーの起動

```bash
npm run dev
```

`concurrently` を使って backend と frontend を同時に起動します。

| サービス | URL |
|---|---|
| フロントエンド (Vite) | `http://localhost:5173` |
| バックエンド (Express) | `http://localhost:3001` |
| WebSocket | `ws://localhost:3001/ws` |

フロントエンドの `/ws` へのリクエストは Vite プロキシ経由でバックエンドに転送されます。

## ビルド

```bash
npm run build
```

バックエンドの TypeScript コンパイルとフロントエンドの Vite ビルドを順番に実行します。

- バックエンドの出力先: `backend/dist/`
- フロントエンドの出力先: `frontend/dist/`

## npm スクリプト一覧

### ルート (`2.copilotWebRelay/package.json`)

| スクリプト | 説明 |
|---|---|
| `npm run dev` | backend + frontend を同時起動 |
| `npm run build` | backend → frontend の順にビルド |
| `npm run install:all` | 全ワークスペースの依存をインストール |

### バックエンド (`backend/`)

| スクリプト | 説明 |
|---|---|
| `npm run dev` | `tsx src/server.ts` で TypeScript を直接実行 |
| `npm run build` | `tsc` で `dist/` にコンパイル |

### フロントエンド (`frontend/`)

| スクリプト | 説明 |
|---|---|
| `npm run dev` | Vite 開発サーバー起動 |
| `npm run build` | `tsc -b && vite build` でプロダクションビルド |
| `npm run lint` | ESLint でコードチェック |
| `npm run preview` | ビルド済みの成果物をプレビュー |

## 環境変数

### バックエンド

| 変数 | デフォルト | 説明 |
|---|---|---|
| `PORT` | `3001` | Express サーバーのリスニングポート |

## ディレクトリ構成

```
2.copilotWebRelay/
├── package.json          # ルートワークスペース（concurrently を devDeps に持つ）
├── backend/
│   ├── package.json      # backend 依存関係（express, ws, @github/copilot-sdk 等）
│   ├── tsconfig.json     # TypeScript 設定（ES2022, Node16 モジュール）
│   └── src/
│       └── server.ts     # Express + WebSocket + CopilotClient
└── frontend/
    ├── package.json      # frontend 依存関係（react, react-markdown 等）
    ├── vite.config.ts    # Vite 設定（/ws プロキシ設定）
    ├── index.html        # HTML エントリポイント
    └── src/
        ├── main.tsx      # React エントリポイント
        ├── App.tsx       # メインチャットコンポーネント
        ├── App.css       # チャット UI スタイル
        └── index.css     # グローバルスタイル
```

## 主要な依存パッケージ

### バックエンド

| パッケージ | バージョン | 用途 |
|---|---|---|
| `@github/copilot-sdk` | latest | GitHub Copilot API クライアント |
| `express` | ^4.21.0 | HTTP サーバー |
| `ws` | ^8.18.0 | WebSocket サーバー |
| `cors` | ^2.8.5 | CORS ミドルウェア |
| `tsx` | ^4.19.0 | TypeScript の直接実行（開発用） |

### フロントエンド

| パッケージ | バージョン | 用途 |
|---|---|---|
| `react` | ^19.2.4 | UI フレームワーク |
| `react-markdown` | ^10.1.0 | Markdown レンダリング |
| `remark-gfm` | ^4.0.1 | GFM (GitHub Flavored Markdown) 拡張 |
| `react-syntax-highlighter` | ^16.1.1 | コードブロックのシンタックスハイライト |
| `vite` | ^8.0.4 | ビルドツール・開発サーバー |
