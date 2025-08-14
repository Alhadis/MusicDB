#!/usr/bin/env node
"fuck babel";

import Plist from "/usr/local/lib/node_modules/plist/index.js";
import {fileURLToPath} from "url";
import {readFileSync} from "fs";
import assert from "assert";

// Don't execute program if it's being imported by another application
if(process.argv[1] === fileURLToPath(import.meta.url)){
	const argv = process.argv.slice(2);
	const task = argv.shift();
	switch(task){
		case "-n":
		case "--normalise": {
			const lib = loadLibrary(argv[0]);
			process.stdout.write(makePlist(lib) + "\n");
			break;
		}
		
		case "-d":
		case "--diff": {
			const a = loadLibrary(argv.shift());
			const b = loadLibrary(argv.shift());
			compareLibraries(a, b);
		}
	}
}

/**
 * Display changes between two iTunes library objects.
 * @param {Object} a
 * @param {Object} b
 * @return {void}
 */
export function compareLibraries(a, b){
	
}


/**
 * Load and normalise an exported iTunes library in XML plist(5) format.
 * @param {String} path
 * @return {Object}
 */
export function loadLibrary(path){
	const lib = Plist.parse(readFileSync(path, "utf8"));
	normaliseTrackIDs(lib);
	return lib;
}

/**
 * Convert an object into XML plist(5) source.
 * @param {Object} input
 * @return {String}
 */
export function makePlist(input){
	let xml = Plist.build(input, {
		pretty: true,
		indent: "\t",
		newline: "\n",
		allowEmpty: false,
		spaceBeforeSlash: "",
	}).replace(/^(\t*<key>[^<>]*<\/key>)\s+(?=<[a-z]+)(?!<dict\b|<array\b)/gm, "$1");

	// Keep plist's root element unindented
	if(/^<!DOCTYPE\s+plist\b[^<>]*>\s+<plist(?=\s|>)[^>]*>\n\t+</m.test(xml))
		xml = xml.replace(/^\t/gm, "");
	
	// Keep doctype consistent with that used by iTunes libraries exported as XML
	xml = xml.replace(/^(<!DOCTYPE plist PUBLIC "-(\/\/)Apple)\2/m, "$1 Computer$2");
	
	return xml;
}

/**
 * Strip randomly-assigned internal IDs used for tracks and playlists, and sort the latter.
 * @param {Object} plist
 * @return {Object} A reference to the original argument
 * @internal
 */
export function normaliseTrackIDs(plist){
	// Return subject untouched if its tracks are already normalised
	let k; for(k in plist.Tracks) break; k;
	if(parseInt(k, 10).toString() === k && Number.isNaN(+k)
	&& plist.Tracks[k]?.["Track ID"] !== k)
		return plist;
	
	// Clean up track objects
	const remappedIDs = {};
	const fixedTracks = Object.entries(plist.Tracks).map(([key, value]) => {
		const path = fileURLToPath(value.Location);
		if(!path.startsWith("/Users/Alhadis/Music/"))
			throw new TypeError("Unexpected track path: " + path);
		remappedIDs[key] = key = path.slice(21);
		delete value["Track ID"];
		return [key, value];
	}).sort((a, b) => a[0].localeCompare(b[0]));
	const tracks = {};
	for(const [key, value] of fixedTracks){
		if(key in tracks)
			throw TypeError(`Duplicate key: ${key}`);
		tracks[key] = value;
	}
	plist.Tracks = tracks;
	
	// Clean up playlist arrays
	for(const playlist of plist.Playlists){
		delete playlist["Playlist ID"]; // Unneeded
		const items = playlist["Playlist Items"];
		const {length} = items;
		for(let i = 0; i < length; ++i){
			const item = items[i];
			let id = item["Track ID"];
			if(!(id in remappedIDs))
				throw new ReferenceError(`Unrecognised track ID: ${id}`);
			item["Track ID"] = id = remappedIDs[id];
			if(1 === Object.keys(item).length)
				items[i] = id;
		}
	}
	return plist;
}
