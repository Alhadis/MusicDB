#!/usr/bin/env node
// Source: http://www.ipodlinux.org/ITunesDB/iTunesDB_File.html

import fs from "fs";


/**
 * A null-prototype object used to cache {@link TextDecoder}
 * instances created by {@link DataView.prototype.getText}.
 * @const {Object} encoders
 */
const encoders = {__proto__: null};

Object.assign(DataView.prototype, {
	/**
	 * Read an array of bytes from the buffer source.
	 * @param {Number} [byteOffset=0]
	 * @param {Number} [length]
	 * @return {Uint8Array}
	 */
	getBytes(byteOffset = 0, length = this.byteLength - byteOffset){
		return new Uint8Array(this.buffer, byteOffset, length).slice();
	},

	/**
	 * Read a string from the buffer source.
	 *
	 * @example view.getText(0, 9) === "#!/bin/sh";
	 * @example view.getText(0, 2, null) == [0x23, 0x21];
	 * @param {Number} byteOffset
	 * @param {Number} length
	 * @param {?String} [encoding="ascii"]
	 * @param {Boolean} [littleEndian=false]
	 * @return {String|Uint8Array}
	 *    A byte-array if the encoding parameter was `null`; otherwise,
	 *    a string encoded using {@link TextDecoder.prototype.decode}.
	 */
	getText(byteOffset, length, encoding = "ascii", littleEndian = false){
		const bytes = new Uint8Array(this.buffer, byteOffset, length);
		encoding = `${encoding}`.trim().toLowerCase().replace(/^utf(8|16)$/i, "utf-$1");
		switch(encoding){
			case "binary":
			case "buffer":
			case "null":
				return bytes;
			case "utf-16":
				encoding += littleEndian ? "le" : "be";
				break;
			case "ascii":
			case "us-ascii":
				return String.fromCharCode(...bytes);
		}
		encoders[encoding] ??= new TextDecoder(encoding);
		return encoders[encoding].decode(bytes);
	},
});

/**
 * Convert a Mac HFS+ timestamp to something useful.
 * @param {Number} timestamp
 * @return {Date}
 */
Date.fromMacTime = function(timestamp){
	if(!timestamp)
		return null;
	return new Date(1000 * (timestamp - 2082844800));
};


/**
 * Ensure the argument is a {@link DataView} object.
 * @param {DataView|Buffer|ArrayBuffer|SharedArrayBuffer|TypedArray} input
 * @return {DataView}
 * @internal
 */
function dv(input){
	if(input instanceof Buffer)
		return new DataView(new Uint8Array([...input]).buffer);
	if(input instanceof DataView)
		return input;
	if(input instanceof ArrayBuffer || input instanceof SharedArrayBuffer)
		return new DataView(input);
	return new DataView(input.buffer);
}

/**
 * Parse an iTunes file data object.
 * @param {DataView|Uint8Array} data
 * @return {Object}
 * @public
 */
export function mhfd(data){
	data = dv(data);
	return {
		headerIdentifier: data.getText(0, 4),
		headerLength:     data.getUint32(4, true),
		totalLength:      data.getUint32(8, true),
		unknown1:         data.getUint32(12, true),
		unknown2:         data.getUint32(16, true),
		numberOfChildren: data.getUint32(20, true),
		unknown3:         data.getUint32(24, true),
		nextIDForMHII:    data.getUint32(28, true),
		unknown5:         data.getBytes(32, 8),
		unknown6:         data.getBytes(40, 8),
		unknown7:         data.getUint32(48, true),
		unknown8:         data.getUint32(52, true),
		unknown9:         data.getUint32(56, true),
		unknown10:        data.getUint32(60, true),
		unknown11:        data.getUint32(64, true),
	};
}

/**
 * Parse an iTunes track item.
 * @param {DataView|Uint8Array} data
 * @return {Object}
 * @public
 */
