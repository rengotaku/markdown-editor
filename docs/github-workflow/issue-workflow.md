# GitHub Issue 運用ガイド

## 目次

1. [導入](#1-導入)
2. [親 issue を起票する](#2-親-issue-を起票する)
3. [議論を進める](#3-議論を進める)
4. [sub-issue に分解する](#4-sub-issue-に分解する)
5. [実装フェーズ](#5-実装フェーズ)
6. [前提を変える PR の運用](#6-前提を変える-pr-の運用)
7. [アンチパターン集](#7-アンチパターン集)
8. [既存リポへの展開](#8-既存リポへの展開)

---

## 1. 導入

このガイドは、以下の問題を解消するために作成した:

- issue の状態が感覚的で、誰でも判断できない
- 「決定したはずの仕様」がコメントに埋もれて消える
- 親 issue と sub-issue の関係が曖昧になる

**原則**: 読み手が判断しなくてよいように書く。「お好みで」「必要に応じて」は禁止。

### 用語

| 用語 | 意味 |
|------|------|
| 親 issue | 大きな機能・改善提案。議論の起点となる issue |
| sub-issue | 親 issue の議論で分解された実装単位の issue |
| 議論用 sub-issue | 特定の論点を解決するための sub-issue。決定が出たら close |
| Decision Log | 親 issue 内の確定事項テーブル |
| ハイブリッド方式 | description に要約 + first comment に元要望全文を置く形式 |

### Status 凡例

Status は `**Status:**` で始まる固定テキストで管理する。emoji は任意補助（`✅ / ⏳ / 🔴 / ⏸`）だが、テキスト必須・emoji 単独禁止。

**親 issue**

| テキスト | 意味 | 初期値 |
|---------|------|-------|
| `議論中` | 議論フェーズ（起票時デフォルト） | ✓ |
| `実装フェーズ` | 全論点確定 + 最初の sub-issue 起票後 | |
| `完了` | 全 sub-issue close 後 | |

**sub-issue**

| テキスト | 意味 | 初期値 |
|---------|------|-------|
| `実装待ち` | 未着手（起票時デフォルト） | ✓ |
| `実装中` | 実装中 | |
| `実装完了` | PR マージ済み | |
| `保留` | 意図的に止めている | |
| `中断` | 対応しないことが確定した | |

**議論用 sub-issue**

| テキスト | 意味 | 初期値 |
|---------|------|-------|
| `議論中` | 議論中（起票時デフォルト） | ✓ |
| `決定済み` | 決定が出て close 済み | |

### 親 issue の Status 遷移

| 遷移 | トリガ | 担当 |
|------|-------|------|
| `議論中` → `実装フェーズ` | 全論点確定 + 最初の sub-issue 起票 | 親起票者 |
| `実装フェーズ` → `完了` | 全 sub-issue close | 親起票者 |

---

## 2. 親 issue を起票する

### ステップ

**2-1. issue を作成する**

```bash
gh issue create --template parent-issue.md
```

GitHub UI の場合: "New issue" → "親 issue" テンプレートを選択。

**2-2. description に要約を書く**

1〜2 行で目的・背景を書く。詳細はこの後の first comment に移す。

**2-3. 元要望全文を first comment として投稿する**

issue を作成後、すぐに first comment を投稿する:

```bash
# gh issue create は完了時に URL を返す。番号は末尾から取得する
ISSUE_URL=$(gh issue create --template parent-issue.md --title "タイトル")
NUMBER=$(echo "$ISSUE_URL" | awk -F/ '{print $NF}')

# first comment を投稿
gh issue comment "$NUMBER" --body "$(cat <<'EOF'
## 元要望全文

（ここに要望の全文を貼り付ける）
EOF
)"
```

**2-4. first comment の URL を description に貼る**

```bash
# first comment の URL を取得
gh issue view <NUMBER> --json comments --jq '.comments[0].url'
```

取得した URL を description の「元要望全文:」リンクに貼る:

```
元要望全文: [このコメント](https://github.com/owner/repo/issues/N#issuecomment-XXXXXXX)
```

**2-5. Goal セクションを埋める**

1〜2 行で達成したいことを書く。Decision Log は最初は空でよい。

### チェックリスト

- [ ] description が 1〜2 行の要約になっている
- [ ] 元要望全文が first comment に投稿されている
- [ ] description の「元要望全文:」リンクが first comment を指している
- [ ] Status が `議論中` になっている
- [ ] Goal セクションが記入されている

---

## 3. 議論を進める

### 基本ルール

- 決定事項は必ず Decision Log に転記する。コメントだけで終わらせない
- 論点が大きくなったら議論用 sub-issue に分解する
- 決定が出た議論用 sub-issue はすぐに close する

### Decision Log を更新する

コメントで合意が取れたら、親 issue の Decision Log を更新する:

```bash
# 現在の issue 本文を確認
gh issue view <NUMBER>

# 本文を編集（ブラウザが開く）
gh issue edit <NUMBER>
```

Decision Log の形式（論点には「議論↔回答」双方向リンクを記載する）:

```markdown
| # | 論点 | 決定 | 日付 |
|---|------|------|------|
| 1 | 〇〇をどうするか ([議論](URL_TO_DISCUSSION) → [回答](URL_TO_ANSWER)) | 案 A を採用。理由: XXX | 2026-01-15 |
```

### 議論用 sub-issue を作る

論点が複雑で独立した議論が必要な場合は、議論用 sub-issue を作成する:

```bash
gh issue create --template discussion-issue.md --title "議論: 〇〇をどうするか"
```

議論用 sub-issue の close:

```bash
# 決定が出たら close する（親の Decision Log 転記後）
gh issue close <NUMBER> --reason completed --comment "決定: 案 A を採用。理由: XXX。親 #N Decision Log #M に転記済み。"
```

---

## 4. sub-issue に分解する

### 分解の判断基準

以下の条件を**すべて満たす**場合に sub-issue に分解する:

1. 独立した PR が作れる（他の sub-issue と並行実装できる）
2. DoD（完了条件）を具体的に書ける

1 つでも満たさない場合は、親 issue の Sub-issues テーブルに TODO として追記するだけでよい。

### sub-issue を作成する

```bash
gh issue create --template sub-issue.md --title "タイトル"
```

sub-issue 作成後、親 issue の Sub-issues テーブルを更新する:

```bash
gh issue edit <親issue番号>
```

```markdown
## Sub-issues

| # | タイトル | Status |
|---|---------|--------|
| [#N](URL) | タイトル | 実装中 |
```

### Depends on の記載

依存関係がある場合は `Depends on` セクションに明記する:

```markdown
## Depends on

- #N が完了してから着手する（理由: 共通インターフェースが確定していないと実装できない）
```

依存なしの場合は「依存 sub-issue なし」と明示する。

---

## 5. 実装フェーズ

### sub-issue 着手時

**5-1. ブランチを作成する**

ブランチ名: `<type>/<issue#>-<kebab-description>`

**type** は Conventional Commits と同じ: `feat` / `fix` / `refactor` / `docs` / `chore` / `test` / `perf` / `ci`

例:
- `feat/209-meta-github-workflow`
- `fix/210-curl-fail-flag`
- `docs/220-issue-workflow-guide`

```bash
git switch main
git pull origin main
git switch -c <type>/<issue#>-<description>
```

**5-2. 実装前確認をする**

実装を始める前に、**親 issue にコメントで不明点を質問する**。質問は `Q1: ...` / `Q2: ...` 形式で投稿する:

```bash
gh issue comment <親issue番号> --body "$(cat <<'EOF'
実装前確認です。以下の点を確認させてください。

Q1: （質問1）
Q2: （質問2）
EOF
)"
```

回答を受けたら、了解コメントを投稿する:

```bash
gh issue comment <親issue番号> --body "了解しました。以下の内容で実装を開始します。

- Q1: （回答の要約）
- Q2: （回答の要約）"
```

確定した内容は親 issue の Decision Log に転記する。コメントだけで終わらせない。

**5-3. sub-issue の Status を更新する**

GitHub UI で description を開き、`**Status:** 実装待ち` を `**Status:** 実装中` に書き換える。

**5-4. 実装する**

`スコープ` セクションのチェックボックスを埋めながら進める。

**5-5. PR を作成する**

```bash
gh pr create --template PR-template.md
```

PR には必ず以下を含める:
- `Refs: #親issue番号`（親をcloseさせない）
- `Closes: #sub-issue番号`（sub-issue は PR マージ時に close）

マージ前に DoD の全チェックボックスが埋まっていることを確認する。

**5-6. 完了報告を投稿する**

PR マージ後、`meta/github-workflow/completion-comment.md` を参照し、**親 issue にコメントで完了報告を投稿する**:

```bash
gh issue comment <親issue番号> --body "$(cat <<'EOF'
## 実装内容

（実装した内容を 3〜5 行で記載）

## DoD 達成状況

| 条件 | 状態 |
|------|------|
| （DoD 1） | ✅ 達成 |

## Sub-issue 進捗

| # | タイトル | Status |
|---|---------|--------|
| [#N](URL) | タイトル | 実装完了 |

## 残作業

なし
EOF
)"
```

### sub-issue 完了後

sub-issue は PR マージ時に自動で close される（`Closes:` を使った場合）。

親 issue の Sub-issues テーブルを更新する:

```bash
gh issue edit <親issue番号>
```

```markdown
| [#N](URL) | タイトル | 実装完了 |
```

### 親 issue を close する

全 sub-issue が完了したら、親 issue を手動で close する:

```bash
gh issue close <親issue番号> --reason completed --comment "全 sub-issue (#N, #M) が完了したため close します。"
```

---

## 6. 前提を変える PR の運用

PR が他の sub-issue の前提仕様を変える変更を含む場合、以下の手順を踏む。

### Affects を記載する

`PR-template.md` の `Affects:` 欄に影響先 sub-issue を記載する:

```markdown
Affects: #N (〇〇の前提仕様が変わる。例: Project 番号が X から Y に切り替わるため #M の設定値も変更が必要)
```

### 影響先 sub-issue の更新手順

1. **影響先 sub-issue の「前提仕様」セクションを更新する** — 変わった仕様を明記する
2. **親 issue の Decision Log に転記する** — `Affects:` の内容を新エントリとして追加する
3. **影響先 sub-issue にコメントで通知する** — 変更内容を伝える

```bash
gh issue comment <影響先issue番号> --body "$(cat <<'EOF'
#N の PR (#PR_NUMBER) でマージされた変更が、この sub-issue の前提仕様に影響します。

変更内容: （変更内容を記載）

「前提仕様」セクションの更新が必要です。
EOF
)"
```

### チェックリスト

- [ ] `Affects:` 欄に影響先 sub-issue を記載した
- [ ] 影響先 sub-issue の「前提仕様」セクションを更新した
- [ ] 親 issue の Decision Log に転記した
- [ ] 影響先 sub-issue にコメントで通知した

---

## 7. アンチパターン集

### ❌ issue を削除する

**禁止**。issue の削除は絶対に行わない。誤って作成した場合は `not planned` で close する:

```bash
gh issue close <NUMBER> --reason "not planned" --comment "誤作成のため close します。"
```

### ❌ 状態管理にラベルを使う

`status:in-progress` 等のラベルは使わない。Status はテキストで description 先頭に管理する。

理由: ラベルはフィルタリング用途に限定し、状態はテキストで読める形にする。

### ❌ コメントだけで決定を残す

決定事項をコメントに書いて終わりにしない。必ず親 issue の Decision Log に転記する。

理由: コメントは埋もれる。Decision Log が唯一の真実の源になる。

### ❌ PR に `Fixes: #親issue番号` を書く

親 issue は全 sub-issue 完了後に手動で close するため、PR には `Refs:` を使う。

```markdown
# 正しい
Refs: #親issue番号
Closes: #sub-issue番号

# 誤り
Fixes: #親issue番号  ← 親が自動 close される
```

### ❌ `--no-verify` でコミット・プッシュする

テスト・lint をスキップして CI を通過したように見せる行為は禁止。フックが失敗する場合は根本原因を修正する。

### ❌ sub-issue を self-contained にしない

sub-issue は単独で読んで実装できる状態にする。「詳細は親 issue を参照」だけでは不十分。前提仕様・スコープ・DoD を必ず inline で書く。

### ❌ 「お好みで」「必要に応じて」等の曖昧表現を使う

issue 内（特に DoD・やってはいけないこと）では判断を読み手に委ねる表現を使わない。

```markdown
# 誤り
- お好みでテストを追加してください

# 正しい
- [ ] 〇〇関数のユニットテストを追加する（テストファイル: tests/test_xxx.py）
```

### ❌ 親 issue の description に実装詳細を全部書く

詳細は sub-issue に分解して self-contained にする。親 issue は要約 + Decision Log + Sub-issues テーブルだけにする。

### ❌ 議論用 sub-issue を決定後も open のままにする

決定が出たら即座に close する。Decision Log に転記 → close の順を守る。

---

## 8. 既存リポへの展開

### scaffold 経由（新規リポ）

`scripts/download.sh` を使って scaffold すると、GitHub workflow テンプレートが自動注入される:

```bash
curl -sSL https://raw.githubusercontent.com/rengotaku/my-boilerplate/main/scripts/download.sh \
  | sh -s -- <template> <dest>
```

scaffold 完了後、`.github/ISSUE_TEMPLATE/` と `.github/PULL_REQUEST_TEMPLATE.md` が生成されている。

### 手動コピー（既存リポ）

既存リポへの後付けは手動コピーで行う:

```bash
# Issue テンプレートをコピー
mkdir -p .github/ISSUE_TEMPLATE
cp meta/github-workflow/parent-issue.md .github/ISSUE_TEMPLATE/
cp meta/github-workflow/sub-issue.md .github/ISSUE_TEMPLATE/
cp meta/github-workflow/discussion-issue.md .github/ISSUE_TEMPLATE/

# PR テンプレートをコピー
cp meta/github-workflow/PR-template.md .github/PULL_REQUEST_TEMPLATE.md
```

`completion-comment.md` は scaffold・手動コピーの対象外。GitHub のコメント機能にネイティブテンプレ枠がないため、`meta/github-workflow/completion-comment.md` を直接参照する方式を採る。

### 既存 issue の扱い

既存の issue は変更しない。新しく起票する issue からこのワークフローを適用する。

### チェックリスト

- [ ] `.github/ISSUE_TEMPLATE/` に `parent-issue.md` / `sub-issue.md` / `discussion-issue.md` が配置されている
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` が作成されている
- [ ] チームに「Decision Log への転記」ルールを共有した
- [ ] issue 削除の代わりに close with reason を使うことを合意した
