# セットアップ・開発ガイド

## 前提条件

- **Node.js**: v18 以上推奨
- **npm**: v8 以上（npm workspaces 対応）
- **GitHub Copilot**: 有効なサブスクリプションと認証情報

## インストール

リポジトリのルートから以下を実行します。

```bash
cd 2.copilotWebRelay

# 全パッケージの依存関係をインストール
npm install
```

> `npm workspaces` を使用しているため、`npm install` を一度実行するだけで `backend` と `frontend` 両方の依存関係がインストールされます。

## 開発サーバーの起動

```bash
npm run dev
```

`concurrently` によりバックエンドとフロントエンドが同時に起動します。

| サービス    | URL                          | 説明                       |
|------------|------------------------------|----------------------------|
| バックエンド | `http://localhost:3001`      | Express + WebSocket サーバー |
| フロントエンド | `http://localhost:5173`    | Vite 開発サーバー            |
| WebSocket  | `ws://localhost:3001/ws`     | バックエンド直接接続          |
| WebSocket (Vite 経由) | `ws://localhost:5173/ws` | Vite プロキシ経由 |

ブラウザで `http://localhost:5173` を開くとチャット UI が表示されます。

## npm スクリプト一覧

### ルートワークスペース (`2.copilotWebRelay/`)

| スクリプト      | コマンド                                              | 説明                            |
|---------------|-------------------------------------------------------|---------------------------------|
| `dev`         | `concurrently "npm run dev -w backend" "npm run dev -w frontend"` | バックエンド・フロントエンドを同時起動 |
| `build`       | `npm run build -w backend && npm run build -w frontend` | 両パッケージをビルド             |
| `install:all` | `npm install -w backend && npm install -w frontend`   | 各パッケージの依存関係をインストール |

### バックエンド (`backend/`)

| スクリプト | コマンド            | 説明                            |
|-----------|---------------------|---------------------------------|
| `dev`     | `tsx src/server.ts` | `tsx` で TypeScript を直接実行  |
| `build`   | `tsc`               | TypeScript をコンパイル（`dist/` に出力） |

### フロントエンド (`frontend/`)

| スクリプト  | コマンド              | 説明                          |
|------------|----------------------|-------------------------------|
| `dev`      | `vite`               | Vite 開発サーバー起動          |
| `build`    | `tsc -b && vite build` | 型チェック後に本番ビルド       |
| `lint`     | `eslint .`           | ESLint によるコード検証        |
| `preview`  | `vite preview`       | 本番ビルドのプレビュー          |

## 本番ビルド

```bash
npm run build
```

- バックエンド: `backend/dist/server.js` に出力
- フロントエンド: `frontend/dist/` に静的ファイルを出力

## Vite プロキシ設定

開発時、フロントエンド (`localhost:5173`) からの `/ws` リクエストはバックエンド (`localhost:3001`) に自動でプロキシされます。

```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/ws': {
      target: 'http://localhost:3001',
      ws: true,  // WebSocket プロキシを有効化
    },
  },
},
```

## TypeScript 設定

### バックエンド (`backend/tsconfig.json`)

| オプション          | 値          | 説明                          |
|--------------------|-------------|-------------------------------|
| `target`           | `ES2022`    | 出力 JS のターゲットバージョン  |
| `module`           | `Node16`    | Node.js ESM モジュール形式     |
| `moduleResolution` | `Node16`    | Node.js 16 のモジュール解決    |
| `outDir`           | `dist`      | コンパイル出力先               |
| `strict`           | `true`      | 厳格な型チェック               |

## 依存関係

### バックエンド

| パッケージ             | バージョン  | 用途                              |
|-----------------------|------------|-----------------------------------|
| `@github/copilot-sdk` | latest     | GitHub Copilot API クライアント   |
| `express`             | `^4.21.0`  | HTTP サーバー                     |
| `cors`                | `^2.8.5`   | CORS ミドルウェア                 |
| `ws`                  | `^8.18.0`  | WebSocket サーバー                |
| `tsx`                 | `^4.19.0`  | TypeScript 直接実行（開発用）     |
| `typescript`          | `^5.6.0`   | TypeScript コンパイラー           |

### フロントエンド

| パッケージ                  | バージョン   | 用途                             |
|---------------------------|-------------|----------------------------------|
| `react`                   | `^19.2.4`  | UI フレームワーク                 |
| `react-dom`               | `^19.2.4`  | DOM レンダリング                  |
| `react-markdown`          | `^10.1.0`  | Markdown レンダリング             |
| `remark-gfm`              | `^4.0.1`   | GFM (GitHub Flavored Markdown) 拡張 |
| `react-syntax-highlighter`| `^16.1.1`  | コードシンタックスハイライト       |
| `vite`                    | `^8.0.4`   | ビルドツール・開発サーバー        |
| `@vitejs/plugin-react`    | `^6.0.1`   | Vite React プラグイン            |
| `typescript`              | `~6.0.2`   | TypeScript コンパイラー           |
