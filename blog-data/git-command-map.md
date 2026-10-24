# Git 常用命令地图

按场景记忆，比按字母顺序背命令更有效。

## 开始一个仓库

```bash
git init
git clone https://example.com/repo.git
git remote -v
```

## 日常提交

```bash
git status
git diff
git add .
git commit -m "feat: 添加云盘分享"
git log --oneline --graph --decorate -10
```

## 分支

```bash
git branch
git switch -c feature/shares
git switch main
git merge feature/shares
git branch -d feature/shares
```

## 同步远程

```bash
git fetch origin
git pull --rebase
git push -u origin feature/shares
```

## 临时保存

```bash
git stash push -m "wip: 页面改版"
git stash list
git stash pop
```

## 撤销

| 场景 | 命令 |
| --- | --- |
| 丢弃工作区修改 | `git restore <file>` |
| 取消暂存 | `git restore --staged <file>` |
| 修改最近一次提交 | `git commit --amend` |
| 回退提交但保留修改 | `git reset --soft HEAD~1` |
| 查看某次提交 | `git show <hash>` |

## 一个好习惯

提交前先看一遍 `git diff --staged`。确认没有把密钥、临时文件和无关的格式化改动带进提交。
