#!/bin/bash
set -euo pipefail

copy_env_file() {
  local src="${1%/}"
  local dst="${2%/}"
  local rel=".env.local"
  local file="$src/$rel"
  local target="$dst/$rel"

  if [ ! -e "$file" ]; then
    echo "Skipped missing env file: $rel" >&2
    return 0
  fi

  cp -L "$file" "$target"
  chmod 600 "$target"
  echo "Copied: $rel"
}

COMMON_GIT_DIR="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)"
MAIN_WORKTREE="$(cd "${COMMON_GIT_DIR}/.." && pwd -P)"
CURRENT_WORKTREE="$(pwd -P)"

copy_env_file "$MAIN_WORKTREE" "$CURRENT_WORKTREE"
