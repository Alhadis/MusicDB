#!/bin/sh
set -e

# Resolve various input formats
set -- `printf '%s\n' "$1" | sed '
	s/^[[:blank:]]*//
	s/[[:blank:]]*$//
	s/^[Hh][Tt][Tt][Pp][Ss]*:\/*//
	s/^\([^ .\/]\{1,\}\)\(\.[Bb][Aa][Nn][Dd][Cc][Aa][Mm][Pp]\.[Cc][Oo][Mm]\)\{0,1\}[ \/]/\1\//
	s/^\([^ .\/]*\)\([\/[:blank:]]\{1,\}album\)\{0,1\}[\/[:blank:]]\{1,\}/\1 /
	s/^\([^ ]*\) \([^\/#?]\{1,\}\)/\1 \2/
'`

# No argument? No service
[ "$*" ] || {
	printf >&2 'Usage: %s <artist>/<release-title>\n' "$0"
	exit 2
}

# Verify well-formedness of artist and release title, respectively
for i in "$@"; do case $i in *[./:#?\ ]*|"")
	printf >&2 'Invalid name: %s\n' "$i"
	exit 2
;; esac; done

eval "`curl "https://$1.bandcamp.com/album/$2" \
| sed '/<script type="application\/ld+json">/ s//\n&\n/g; /<\/script>/ s//\n&\n/g' \
| sed -n '/<script type="application\/ld+json">/, /<\/script>/ { s///; p; }' \
| jq -r '
	"title="  + (.name | @sh),
	"artist=" + (.byArtist.name | @sh),
	"year="   + (.datePublished | strptime("%d %b %Y %T %Z") | strftime("%Y") | @sh),
	"tracks=" + ([.track.itemListElement[].item.name] | join("\n") | @sh)
'`"
printf '%s\n%s\n\n%s\n\n%s\n' "$title" "$artist" "$year" "$tracks"
