#!/bin/sh
set -e

# Generate diff(1)-friendly outline of library
cd ~/Music
find . \( -type f -or -type d \) -mindepth 1 -not \( \
	-path './Music'   -or \
	-path './Music/*' -or \
	-path './SHA256' \
\) -exec stat -f '%m %Sp %N' {} + | LANG=C sort -k3,4
