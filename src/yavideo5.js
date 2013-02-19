var YAVideo5 = YAVideo5 || (function () {
	function YAVideo5(config) {
		//Error handling for argument error
		if (typeof config === "undefined") {
			throw new Error("new YAVideo5(): Invalid argument. Argument is missing");
		} else if (typeof config !== "object") {
			throw new Error("new YAVideo5(): Invalid argument. Argument must be an Object");
		}
		//Set variables from config object. If not specified, then set default (|| value).
		autoplay = config.autoplay || false;
		preload = config.preload || "none";
		loop = config.loop || false;
		muted = config.muted || false;
		poster = config.poster || "";
		html5Video = config.html5Video || null;
		flashVideo = config.flashVideo || null;
		videoElement = config.videoElement || null;
		objectElement = config.objectElement || null;
		playButton = config.playButton || null;
		pauseButton = config.pauseButton || null;
		forwardButton = config.forwardButton || null;
		rewindButton = config.rewindButton || null;
		seekbar = config.seekbar || null;
		seekHandle = config.seekHandle || null;
		progressBar = config.progressBar || null;
		currentTimeDisplay = config.currentTimeDisplay || null;
		durationDisplay = config.durationDisplay || null;
		remainingTimeDisplay = config.remainingTimeDisplay || null;
		timeDisplay = config.timeDisplay || null;
		fullScreenButton = config.fullScreenButton || null;
		fullScreenTarget = config.fullScreenTarget || null;
		fullScreenControls = config.fullScreenControls || false;
		deleteUnusedElement = config.deleteUnusedElement || false;

		//Initializing flow
		p.checkSource().setSeekbar().setButtons().initEvents();
	}
		//If the UA support HTML5 Video && the config has playable source available, then true. 
	var useHTML5,
		deleteUnusedElement,
		autoplay, preload, loop, muted, poster, duration, currentTime, playbackRate,
		isPlaying, isSeeking, isFullScreen,
		//Current source from multiple sources of html5Video var.
		src,
		//File type of current source.
		fileType,
		//SWF related vars
		swfInitialized,
		//Playable HTML5 Video file type list. Checked by canPlayType method.
		html5VideoFileTypeList = {
			m3u8: false,
			mp4: false,
			webm: false,
			ogv: false
		},
		//HTML5 Video source object
		//{m3u8: "example.m3u8", mp4: "example.mp4", webm: "example.webm", ogv: "example.ogv"}
		html5Video,
		//Flash Video source
		flashVideo,
		//DOM Elements
		videoElement, objectElement, playButton, pauseButton, forwardButton, rewindButton, seekbar, seekHandle, progressBar,
		currentTimeDisplay, durationDisplay, remainingTimeDisplay, timeDisplay, fullScreenButton, fullScreenTarget,
		//Show browser built-in controller on fullscreen, then true.
		fullScreenControls,
		//Seekbar related vars
		seekbarWidth, handleWidth, seekOffset,
		//Callback store
		startFunction, timeUpdateFunction, completeFunction,
		//prototype
		p = this.prototype = {
			//Check available & playable source
			checkSource: function () {
				if (html5Video === null && flashVideo === null) {
					throw new Error("checkSource(): Configuration error. At least 1 video source required.");
				}
				//If there is no video source for HTML5, then use Flash.
				if (html5Video === null) {
					src = flashVideo;
					useHTML5 = false;
				} else {
					//Update html5VideoFileTypeList
					for (var extension in html5VideoFileTypeList) {
						//Get MIME Type from extension
						var mimeType = p.extensionToMimeType(extension);
						//Check canPlayType
						html5VideoFileTypeList[extension] = p.checkCanPlayType(videoElement, mimeType);
						//If UA supports a file type && an source available, then set the source to src
						if (html5VideoFileTypeList[extension] && html5Video[extension]) {
							useHTML5 = true;
							src = html5Video[extension];
							fileType = extension;
							break;
						}
					}
				}
				if (deleteUnusedElement) {
					if (useHTML5) {
						objectElement.parentNode.removeChild(objectElement);
					} else {
						videoElement.parentNode.removeChild(videoElement);
					}
				}
				return this;
			},
			/* Set seekbar vars from elements.
			 * If you change seekbar width dynamically on window.onresize event etc.,
			 * then call this method with events.
			 */
			setSeekbar: function () {
				if (seekbar) {
					seekbarWidth = seekbar.offsetWidth;
					handleWidth = seekHandle.offsetWidth;
					seekOffset = handleWidth / 2;
				}
				return this;
			},
			setButtons: function () {
				var hasTouchEvent = p.hasTouchEvent();
				var clickEvent = (hasTouchEvent) ? "touchend" : "click";
				var mousedownEvent = (hasTouchEvent) ? "touchstart" : "mousedown";
				if (playButton) playButton.addEventListener(clickEvent, p.clickPlay, false);
				if (pauseButton) playButton.addEventListener(clickEvent, p.clickPause, false);
				if (seekbar) playButton.addEventListener(mousedownEvent, p.mousedownSeekbar, false);
				return this;
			},
			initEvents: function () {
				if (useHTML5) {
					p.initHTML5();
				} else {
					p.initFlash();
				}
				return this;
			},
			initHTML5: function () {
				videoElement.src = src;
				videoElement.muted = muted;
				videoElement.autoplay = autoplay;
				videoElement.poster = poster;
				videoElement.loop = loop;
				videoElement.load();
				videoElement.addEventListener("canplay", p.canplayListener, false);
				videoElement.addEventListener("durationchange", p.durationchangeListener, false);
				videoElement.addEventListener("play", p.playListener, false);
				videoElement.addEventListener("pause", p.pauseListener, false);
				videoElement.addEventListener("timeupdate", p.timeupdateListener, false);
				videoElement.addEventListener("ended", p.endedListener, false);
				videoElement.addEventListener("error", p.errorListener, false);
				return this;
			},
			enableButton: function (buttonName, ev, fn) {
				buttonName.addEventListener(ev, fn, false);
			},
			canplayListener: function () {
				var durationMMSS = p.secToMMSS(this.duration);
				var currentMMSS = p.secToMMSS(this.currentTime);
				if (timeDisplay) {
					timeDisplay.innerHTML = currentMMSS + " / " + durationMMSS;
				}
			},
			clickPlay: function () {
				p.play();
			},
			play: function () {
				if (useHTML5) {
					videoElement.play();
				} else {
					swf.playSWF();
				}
			},
			/* Convert file extension to MIME type.
			 * @param {String} extension File extension
			 * @return {String} MIME Type
			 */
			extensionToMimeType: function (extension) {
				var mimeType = "";
				switch (extension) {
					case "m3u8":
						mimeType = "application/x-mpegURL";
						break;
					case "mp4":
						mimeType = "video/mp4";
						break;
					case "ogv":
						mimeType = "video/ogg";
						break;
					case "webm":
						mimeType = "video/webm";
						break;
					default:
						throw new Error("extensionToMimeType(): The file type you set is not supported by most UA");
				}
				return mimeType;
			},
			/* Check playable file type from MIME type by using canPlayType method.
			 * @param {String} mimeType MIME Type
			 * @return {Boolean} if playable, then true
			 */
			checkCanPlayType: function (videoElement, mimeType) {
				//If there is no Video Element or UA doesn't support HTML5 Video (Old IE etc.), then return false to prevent error on canPlayType method.
				if (!videoElement || !videoElement.canPlayType) {
					return false;
				}
				var canPlay = videoElement.canPlayType(mimeType);
				if (canPlay == "probably" || canPlay == "maybe") {
					return true;
				} else {
					return false;
				}
			},
			/* Determine touchevent available
			 * @return {Boolean} if available, then true
			 */
			hasTouchEvent: function () {
				return (window.ontouchstart) ? true : false;
			},
			/* Convert seconds value into "MM:SS" string
			 * @param {Number} seconds
			 * @return {String} "MM:SS" string
			 */
			secToMMSS: function (sec) {
				//Convert argument into a integer value in case if Infinity, NaN etc.
				var s = sec | 0;
				var seconds = s % 60;
				var minutes = s / 60 | 0;
				if (seconds < 10) {
					seconds = "0" + seconds;
				}
				if (minutes < 10) {
					minutes = "0" + minutes;
				}
				return minutes + ":" + seconds;
			}
		}
	return YAVideo5;
})();