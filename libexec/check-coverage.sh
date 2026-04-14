#!/bin/sh
set -e

# List all media files
all_files()(
	cd ~/Music
	find . -type f -not \( -regex "^\./Music/.*" -or -name SHA256 \) \
	| sed 's/^\.\///' \
	| sort -n
)

# List media files that have an entry in the library's checksum database
covered_files(){
	sed -n '/^[0-9A-Fa-f]\{64\}[[:blank:]]\{1,\}\(.*\)$/ {
		s//\1/
		s/^\.\///
		s/[[:blank:]]*$//
		p
	}' ~/Music/SHA256 | sort -n
}

# Assert that all media files are accounted for in the library's “SHA256” file
check_coverage(){
	# Use process substitution if the shell supports it
	# shellcheck disable=SC3001
	if eval 'grep -q 3 <(echo 1 2 + n | dc)' 2>/dev/null; then
		diff=`eval "diff -r -U4 <(covered_files) <(all_files)" || :`
	else
		set -- /tmp/covered-files.txt /tmp/all-files.txt
		covered_files > "$1"
		all_files     > "$2"
		diff=`diff -r -U4 "$@" || :`
		rm -f "$@"
	fi
	if test -n "$diff"; then
		printf '%s\n' "$diff" | format-diff | sed '
			1 s/ expected/ missing files/
			2 s/ actual/ unlisted files/
		'
		return 1
	fi
}

echo 'Affirming coverage of checksum database...'
check_coverage
