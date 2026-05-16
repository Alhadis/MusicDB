#!/bin/sh

#
# outline-library.sh: Generate diff(1)-friendly outline of directory
#
set -e


# Omit last-access and last-changed timestamps if “-m” switch is passed.
# (NB: This must be the first argument provided).
export m=0 >/dev/null 2>&1 || :
case $1 in
	-m?*) head="${1#??}"; m=1; shift; set -- "-$head" "$@";;
	-m|--mtime-only) m=1; shift;;
esac


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
				if('"$m"'){
					printf "\tMode:     %s\n", mode
					printf "\tModified: %s\n", mtime
				}
				else{
					printf "\tMode:     %s\n", mode
					printf "\tAccessed: %s\n", atime
					printf "\tModified: %s\n", mtime
					printf "\tChanged:  %s\n", ctime
				}
				if(mode !~ /^d/) printf "\tFilesize: %s\n", size
			}
		';;
		# JSON-formatted object array
		-j|--json)
			echo "["
			if [ "$m" = 1 ]; then m='
				s/^/{"mtime":"/
			'; else m='
				s/^/{"atime":"/
				s/ /","mtime":"/
				s/ /","ctime":"/
			'; fi
			set -x
			sed '
				s/"/\\"/g'"$m"'
				s/ /","mode":"/
				s/ 0*/","size":/
				s/	\(\.\/\)\{0,1\}/,"name":"/
				s/[[:blank:]]*$/"}/
				$! s/$/,/
			'
			set +x
			echo "]"
		;;
		# Strip leading “./” from filename field
		*) sed 's/	\(\.\/\)\{0,1\}/ /';;
	esac
}

case $m in
	1) key=4; stat='%Fm %Sp %010z%t%N';;
	*) key=6; stat='%Fa %Fm %Fc %Sp %010z%t%N';;
esac

find . \( -type f -or -type d \) -mindepth 1 -not \( \
	-path './Music'   -or \
	-path './Music/*' -or \
	-path './SHA256' \
\) -exec stat -f "$stat" {} + \
| LANG=C sort "-k$key" | format_outline "$@"
