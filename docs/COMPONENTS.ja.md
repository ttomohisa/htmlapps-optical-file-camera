# 再利用UIコンポーネント

`components/` には、このテンプレートから新しい単一HTMLアプリを作るときに再利用できるUI部品を置きます。

これらはビルダーが自動で読み込むライブラリではありません。必要な部品を `src/index.template.html` にコピーまたは組み込み、アプリの翻訳・状態・操作へ合わせて調整してください。最終成果物はこれまでどおり1つのHTMLです。

## 確認ダイアログ

`components/confirm-dialog.html` は、`window.confirm()` の代わりに使う自前の確認UIです。スターター本体の「消去」でも同じ考え方の `AppConfirm.ask()` を使用しています。

- PCでは中央のモーダル
- スマートフォンでは下から出るボトムシート風
- `env(safe-area-inset-bottom)` 対応
- `Esc`、閉じるボタン、背景タップでキャンセル
- 実行後に元のフォーカスへ戻す
- 削除などの破壊的操作は `tone: 'danger'`
- 外部依存・外部通信なし
- `Promise<boolean>` を返す

### 使用例

```js
const ok = await AppConfirm.ask({
  title: language === 'ja' ? '確認' : 'Confirm',
  message: language === 'ja'
    ? 'この履歴を削除しますか？'
    : 'Delete this history item?',
  confirmLabel: language === 'ja' ? '削除する' : 'Delete',
  cancelLabel: language === 'ja' ? 'キャンセル' : 'Cancel',
  tone: 'danger'
});

if (!ok) return;
deleteHistoryItem();
```

### オプション

| 項目 | 内容 |
| --- | --- |
| `title` | ダイアログのタイトル |
| `message` | 確認本文 |
| `confirmLabel` | 実行ボタンの文言 |
| `cancelLabel` | キャンセルボタンの文言 |
| `tone` | `'default'` または `'danger'` |

完成したアプリでは、アプリ自身の翻訳オブジェクトからタイトル・本文・ボタン文言を渡すことを推奨します。

## 実装ルール

- 削除・全消去・上書きなどユーザー影響の大きい操作では、`window.confirm()` よりこの部品か同等の自前UIを優先します。
- 確認本文へHTML文字列を差し込まず、テキストとして渡します。
- スマートフォンでは48px程度のタップ領域とSafe Areaを維持します。
- アプリ固有の見た目に変更しても、`Esc`、背景タップ、フォーカス復帰、キーボード操作を維持します。
- `components/` の部品を変更した場合は、スターター本体に組み込まれた同等実装とドキュメントも同期します。

## スマホ固定ボトムナビ / 操作バー

`components/mobile-bottom-bar.html` は、スマートフォンで複数の画面内セクションや主要操作へいつでもアクセスしたいアプリ向けの標準コンポーネントです。PCでは非表示、`600px` 以下では Safe Area 対応の固定バーとして表示する前提です。

たとえば次のような用途に向いています。

- 動画編集系の `動画 / 範囲 / 切り出す / 保存`。
- ドキュメント系の `スキャン / ページ / PDF`。
- 3〜5個の主要セクションを行き来するスマホUI。
- 「保存」「共有」のように、結果ができるまで無効にしておきたい操作。

テンプレートにあるから必ず付けるものではありません。主操作が1つだけで常時ナビゲーションも不要なら、通常のインフローボタンの方が分かりやすいことがあります。

### マークアップ

各ボタンには安定した `data-mobile-key` を付けます。`data-mobile-target` を付けると画面内セクションへの移動、`data-mobile-action` を付けるとアプリ固有操作として扱えます。表示は短いラベルとアイコンを併用してください。

```html
<nav class="app-mobile-bottom-bar" id="mobileBottomBar" style="--app-mobile-bottom-items: 4" aria-label="Mobile actions">
  <button class="app-mobile-bottom-item is-active" data-mobile-key="source" data-mobile-target="sourceSection" aria-current="page">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="range" data-mobile-target="rangeSection">…</button>
  <button class="app-mobile-bottom-item primary" data-mobile-key="run" data-mobile-action="run">…</button>
  <button class="app-mobile-bottom-item" data-mobile-key="save" data-mobile-action="save" disabled>…</button>
</nav>
```

`<body>` には `has-mobile-bottom-bar` を付け、固定バーの裏へ本文が隠れないよう下余白を確保します。3個・5個に変更する場合は `--app-mobile-bottom-items` も合わせて変更します。

### 任意のヘルパーAPI

コンポーネント内のスクリプトも取り込む場合は、アプリ固有の操作だけを渡して初期化できます。

```js
const mobileBar = AppMobileBottomBar.mount(
  document.getElementById('mobileBottomBar'),
  {
    actions: {
      run: () => runJob(),
      save: () => saveResult()
    }
  }
);

mobileBar.setEnabled('save', false);
// 正常な結果ができた後
mobileBar.setEnabled('save', true);
```

画面内セクションへのスクロール、アクティブ表示、利用可能なら `IntersectionObserver` による現在セクション追従はヘルパー側で行います。「いつ保存を有効化するか」などの業務状態はアプリ側で決めます。

### UXルール

- 項目数は **3〜5個** を基本にします。操作系ツールは4個が扱いやすいです。
- アイコンだけにせず、短い文字ラベルも付けます。
- まだ実行できない操作は見た目だけ薄くせず、実際に `disabled` にします。
- 「保存」「共有」は正常な結果ができた後に有効化します。
- 固定CTAを重複させません。ボトムバーに主操作がある場合、別の全幅固定ボタンは通常不要です。
- 一方で、長い編集エリアの自然な末尾に通常配置の主操作ボタンを置くのは有効です。
- `env(safe-area-inset-bottom)` と本文側の下余白を維持し、バーで内容を隠さないようにします。
- 固定バーはスマホ向けです。PCでは通常のインフロー操作を維持します。
- フォーカス表示、ナビ項目の `aria-current`、標準の `disabled` セマンティクスを維持します。
