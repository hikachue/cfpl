#!/bin/bash
# 現在のスクリプトがあるディレクトリに移動
cd "$(dirname "$0")"

echo "=================================================="
echo "   経営管理システム (Basement Mgt.) 起動中..."
echo "=================================================="
echo ""

# ブラウザを数秒後に開く（バックグラウンドで実行）
(sleep 5 && open "http://localhost:3001") &

# 依存関係のチェック
if [ ! -d "admin/node_modules" ]; then
    echo "依存関係をインストール中... (初回のみ時間がかかります)"
    npm install --prefix admin
fi

# adminディレクトリでnpm run devを実行
echo "サーバーを起動しています..."
npm run dev --prefix admin || {
    echo ""
    echo "エラー: 起動に失敗しました。"
    echo "上記のメッセージを確認し、Enterキーを押して閉じてください。"
    read
}
