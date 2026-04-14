#!/bin/sh
set -e

# Convert `./outline-library.sh --long` output into a sequence of `mtime`
# commands for correcting timestamps of scp(1) transfers in an SSH session,
# with the session's PWD assumed to be `/mnt/Music`.
sed "
	/^	Mode:/d
	/^	Accessed:/d
	/^	Changed:/d
	/^	Filesize:/d
	s/'/'\\\''/g
" | paste - - | sed '
	s/[[:blank:]]*$//
	/^\([^	]*\)	\{1,\}Modified:[[:blank:]]*\([0-9.]*\)$/ {
		s//mtime \2 '\''\1'\''; /
	}
' | tac
