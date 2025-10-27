# Equalin 仕様書 (SPEC.md)

## 1. プロジェクト概要

Equalinは、グループ内での割り勘を簡単にするためのWebアプリケーションです。グループを作成し、メンバーを招待し、各メンバーが支払った金額を登録することで、誰が誰にいくら支払うべきかを自動的に計算します。

## 2. 技術スタック

- **フレームワーク**: Next.js (App Router)
- **言語**: TypeScript
- **データベース**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS, Radix UI, lucide-react
- **実行環境**: Bun

## 3. データモデル (Supabase)

割り勘機能を実現するために、以下のテーブルを定義します。

- **`groups`**: 割り勘グループを格納します。
- **`profiles`**: ユーザープロフィールを格納します。匿名利用を想定し、IDはクライアントサイドで生成・管理します。
- **`group_members`**: どのユーザーがどのグループに所属しているかの関係を定義します。
- **`payments`**: 支払いの記録を格納します。
- **`payment_participants`**: 1つの支払いを誰が分担したかを記録します。

### SQL定義

```sql
-- グループ
CREATE TABLE groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- プロフィール
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);

-- グループメンバー
CREATE TABLE group_members (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, profile_id)
);

-- 支払い
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 支払い参加者
CREATE TABLE payment_participants (
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (payment_id, profile_id)
);
```

## 4. 機能実装計画

Next.jsのServer Actionsを活用し、サーバーサイドのロジックを実装します。

### 機能1: グループ作成機能

- **実装計画**:
    1.  ユーザーはグループ名を入力して、新しい割り勘グループを作成します。
    2.  作成されたグループは `groups` テーブルに保存され、ユーザーはグループページ (`/group/[id]`) にリダイレクトされます。

### 機能2: グループへの招待機能

- **実装計画**:
    1.  招待は、グループページのURL (`/group/[id]`) を共有することで行います。
    2.  ページ内に、URLを簡単にコピーできる「招待リンクをコピー」ボタンを設置します。

### 機能3: ユーザーの名前登録機能

- **実装計画**:
    1.  ユーザーが初めてグループページにアクセスした際、`localStorage` にプロフィールIDが存在するか確認します。
    2.  IDが存在しない場合、名前を入力するフォームを表示します。
    3.  名前が送信されると、`profiles` テーブルに新しいユーザーを作成し、そのIDを `localStorage` に保存します。
    4.  同時に、`group_members` テーブルにグループIDとプロフィールIDを紐付けて保存し、グループへの参加を完了させます。

### 機能4: 支払金額の登録機能

- **実装計画**:
    1.  グループページに「支払いを追加」ボタンを設置します。
    2.  ボタンを押すと、支払いの説明（例: "夕食"）と金額を入力するフォームが表示されます。
    3.  フォームが送信されると、`payments` テーブルに支払者（現在のユーザー）、金額、説明などのデータが保存されます。

### 機能5: 割り勘相手の決定機能

- **実装計画**:
    1.  支払い登録フォーム内に、現在のグループメンバーの一覧をチェックボックスで表示します。
    2.  支払者は、その支払いを誰と割り勘するかをチェックボックスで選択します。
    3.  フォーム送信時、選択されたメンバーの情報を `payment_participants` テーブルに保存します。

### 機能6: 精算計算機能

- **実装計画**:
    1.  グループページに「精算結果を表示」ボタンを設置します。
    2.  この機能は、以下のロジックで計算を行うServer Actionをトリガーします。
        a. **各メンバーの支出総額を計算**: `payments` テーブルから、メンバーごとに支払った合計金額を集計します。
        b. **各メンバーの負担総額を計算**:
            - 各支払いについて、割り勘人数（`payment_participants` の数）で金額を割り、一人当たりの負担額を算出します。
            - メンバーごとに、自分が参加したすべての支払いの負担額を合計します。
        c. **差額を計算**: `（支出総額） - （負担総額）` をメンバーごとに計算します。
            - プラスの人は、他の人からお金を受け取る権利があります。
            - マイナスの人は、他の人にお金を支払う義務があります。
    3.  計算結果を元に、「誰が」「誰に」「いくら」支払うべきかのリストを生成し、画面に分かりやすく表示します。