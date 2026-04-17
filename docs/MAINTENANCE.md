# Maintenance Guide for Gemini CLI

このガイドは、今後の機能追加や修正を効率的に行うためのAIエージェント向け指示書です。

## 機能追加のステップ
1. **Domain**: `src/domain/entities/` に必要な型を定義し、`src/domain/repositories/` にインターフェースを追加する。
2. **Infrastructure**: `src/infrastructure/repositories/` に具体的な実装（Supabase等）を追加する。
3. **Application**: 必要に応じて `src/application/use-cases/` にビジネスフローをカプセル化したクラスを作成する。
4. **Registry**: `src/registry.ts` でインスタンス化し、外部に公開する。
5. **Presentation**: `app/actions/` または UIコンポーネントから公開されたインスタンスを使用する。

## データ更新のフロー
- UIの更新が必要な場合は、`router.refresh()` を呼ぶか、Server Actions の `revalidatePath` を活用する。
- 現在の `GroupPage` は `useEffect` でデータを取得しているが、将来的には Server Components への移行を推奨。

## 重要な注意点
- **キャメルケース**: DBはスネークケースだが、アプリケーション内（Domain Layer以上）では常にキャメルケースを徹底する。Infrastructure Layer のリポジトリが変換責任を持つ。
- **金額計算**: 浮動小数点誤差を避けるため、計算は整数で行い、必要に応じて `Math.round` を適用する。

## テストの実行
```bash
bun test
```
ビジネスロジックに変更を加えた場合は、必ずこのコマンドでデグレがないか確認すること。
