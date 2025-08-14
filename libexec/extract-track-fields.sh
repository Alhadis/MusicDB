#!/bin/sh
set -e

test -n "$1"
sed < "$1" -n '/^	<dict>$/, /^	<\/dict>$/p' \
| sed -n 's/^			<key>\([^>]*\)<\/key><\([^>\/]*\).*/\1	\2/p' \
| sed 's/true$/boolean/; s/false$/boolean/' \
| sort \
| uniq
