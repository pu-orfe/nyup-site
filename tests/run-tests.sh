#!/bin/zsh
#
# Runs the JavaScript regression tests.
#
# Usage:
#   ./run-tests.sh            # run in Docker (default, matches CI)
#   ./run-tests.sh --local    # run with the locally installed Node.js

set -e
set -u

cd "${0:a:h}"

if [[ "${1:-}" == "--local" ]]; then
  if [[ ! -d node_modules ]]; then
    npm ci
  fi
  exec npm test
fi

docker-compose build js-tests

# Note: `status` is a read-only variable in zsh, hence exit_code.
exit_code=0
docker-compose run --rm js-tests || exit_code=$?
docker-compose down --remove-orphans >/dev/null 2>&1 || true
exit $exit_code
