#!/bin/sh
set -eu

script="$(dirname "$0")/standards/build.sh"
if [ ! -f "$script" ]; then
  printf '%s\n' 'Initialize the standards submodule with git submodule update --init.' >&2
  exit 1
fi

exec sh "$script" "$@"
