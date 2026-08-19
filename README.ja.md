# Optical File

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-optical-file-camera/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-optical-file-camera/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-optical-file-camera/)

[English README](README.md)

Optical File は、小さなファイルを**連続QRのAnimated WebP**へ変換し、別端末のカメラで読み取るか、WebPを直接解析して元ファイルへ復元する、プライバシー重視の単一HTMLアプリです。

## 🚀 デモ

### [GitHub PagesでOptical Fileを開く](https://ttomohisa.github.io/htmlapps-optical-file-camera/)

GitHub Pagesから最初のHTMLを読み込んだ後、ファイル読み込み、gzip圧縮、QR生成、Animated WebP生成、カメラ解析、復元、CRC32検証、SHA-256検証は端末内で処理します。選択したファイルやカメラ映像をアプリがサーバーへアップロードすることはありません。

## 主な機能

- **最大1 MiB**のファイルをAnimated QR WebP（`.webp`）へ変換
- 別端末に表示したAnimated QRを**カメラで読み取って復元**
- WebPファイルを直接読み込む高速復元
- カメラ優先の既定値: **1 QR / frame・6 fps**
- 速度優先の **4 QR / frame** モード
- 画面撮影時の白飛びを抑える低輝度QR背景
- 対応端末ではカメラの露出補正を自動でマイナス方向へ調整
- メタデータ取得前に読めたデータブロックもCRC32確認後に仮保存
- コンパクトなメタデータQRを約2秒ごとに再挿入
- データブロックごとのCRC32検証
- 復元ファイル全体のSHA-256検証
- 効果がある場合のみQR化前にgzip圧縮
- 日本語 / 英語UIを1つのHTMLに内包
- スマートフォン前提のレスポンシブUI
- SVG favicon内包
- `qrcode` / `jsQR` をHTMLへ内包
- 単一HTMLと自己解凍HTMLの両方を生成可能

## クイックスタート

### Web版を使う