export function mhit(data){
	data = dv(data);
	return {
		headerIdentifier:  data.getText(0, 4),
		headerLength:      data.getUint32(4, true),
		totalLength:       data.getUint32(8, true),
		numberOfStrings:   data.getUint32(12, true),
		uniqueID:          data.getUint32(16, true),
		visible:           1 === data.getUint32(20, true),
		filetype:          String.fromCharCode(...data.getBytes(24, 4).reverse()),
		type1:             data.getUint8(28),
		type2:             data.getUint8(29),
		compilationFlag:   1 === data.getUint8(30),
		rating:            data.getUint8(31) / 20,
		lastModified:      Date.fromMacTime(data.getUint32(32, true)),
		size:              data.getUint32(36, true),
		length:            data.getUint32(40, true),
		trackNumber:       data.getUint32(44, true),
		totalTracks:       data.getUint32(48, true),
		year:              data.getUint32(52, true),
		bitRate:           data.getUint32(56, true),
		sampleRate:        data.getUint32(60, true) / 0x10000,
		volumeAdjustment:  data.getInt32(64, true),
		startTime:         data.getUint32(68, true),
		stopTime:          data.getUint32(72, true),
		soundCheck:        data.getUint32(76, true),
		playCount:         data.getUint32(80, true),
		playCount2:        data.getUint32(84, true),
		lastPlayedTime:    Date.fromMacTime(data.getUint32(88, true)),
		discNumber:        data.getUint32(92, true),
		totalDiscs:        data.getUint32(96, true),
		userID:            data.getUint32(100, true),
		dateAdded:         Date.fromMacTime(data.getUint32(104, true)),
		bookmarkTime:      data.getUint32(108, true),
		dbID:              data.getBigUint64(112, true),
		checked:           0 === data.getUint8(120),
		appRating:         data.getUint8(121),
		bpm:               data.getUint16(122, true),
		artworkCount:      data.getUint16(124, true),
		unk9:              data.getUint16(126, true),
		artworkSize:       data.getUint32(128, true),
		unk11:             data.getUint32(132, true),
		sampleRate2:       data.getFloat32(136, true),
		dateReleased:      Date.fromMacTime(data.getUint32(140, true)),
		unk14a:            data.getUint16(144, true),
		unk14b:            data.getUint16(146, true),
		unk15:             data.getUint32(148, true),
		unk16:             data.getUint32(152, true),
		skipCount:         data.getUint32(156, true),
		lastSkipped:       Date.fromMacTime(data.getUint32(160, true)),
		hasArtwork:        data.getUint8(164),
		skipWhenShuffling: 1 === data.getUint8(165),
		rememberPosition:  1 === data.getUint8(166),
		flag4:             data.getUint8(167),
		dbID2:             data.getBigUint64(168, true),
		lyricsFlag:        1 === data.getUint8(176),
		movieFileFlag:     1 === data.getUint8(177),
		playedMark:        data.getUint8(178),
		unk17:             data.getUint8(179),
		unk21:             data.getUint32(180, true),
		pregap:            data.getUint32(184, true),
		sampleCount:       data.getBigUint64(188, true),
		unk25:             data.getUint32(196, true),
		postgap:           data.getUint32(200, true),
		unk27:             data.getUint32(204, true),
		mediaType: {
			__proto__: null,
			0:  "Audio/Video",
			1:  "Audio",
			2:  "Video",
			4:  "Podcast",
			6:  "Video podcast",
			8:  "Audiobook",
			32: "Music video",
			64: "TV show",
			96: "TV show",
		}[data.getUint32(208, true) || "Unknown"],
		seasonNumber:     data.getUint32(212, true),
		episodeNumber:    data.getUint32(216, true),
		unk31:            data.getUint32(220, true),
		unk32:            data.getUint32(224, true),
		unk33:            data.getUint32(228, true),
		unk34:            data.getUint32(232, true),
		unk35:            data.getUint32(236, true),
		unk36:            data.getUint32(240, true),
		unk37:            data.getUint32(244, true),
		gaplessData:      data.getUint32(248, true),
		unk38:            data.getUint32(252, true),
		gaplessTrackFlag: 1 === data.getUint16(256, true),
		gaplessAlbumFlag: 1 === data.getUint16(258, true),
		unk39:            data.getBytes(260, 20),
		unk40:            data.getUint32(288, true),
		unk41:            data.getUint32(300, true),
		unk42:            data.getUint32(304, true),
		unk43:            data.getUint32(308, true),
		unk44:            data.getUint16(312, true),
		albumID:          data.getUint16(314, true),
		mhiiLink:         data.getUint32(352, true),
	};
}

const fd = fs.openSync("/Users/Alhadis/Downloads/DankPods/_/recup_dir.1/f0252797.apple");
const buf = Buffer.alloc(2048);
const read = pos => {
	const {length} = buf;
	const bytesRead = fs.readSync(fd, buf, 0, length, pos || 0);
	return bytesRead < length ? buf.subarray(0, bytesRead) : buf;
};
console.log(mhfd(read(0x2000)));
