# API リファレンス

## HTTP エンドポイント

### `GET /health`

サーバーの稼働状況を確認します。

**レスポンス例:**

```json
{
  "status": "ok",
  "uptime": 123.456
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `status` | `string` | 常に `"ok"` |
| `uptime` | `number` | サーバー起動からの経過秒数 |

---

## WebSocket エンドポイント

### 接続先

```
ws://localhost:3001/ws
```

### クライアント → サーバー

#### チャットメッセージ (`type: "chat"`)

ユーザーのメッセージを送信します。

```json
{
  "type": "chat",
  "content": "TypeScript のジェネリクスを説明してください"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"chat"` | メッセージ種別（固定値） |
| `content` | `string` | ユーザーの入力テキスト |

**注意:** `type` が `"chat"` 以外の場合、または `content` が文字列でない場合はエラーが返ります。

---

### サーバー → クライアント

#### ストリーミングデルタ (`type: "delta"`)

Copilot の応答をストリーミングで断片的に送信します。`session.idle` が来るまで複数回受信します。

```json
{
  "type": "delta",
  "content": "TypeScript のジェネリクスとは"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"delta"` | メッセージ種別 |
| `content` | `string` | 応答テキストの断片 |

#### 応答完了 (`type: "done"`)

Copilot の応答が完了したことを通知します（`session.idle` イベントで送信）。

```json
{
  "type": "done"
}
```

#### エラー (`type: "error"`)

処理中にエラーが発生した場合に送信されます。

```json
{
  "type": "error",
  "content": "Invalid message format"
}
```

| フィールド | 型 | 説明 |
|---|---|---|
| `type` | `"error"` | メッセージ種別 |
| `content` | `string` | エラーメッセージ |

**エラーが発生するケース:**
- JSON パースエラー（`"Invalid JSON"`）
- `type` や `content` が不正な形式（`"Invalid message format"`）
- CopilotClient の初期化失敗（`"Failed to initialize Copilot client"`）
- セッション処理中の例外

---

## WebSocket ライフサイクル

```
接続確立
  → CopilotClient 初期化 (client.start())
  → メッセージ受信ループ
      → (初回) createSession({ model: "gpt-4.1" })
      → session.send({ prompt: content })
      → delta × N → done
  → 切断
      → session.disconnect()
      → client.stop()
```

セッション (`CopilotSession`) は接続ごとに 1 つ作成・再利用され、メッセージはキューで順次処理されます（並列処理なし）。
