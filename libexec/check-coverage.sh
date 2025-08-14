#!/bin/sh
set -e
cd ~/Music

# List all media files
all_files()(
	find . -type f -not \( -path './Music/*' -or -name SHA256 \) \
	| sed 's/^\.\///' \
	| sort -n
)

# List media files that have an entry in the library's checksum database
covered_files(){
	sed 's/^.\{64\}  *//' SHA256 | sort -n
}


# Use process substitution if the shell supports it
# shellcheck disable=SC3001
if eval 'grep -q 3 <(echo 1 2 + n | dc)'; then
	diff -r -U4 <(covered_files) <(all_files)
else
	unset status
	set -- /tmp/covered-files.txt /tmp/all-files.txt
	covered_files > "$1"
	all_files     > "$2"
	diff -r -U4 "$@" || status=$?
	rm -f "$@"
	return ${status:-0}
fi
