PANELY 操作体験サイト（ブラウザ試作）
基準：0.70a-usb / versionCode 109

開く：index.html をブラウザで開いてください。ビルド・インストール不要。
画面下の電源、USB、HDMIを操作します。リモコンは画面右側。
初期PINは0000。左上2秒長押しでPIN、リモコンの戻るはPINなし。
再現範囲と未対応事項はcoverage.htmlに記載。

GitHub Pages公開手順：
1. ご自身のターミナルで gh auth login を実行。
2. このフォルダを、公開先の新しいリポジトリのルートとして登録。
3. GitHubリポジトリの Settings > Pages > Source を GitHub Actions に設定。
4. main ブランチへpushすると .github/workflows/pages.yml が検証・公開。
5. Actionsの成功とPagesのURLを確認。
既存リポジトリへ配置する場合は、その構成に合わせてworkflowを調整。

公式資料：
https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

公開するのはHTML/CSS/JavaScript/必要な画像と音源のみ。
元のAndroidソースと社内資料は含みません。
このフォルダはまだGitHubへ送信・公開していません。

検証コマンド（Node.js）：
node --check app.js
node --check core.js
node tests/core.test.cjs
node tests/flows.test.cjs

検証結果：ロジック7件＋オフライン操作フロー13件が成功。
操作フロー検証はDOMの代替を使う状態遷移テストです。
実ブラウザの表示・クリック・モバイルレイアウトは未検証。
ローカルHTTP接続がタイムアウトし、内蔵ブラウザでは確認できませんでした。

設定はlocalStorageに保存。実USBや実機は操作しません。
動画・外部アプリは固定サンプル、OS画面は一部仮表示です。
実機の全操作・表示の一致を確認した完成版ではありません。
