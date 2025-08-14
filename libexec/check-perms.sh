#!/bin/sh
cd ~/Music

# Assert that a command prints to stdout and/or stderr.
#
# Parameters:
#    $1 command - Shell command to evaluate
#    $2 message - Error message displayed on failure
#    $3 testcmd - Assertion command determining success or failure
#
# Example:
#    assert_output 'ls ~/Desktop/.DS_Store' "Expected Steve Jobs's toenails on my floor"
#
assert_output(){
	cmpcmd="${3:-test -z}"
	result=`eval "$1" 2>&1`
	if $cmpcmd "$result"
	then
		printf '%s:\n' "$2"
		printf '%s\n' "$result" | sed s/^/\\t/
		return 1
	fi
}

# Assert that a command produces no output. Logical complement of `assert_output()`
refute_output(){
	assert_output "$1" "$2" 'test -n'
}


# Root of music directory should only contain directories and “SHA256”
refute_output \
	'find . -type f -maxdepth 1 -not \( -name "SHA256" \) | sort' \
	'Unexpected files in root of music directory'

# Check that files are read-only, and directories public but writable by user only
refute_output \
	'find . -type f -not \( -perm 0444 -or -regex "^\./Music/.*" \) -mindepth 2' \
	'Files must be read-only'
refute_output \
	'find . -type d -not \( -perm 0755 -or -regex "^\./Music/.*" \)' \
	'Directories must be public and user-writable only'

# Check that ownership is consistent
refute_output \
	'find . -not -gid "`id -g`" -or -not -uid "`id -u`"' \
	'Unusual group or user ownership'

# Check that library is clean of extended attributes (which aren't portable)
refute_output \
	'find . -xattr -and -not -regex "^\./Music/.*"' \
	'Extended attributes found on library item(s)'
