# Equalin Project Overview

Equalinは、シンプルで公平な割り勘を実現するためのオープンソースWebアプリケーションです。グループでの支出を記録し、誰が誰にいくら支払うべきかを自動的に計算します。

## コア機能
- **グループ管理**: グループ作成と招待リンクによる共有
- **支出記録**: 支払者、金額、参加者を選択して記録
- **精算計算**: 最小の取引回数で精算できるアルゴリズム
- **匿名利用**: ログイン不要。localStorageによる簡易的なプロフィール管理

## 技術スタック
- **Frontend**: Next.js 15 (App Router), React 19
- **Backend**: Supabase (PostgreSQL, SSR Client)
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Presentation)
- **Tooling**: Bun, Biome, TypeScript

## システムアーキテクチャ
クリーンアーキテクチャを採用し、依存関係を以下のように制御しています：

1. **Domain Layer (`src/domain/`)**:
   - `entities/`: ビジネスエンティティ（Payment, Profile等）の定義。外部依存ゼロ。
   - `services/`: 純粋なビジネスロジック（SettlementService）。
   - `repositories/`: データ永続化のインターフェース。
2. **Application Layer (`src/application/`)**:
   - `use-cases/`: 特定の業務フロー（精算計算など）を実現。リポジトリインターフェースに依存。
3. **Infrastructure Layer (`src/infrastructure/`)**:
   - `repositories/`: Supabase等を使用したリポジトリの実装。
4. **Presentation Layer (`app/actions/`, `app/group/`)**:
   - Server ActionsとReactコンポーネント。ユースケースまたはリポジトリを呼び出す。

## 開発の原則
1. **ビジネスロジックの隔離**: 精算計算などの核となるロジックは常に `domain/services` に記述し、外部ライブラリやDBに依存させない。
2. **依存性の逆転**: 高位レイヤーは低位レイヤーのインターフェースに依存し、具象（Supabase等）には依存しない。
3. **UIの簡素化**: 過剰な装飾を避け、直感的で高速なUIを維持する。
