# API リファレンス

## HTTP エンドポイント

### GET /health

サーバーの稼働状態を確認します。

**レスポンス**

```json
{ "status": "ok" }
```

**例**

```bash
curl http://localhost:3001/health
```

---

## WebSocket エンドポイント

### 接続先

```
ws://localhost:3001/ws
```

開発環境では Vite プロキシ経由で `ws://<host>/ws` に接続します（フロントエンドがプロキシ設定を自動適用）。

HTTPS 環境では `wss://` プロトコルを使用します。

---

## WebSocket メッセージプロトコル

### クライアント → サーバー

#### chat メッセージ

ユーザーのメッセージを Copilot に送信します。

```json
{
  "type": "chat",
  "content": "TypeScriptでHello Worldを書いてください"
}
```

| フィールド | 型     | 必須 | 説明               |
|-----------|--------|------|--------------------|
| `type`    | string | ✓    | 固定値: `"chat"`   |
| `content` | string | ✓    | ユーザーのメッセージ本文 |

**バリデーション**

- `type` が `"chat"` でない場合 → `error` メッセージを返す
- `content` が string でない場合 → `error` メッセージを返す
- JSON パース失敗時 → `error` メッセージを返す

---

### サーバー → クライアント

#### delta メッセージ

Copilot の応答をストリーミングで送信します（`assistant.message_delta` イベント）。

```json
{
  "type": "delta",
  "content": "```typescript\nconsole.log("
}
```

| フィールド | 型     | 説明                     |
|-----------|--------|--------------------------|
| `type`    | string | 固定値: `"delta"`        |
| `content` | string | 応答テキストの断片（差分） |

#### done メッセージ

Copilot の応答が完了したことを通知します（`session.idle` イベント）。

```json
{
  "type": "done"
}
```

| フィールド | 型     | 説明                  |
|-----------|--------|-----------------------|
| `type`    | string | 固定値: `"done"`      |

#### error メッセージ

エラーが発生したことを通知します。

```json
{
  "type": "error",
  "content": "Failed to initialize Copilot client"
}
```

| フィールド | 型     | 説明               |
|-----------|--------|--------------------|
| `type`    | string | 固定値: `"error"`  |
| `content` | string | エラーメッセージ    |

**エラーが発生するケース**

| エラーメッセージ                        | 原因                               |
|----------------------------------------|------------------------------------|
| `"Invalid message format"`             | `type` または `content` が不正     |
| `"Invalid JSON"`                       | JSON パース失敗                    |
| `"Failed to initialize Copilot client"` | CopilotClient の初期化失敗         |
| その他                                  | セッション処理中の例外              |

---

## 通信シーケンス例

### 正常なチャット

```
Client                      Server
  │                           │
  │──── WebSocket 接続 ───────▶│
  │                           │ CopilotClient 初期化
  │                           │
  │──── { type: "chat",       │
  │       content: "..." } ──▶│
  │                           │ Session 作成（初回のみ）
  │                           │ session.send({ prompt })
  │                           │
  │◀─── { type: "delta",      │ ストリーミング開始
  │       content: "H" } ─────│
  │◀─── { type: "delta",      │
  │       content: "ello" } ──│
  │        ... (繰り返し) ...  │
  │◀─── { type: "done" } ─────│ ストリーミング完了
  │                           │
```

### エラー発生

```
Client                      Server
  │                           │
  │──── { type: "invalid" } ─▶│
  │◀─── { type: "error",      │
  │       content: "Invalid   │
  │       message format" } ──│
  │                           │
```
