#!/bin/sh
set -e

# Generate diff(1)-friendly outline of library
print_outline(){
	cd ~/Music
	find . \( -type f -or -type d \) -mindepth 1 -not \( \
		-path './Music'   -or \
		-path './Music/*' -or \
		-path './SHA256' \
	\) -exec stat -f '%Fa %Fm %Fc %Sp %010z%t%N' {} + \
	| LANG=C sort -k6 | format_outline "$@"
}

# Wrangle the printed outline into a desired format
format_outline(){
	case $1 in
		# Print filesystem entities on their own line, followed by indented metadata
		-l|--long) awk '
			BEGIN { FS = " "; }
			{
				atime = $1
				mtime = $2
				ctime = $3
				mode  = $4
				size  = $5
				name  = substr($0, 86);
				if(name ~ /^\.\//)     name = substr(name, 3)
				if(match(size, /^0+/)) size = substr(size, RLENGTH + 1)
				print name
				printf "\tMode:     %s\n", mode
				printf "\tAccessed: %s\n", atime
				printf "\tModified: %s\n", mtime
				printf "\tChanged:  %s\n", ctime
				if(mode !~ /^d/) printf "\tFilesize: %s\n", size
			}
		';;
		# JSON-formatted object array
		-j|--json)
			echo "["
			sed '
				s/"/\\"/g
				s/^/{"atime":"/
				s/ /","mtime":"/
				s/ /","ctime":"/
				s/ /","mode":"/
				s/ 0*/","size":/
				s/	\(\.\/\)\{0,1\}/,"name":"/
				s/[[:blank:]]*$/"}/
				$! s/$/,/
			'
			echo "]"
		;;
		# Strip leading “./” from filename field
		*) sed 's/	\(\.\/\)\{0,1\}/ /';;
	esac
}

print_outline "$@"
