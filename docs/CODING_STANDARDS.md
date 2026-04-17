# Coding Standards for Equalin

## 1. 建築原則 (Architecture Rules)
クリーンアーキテクチャを厳守します。
- **Domain Layer**: 他のどのレイヤーにも依存してはならない。TypeScriptの標準機能のみを使用する。
- **Infrastructure Layer**: SupabaseのSDKなどの外部ライブラリをここに閉じ込める。
- **Presentation Layer**: Server Actionsは `src/registry.ts` を通じてリポジトリやユースケースを取得する。直接 `new SupabaseRepository()` してはならない。

## 2. 命名規則 (Naming Conventions)
- **Entities**: キャメルケース (`payerId`, `createdAt`)。
- **Interfaces**: 頭文字に `I` をつける (`IGroupRepository`)。
- **Files**:
  - Reactコンポーネント: PascalCase (`PaymentForm.tsx`)
  - クラス/ロジック: PascalCase (`SettlementService.ts`, `SupabasePaymentRepository.ts`)
  - その他ユーティリティ: camelCase

## 3. 型安全性 (Type Safety)
- `any` の使用を禁止します（どうしても必要な場合は理由を明記）。
- ドメイン層のエンティティをソースオブトゥルースとし、Presentation層での型変換を最小限にします。

## 4. データベース (Database)
- 金額はすべて `BIGINT` (cents/最小単位) として扱い、アプリケーション内では `number` 型（単位：円/セント）で保持します。
- タイムスタンプは `TIMESTAMPTZ` を使用します。

## 5. テスト (Testing)
- ビジネスロジック（特に `SettlementService`）を変更した際は、必ず `bun test` を実行し、既存のテストをパスすることを確認します。
- 新機能追加時は、ドメインサービスに対する単体テストを必ず作成します。