[デモを開く](https://ttomohisa.github.io/htmlapps-optical-file-camera/)だけで使えます。インストールやアカウントは不要です。

カメラ復元を使う場合は、ブラウザーから求められたカメラ権限を許可してください。

### 単一HTMLをビルドする

1. このリポジトリをダウンロードまたはcloneします。
2. Windowsで `build-standalone.bat` をダブルクリックします。
3. 初回ビルド時に `dependencies.json` で固定した依存ライブラリを取得します。
4. 生成された `dist/index.html` を開くか、好きな場所へコピーします。

自己解凍ビルドを明示的に無効化しない限り、`dist/index.self-extract.html` も同時に生成します。

Python、Node.js、ローカルWebサーバーは不要です。ビルドにはWindows PowerShellとWindows標準の `tar.exe` を使用します。

## 使い方

### Animated QRを作る

1. **Animated QRを作る** を開きます。
2. **1 MiB以下**のファイルを選択します。
3. 通常は **カメラ優先・1 QR / frame** と **6 fps** のままで使います。
4. Animated WebPを生成します。
5. `.webp` を保存するか、別端末から読む場合は全画面表示します。

圧縮効果が十分にあるファイルは、QR化前に自動でgzip圧縮します。復元後は元ファイルのSHA-256と一致することを確認してから保存できるようになります。

### カメラで復元する

1. 受信側端末でOptical Fileを開きます。
2. **Animated QRから復元** に切り替えます。
3. カメラを開始し、カメラ権限を許可します。
4. 送信側端末でAnimated QRを全画面表示します。
5. QR全体がカメラのガイド内に収まるように合わせます。
6. 全ブロックの取得と検証が終わるまで表示したままにします。
7. 復元されたファイルを保存します。

メタデータQRを読む前に取得できたデータQRも、CRC32が正しければ仮保存します。メタデータはアニメーション途中にも繰り返し入るため、先頭フレームまで1周待つ必要はありません。

### WebPファイルから直接復元する

1. **Animated QRから復元** を開きます。
2. 生成済みの `.webp` を選択します。
3. WebP解析を開始します。
4. 全ブロックが揃い、SHA-256が一致したら元ファイルを保存します。

Animated WebPの直接解析にはブラウザーの `ImageDecoder` APIを使用します。未対応ブラウザーではカメラ復元を使うか、対応するChromium系ブラウザーを使用してください。

## カメラ読み取りのコツ

画面越しのQR読み取りは、画面の明るさ、反射、ピント、露出、角度、カメラ性能の影響を受けます。安定しない場合は次を試してください。

- まず **カメラ優先・1 QR / frame** を使う
- Animated QRを全画面表示する
- 送信側画面と受信側カメラをできるだけ平行にする
- QR本体と余白までガイド内に入る距離まで少し離す
- 画面への強い映り込みを避ける
- 白飛びする場合は、利用可能ならアプリ内の露出補正を下げる
- 取りこぼしがある場合は数ループそのまま読み取らせる

カメラで読み取れるQR密度を優先するため、入力ファイルの上限は意図的に**1 MiB**にしています。

## GitHub Pagesで公開する

このリポジトリには、単一HTMLをビルドしてGitHub Pagesへ自動デプロイするWorkflowが含まれています。

1. リポジトリ名を `htmlapps-optical-file-camera` としてGitHubへpushします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` へpushするか、Actionsから **Deploy standalone app to GitHub Pages** を手動実行します。
4. デプロイ成功後、`https://ttomohisa.github.io/htmlapps-optical-file-camera/` で利用できます。

`main` へのpushごとに `dist/index.html` と `dist/index.self-extract.html` をビルド・検証してから公開します。GitHub Pagesがまだ有効になっていない場合もビルド検証は実行され、Workflow summaryに初回設定手順が表示されます。

## 開発・ビルド構成

```text
.
├─ src/index.template.html          # アプリ本体テンプレート
├─ app.config.json                  # アプリ情報・ビルド設定
├─ dependencies.json                # 固定npm依存と内包対象
├─ build-standalone.bat             # Windows用ビルド入口
├─ build-standalone.ps1             # 単一HTMLビルダー
├─ scripts/
│  ├─ check-repository.ps1          # リポジトリ・ビルド検証
│  ├─ build-self-extract.ps1        # 自己解凍HTML生成
│  ├─ verify-standalone.ps1         # 単一HTML検証
│  └─ verify-self-extract.ps1       # 自己解凍HTML検証
├─ dist/
│  ├─ index.html                    # 生成される単一HTML
│  └─ index.self-extract.html       # 生成される自己解凍HTML
└─ .github/workflows/
   ├─ build-standalone.yml          # Pull Request時のビルド検証
   └─ deploy-pages.yml              # GitHub Pages自動デプロイ
```

### 依存ライブラリを更新する

`dependencies.json` のバージョンとアセットパスを更新してから、次を実行します。

```bat
build-standalone.bat
```

依存キャッシュを破棄して再取得する場合は次を実行します。

```bat
build-standalone.bat -ForceDownload
```

ビルド処理では自動的に次を行います。

- 固定したnpmパッケージのtarballを取得
- 指定した実行時アセットのみを抽出
- アセットを生成HTMLへ直接内包
- 依存パッケージとアセットのSHA-256をmanifestへ記録
- 未解決プレースホルダーや外部runtime script / stylesheet参照を検出
- Content Security Policyに `connect-src 'none'` が残っていることを検証
- 単一HTML、自己解凍HTML、各manifestを生成

## プライバシーとネットワーク通信

Optical Fileは、選択したファイルとカメラデータを端末内に留める設計です。

生成される単一HTMLのContent Security Policyには次が含まれます。

```text
connect-src 'none'
```

GitHub Pages版では最初のHTML取得に通信が必要ですが、読み込み後にアプリが選択ファイル、生成WebP、カメラフレーム、復元ファイルをアップロードすることはありません。

完全オフラインで使う場合は、ビルドした `dist/index.html` をローカルで開けます。ただしローカルファイルからのカメラ利用可否はブラウザーによって異なるため、**カメラ復元はGitHub PagesなどHTTPS環境での利用を推奨**します。

## データ形式と検証

Optical Fileは独自のAnimated QR転送形式を使用します。

- 必要に応じて元データをgzip圧縮
- データを番号付きブロックへ分割
- 各ブロックをCRC32で検証
- 復元に必要な情報をメタデータQRへ格納
- メタデータQRをアニメーション途中にも繰り返し挿入
- 復元後のSHA-256が元ファイルと一致した場合のみ完了

これらは欠落や破損の検出を目的としたもので、**暗号化ではありません**。認証付きの安全なファイル転送を置き換えるものではありません。

## 制限事項

- 入力ファイルは**1 MiB以下**です。
- Animated WebPは元ファイルよりかなり大きくなる場合があります。
- カメラ復元の成功率は、画面、カメラ、距離、ピント、露出、周囲の反射などに左右されます。
- カメラ利用にはブラウザーの許可が必要で、GitHub PagesなどHTTPS環境での利用が安定します。
- WebP直接復元には `ImageDecoder` によるAnimated WebPフレーム解析に対応したブラウザーが必要です。
- 生成したWebPは**暗号化されません**。WebPを入手した人は元ファイルを復元できます。
- 小容量ファイルを光学的に受け渡すためのツールであり、高速なネットワーク転送やUSB転送の代替ではありません。

## 依存ライブラリ

| ライブラリ | バージョン | ライセンス | 用途 |
| --- | ---: | --- | --- |
| qrcode | 1.4.4 | MIT | QRコード生成 |
| jsQR | 1.4.0 | Apache-2.0 | QRコード解析のフォールバック |

カメラ取得、WebP組み立て、ハッシュ計算、圧縮、復元処理はブラウザーAPIとアプリ側コードで実装しています。詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を参照してください。

## 関連ドキュメント

- [APP_SPEC.md](APP_SPEC.md) — アプリ・転送仕様
- [SECURITY.md](SECURITY.md) — セキュリティ情報
- [VERIFY_OFFLINE.md](VERIFY_OFFLINE.md) — オフライン動作の確認方法
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) — サードパーティライセンス

## Contributing

不具合報告や機能提案はGitHub Issuesから歓迎します。開発時のガイドは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。

## License

Copyright © 2026 ttomohisa

[MIT License](LICENSE) のもとで公開しています。
