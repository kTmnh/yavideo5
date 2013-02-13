var $PS = $PS || {};
$PS.VideoController = $PS.VideoController || function (conf) {
	if (typeof conf === "undefined") {
		throw new Error("VideoController():\u5f15\u6570\u304c\u3042\u308a\u307e\u305b\u3093");
		return false
	} else {
		if (typeof conf !== "object") {
			throw new Error("VideoController():\u5f15\u6570\u306e\u578b\u304c\u30aa\u30d6\u30b8\u30a7\u30af\u30c8\u3067\u306f\u3042\u308a\u307e\u305b\u3093");
			return false
		}
	}
	var _proto = $PS.VideoController.prototype;
	var isiOS = _proto.isiOS();
	var hasTouchEvent = _proto.hasTouchEvent();
	var useTransition = $.support.transition;
	var target = "swf";
	var autoplay = conf.autoplay || false;
	var loop = conf.loop || false;
	var muted = conf.muted || false;
	var poster = conf.poster || "";
	var duration = 0;
	var currentTime = 0;
	var isPlaying = false;
	var isSeeking = false;
	var isFullScreen = false;
	var swfInitialized = false;
	var html5VideoFileTypeList = {
		"m3u8": false,
		"mp4": false,
		"webm": false,
		"ogv": false
	};
	var html5Video = conf.html5Video || null;
	var flashVideo = conf.flashVideo || null;
	var src = "";
	var playbackRate = 1;
	var fileType = "";
	var videoElement = conf.videoElement || null;
	var swf = conf.objectElement || null;
	var playButton = conf.playButton || null;
	var pauseButton = conf.pauseButton || null;
	var framePlayButton = conf.framePlayButton || null;
	var framePauseButton = conf.framePauseButton || null;
	var altPlayButton = conf.altPlayButton || null;
	var altPauseButton = conf.altPauseButton || null;
	var seekbar = conf.seekbar || null;
	var seekbarHandle = conf.seekbarHandle || null;
	var forwardButton = conf.forwardButton || null;
	var rewindButton = conf.rewindButton || null;
	var altForwardButton = conf.altForwardButton || null;
	var altRewindButton = conf.altRewindButton || null;
	var timeBackground = conf.timeBackground || null;
	var fullScreenButton = conf.fullScreenButton || null;
	var fullScreenTarget = conf.fullScreenTarget || null;
	var fullScreenControls = conf.fullScreenControls || false;
	var seekbarWidth = 0;
	var handleWidth = 0;
	var seekWidth = 0;
	var seekGap = 0;
	var seekScale = seekWidth / seekbarWidth;

	function startFunction() {}

	function timeUpdateFunction() {}

	function completeFunction() {}
	setup(conf);

	function setup(conf) {
		if (html5Video === null) {
			src = flashVideo[1]
		} else {
			if (html5Video !== null) {
				for (var key in html5VideoFileTypeList) {
					var mimeType = _proto.extensionToMimeType(key);
					html5VideoFileTypeList[key] = _proto.checkCanPlayType(videoElement, mimeType)
				}
				for (var key in html5VideoFileTypeList) {
					if (html5VideoFileTypeList[key] && html5Video[key]) {
						target = "video";
						src = html5Video[key][1];
						fileType = key;
						break
					}
				}
			}
		}
		setSeekbar(seekbar, seekbarHandle);
		if (target == "video") {
			initHTML5()
		} else {
			if (target == "swf") {
				src = flashVideo[1];
				initFlash()
			} else {
				throw new Error("VideoController.setup:checkCanPlayType\u306b\u5931\u6557\u3057\u3066\u3044\u308b\u3088\u3046\u3067\u3059");
				return false
			}
		}
		setButtons()
	}

	function setButtons() {
		var clickEvent = hasTouchEvent ? "touchend" : "click";
		var mousedownEvent = hasTouchEvent ? "touchstart" : "mousedown";
		if (playButton) {
			addEvent(playButton, clickEvent, clickPlay)
		}
		if (altPlayButton) {
			addEvent(altPlayButton, clickEvent, clickPlay)
		}
		if (pauseButton) {
			addEvent(pauseButton, clickEvent, clickPause)
		}
		if (altPauseButton) {
			addEvent(altPauseButton, clickEvent, clickPause)
		}
		if (framePlayButton) {
			addEvent(framePlayButton, clickEvent, clickFrame)
		}
		if (framePauseButton) {
			addEvent(framePauseButton, clickEvent, clickFrame)
		}
		if (forwardButton) {
			addEvent(forwardButton, clickEvent, clickForward)
		}
		if (rewindButton) {
			addEvent(rewindButton, clickEvent, clickRewind)
		}
		if (altForwardButton) {
			addEvent(altForwardButton, clickEvent, clickForward)
		}
		if (altRewindButton) {
			addEvent(altRewindButton, clickEvent, clickRewind)
		}
		if (seekbar) {
			addEvent(seekbar, mousedownEvent, mousedownSeekbar)
		}
		if (fullScreenButton) {
			addEvent(fullScreenButton, clickEvent, function () {
				toggleFullScreen(fullScreenTarget)
			})
		}
	}

	function initHTML5() {
		if (swf.parentNode) {
			swf.parentNode.removeChild(swf)
		}
		videoElement.src = src;
		videoElement.muted = muted;
		videoElement.autoplay = isiOS ? false : autoplay;
		videoElement.poster = poster;
		if (videoElement.autoplay && framePlayButton) {
			framePlayButton.style.opacity = 0
		}
		videoElement.loop = loop;
		videoElement.load();
		addEvent(videoElement, "canplay", canplayListener);
		addEvent(videoElement, "durationchange", durationchangeListener);
		addEvent(videoElement, "play", playListener);
		addEvent(videoElement, "pause", pauseListener);
		addEvent(videoElement, "timeupdate", timeupdateListener);
		addEvent(videoElement, "ended", endedListener);
		addEvent(videoElement, "error", errorListener)
	}

	function initFlash() {
		var si = setInterval(function () {
			if (swf.initSWF) {
				swf.initSWF(src);
				clearInterval(si)
			}
		}, 10)
	}

	function setSeekbar(seekbar, seekbarHandle) {
		seekbarWidth = seekbar.offsetWidth;
		handleWidth = seekbarHandle.offsetWidth;
		seekWidth = seekbarWidth - handleWidth;
		seekGap = handleWidth / 2;
		seekScale = seekWidth / seekbarWidth
	}

	function canplayListener() {
		duration = this.duration * playbackRate;
		currentTime = this.currentTime * playbackRate;
		if (!timeBackground) {
			return false
		}
		var currentMMSS = _proto.secToMMSS(currentTime);
		var durationMMSS = _proto.secToMMSS(duration);
		timeBackground.innerHTML = currentMMSS + "/" + durationMMSS
	}

	function durationchangeListener() {
		duration = this.duration * playbackRate
	}

	function playListener() {
		if (duration === Infinity || duration === NaN) {
			duration = this.duration * playbackRate
		}
		pauseButton.style.display = "block";
		playButton.style.display = "none";
		if (altPauseButton) {
			altPauseButton.style.display = "block"
		}
		if (altPlayButton) {
			altPlayButton.style.display = "none"
		}
		isPlaying = true
	}

	function pauseListener() {
		pauseButton.style.display = "none";
		playButton.style.display = "block";
		if (altPauseButton) {
			altPauseButton.style.display = "none"
		}
		if (altPlayButton) {
			altPlayButton.style.display = "block"
		}
		isPlaying = false
	}

	function timeupdateListener(time) {
		if (startFunction != null) {
			startFunction();
			startFunction = null
		}
		timeUpdateFunction();
		if (target == "video") {
			getCurrentTime()
		} else {
			if (target == "swf") {
				currentTime = time * playbackRate
			}
		}
		if (!isSeeking) {
			seekbarHandle.style.left = getSeekbarHandleLeft() + "px"
		}
		if (!timeBackground) {
			return false
		}
		var currentMMSS = _proto.secToMMSS(currentTime);
		var durationMMSS = _proto.secToMMSS(duration);
		if (this.currentTime < 0) {
			currentMMSS = _proto.secToMMSS(0)
		}
		timeBackground.innerHTML = currentMMSS + "/" + durationMMSS
	}

	function endedListener() {
		if (completeFunction != null) {
			completeFunction();
			completeFunction = null
		}
		pauseListener()
	}

	function errorListener(e) {
		throw new Error("VideoController.errorListener():" + e.target.error.code);
	}

	function clickPlay() {
		framePauseButton.style.opacity = "0";
		framePlayButton.style.opacity = "0";
		play()
	}

	function clickPause() {
		framePauseButton.style.opacity = "0";
		framePlayButton.style.opacity = "0";
		pause()
	}

	function clickFrame() {
		if (isPlaying) {
			if (useTransition) {
				$(framePauseButton).css({
					"opacity": 1,
					"scale": 1
				}).transition({
					"opacity": 0,
					"scale": 1.6
				}, 750)
			} else {
				$(framePauseButton).css("opacity", 1).animate({
					"opacity": 0
				}, 750)
			}
			pause()
		} else {
			if (useTransition) {
				$(framePlayButton).css({
					"opacity": 1,
					"scale": 1
				}).transition({
					"opacity": 0,
					"scale": 1.6
				}, 750)
			} else {
				$(framePlayButton).css("opacity", 1).animate({
					"opacity": 0
				}, 750)
			}
			play()
		}
	}

	function clickForward() {
		var targetTime = (currentTime + 30) / playbackRate;
		if (targetTime > duration) {
			targetTime = duration - 1
		}
		seek(targetTime)
	}

	function clickRewind() {
		var targetTime = (currentTime - 30) / playbackRate;
		if (targetTime <= 0) {
			targetTime = 0
		}
		seek(targetTime)
	}

	function getSeekbarHandleLeft() {
		return currentTime / duration * seekScale * seekbarWidth
	}

	function getSeekbarHandlePosition(seekbarX) {
		if (seekbarX <= seekGap) {
			seekbarX = 0
		} else {
			if (seekbarX >= seekbarWidth - seekGap) {
				seekbarX = seekbarWidth - handleWidth
			} else {
				seekbarX -= seekGap
			}
		}
		return seekbarX
	}

	function mousedownSeekbar(e) {
		if (!isPlaying) {
			clickPlay()
		}
		isSeeking = true;
		var bounds = seekbar.getBoundingClientRect();
		if (hasTouchEvent) {
			var tempSeekbarX = e.touches[0].pageX - bounds.left
		} else {
			var tempSeekbarX = e.pageX - bounds.left
		}
		var seekbarX = getSeekbarHandlePosition(tempSeekbarX);
		seekbarHandle.style.left = seekbarX + "px";
		if (hasTouchEvent) {
			window.ontouchmove = function (e) {
				mousemoveWindow(e)
			};
			window.ontouchend = function (e) {
				mouseleaveWindow(e)
			}
		} else {
			window.onmousemove = function (e) {
				mousemoveWindow(e)
			};
			window.onmouseleave = function (e) {
				mouseleaveWindow(e)
			};
			window.onmouseup = function (e) {
				mouseleaveWindow(e)
			}
		}
	}

	function mousemoveWindow(e) {
		var bounds = seekbar.getBoundingClientRect();
		if (hasTouchEvent) {
			var seekbarX = e.touches[0].pageX - bounds.left
		} else {
			var seekbarX = e.pageX - bounds.left
		}
		var returnSeekbarX = getSeekbarHandlePosition(seekbarX);
		seekbarHandle.style.left = returnSeekbarX + "px"
	}

	function mouseleaveWindow(e) {
		var bounds = seekbar.getBoundingClientRect();
		if (hasTouchEvent) {
			var seekbarX = e.changedTouches[0].pageX - bounds.left
		} else {
			var seekbarX = e.pageX - bounds.left
		}
		var returnSeekbarX = getSeekbarHandlePosition(seekbarX);
		isSeeking = false;
		mouseupSeekbar(returnSeekbarX);
		if (hasTouchEvent) {
			window.ontouchmove = undefined;
			window.ontouchend = undefined
		} else {
			window.onmousemove = undefined;
			window.onmouseleave = undefined;
			window.onmouseup = undefined
		}
	}

	function mouseupSeekbar(seekbarX) {
		var percent = seekbarX / seekWidth;
		var targetTime = duration * percent / playbackRate;
		seek(targetTime)
	}

	function play() {
		if (target == "video") {
			videoElement.play();
			play = function () {
				videoElement.play()
			};
			return false
		} else {
			if (target == "swf") {
				swf.playSWF();
				play = function () {
					swf.playSWF()
				};
				return false
			}
		}
	}

	function pause() {
		if (target == "video") {
			videoElement.pause();
			pause = function () {
				videoElement.pause()
			};
			return false
		} else {
			if (target == "swf") {
				swf.pauseSWF();
				pause = function () {
					swf.pauseSWF()
				};
				return false
			}
		}
	}

	function seek(targetTime) {
		if (target == "video") {
			videoElement.currentTime = targetTime;
			seek = function (targetTime) {
				videoElement.currentTime = targetTime
			};
			return false
		} else {
			if (target == "swf") {
				swf.seekSWF(targetTime);
				seek = function (targetTime) {
					swf.seekSWF(targetTime)
				};
				return false
			}
		}
	}

	function getDuration() {
		return duration
	}

	function getCurrentTime() {
		if (target == "video") {
			currentTime = videoElement.currentTime * playbackRate;
			getCurrentTime = function () {
				currentTime = videoElement.currentTime * playbackRate;
				return currentTime
			};
			return currentTime
		} else {
			if (target == "swf") {
				currentTime = swf.getCurrentTimeSWF() * playbackRate;
				getCurrentTime = function () {
					currentTime = swf.getCurrentTimeSWF() * playbackRate;
					return currentTime
				};
				return currentTime
			}
		}
	}

	function getBuffered() {
		if (target == "video") {
			return videoElement.buffered.end(0)
		}
	}

	function toggleFullScreen(element) {
		var fullscreenElement;
		if (document.fullscreenElement !== undefined) {
			fullscreenElement = document.fullscreenElement
		} else {
			if (document.webkitFullscreenElement !== undefined) {
				fullscreenElement = document.webkitFullscreenElement
			} else {
				if (document.mozFullScreenElement !== undefined) {
					fullscreenElement = document.mozFullScreenElement
				}
			}
		}
		if (fullscreenElement === null || fullscreenElement === undefined) {
			requestFullScreen(element)
		} else {
			cancelFullScreen()
		}
	}

	function requestFullScreen(element) {
		if (arguments.length == 0) {
			element = fullScreenTarget
		}
		if (element === null) {
			throw new Error("VideoController.requestFullScreen():\u30d5\u30eb\u30b9\u30af\u30ea\u30fc\u30f3\u306b\u3059\u308b\u5bfe\u8c61\u304c\u8a2d\u5b9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093");
			return false
		}
		if (element.requestFullscreen) {
			element.requestFullscreen()
		} else {
			if (element.webkitRequestFullScreen) {
				element.webkitRequestFullScreen()
			} else {
				if (element.webkitEnterFullScreen) {
					element.webkitEnterFullScreen()
				} else {
					if (element.mozRequestFullScreen) {
						element.mozRequestFullScreen()
					}
				}
			}
		}
		var fullscreenElement;
		if (document.fullscreenElement !== undefined) {
			fullscreenElement = document.fullscreenElement
		} else {
			if (document.webkitFullscreenElement !== undefined) {
				fullscreenElement = document.webkitFullscreenElement
			} else {
				if (document.mozFullScreenElement !== undefined) {
					fullscreenElement = document.mozFullScreenElement
				}
			}
		}
		if (target == "video") {
			document.addEventListener("fullscreenchange", fullscreenchangeListener, false);
			document.addEventListener("webkitfullscreenchange", fullscreenchangeListener, false);
			document.addEventListener("mozfullscreenchange", fullscreenchangeListener, false);
			if (!isiOS) {
				videoElement.controls = fullScreenControls
			}
		}

		function fullscreenchangeListener() {
			if (fullscreenElement !== null) {
				videoElement.controls = false;
				document.removeEventListener("fullscreenchange", fullscreenchangeListener);
				document.removeEventListener("webkitfullscreenchange", fullscreenchangeListener);
				document.removeEventListener("mozfullscreenchange", fullscreenchangeListener)
			} else {
				videoElement.controls = fullScreenControls
			}
		}
	}

	function cancelFullScreen() {
		if (document.cancelFullScreen) {
			document.cancelFullScreen()
		} else {
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen()
			} else {
				if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen()
				}
			}
		}
		if (target == "video") {
			if (!isiOS) {
				videoElement.controls = false
			}
			document.removeEventListener("fullscreenchange", fullscreenchangeListener);
			document.removeEventListener("webkitfullscreenchange", fullscreenchangeListener);
			document.removeEventListener("mozfullscreenchange", fullscreenchangeListener)
		}
	}

	function setVolume(volume) {
		videoElement.volume = volume
	}

	function getVolume() {
		return videoElement.volume
	}

	function changePlaybackRate(targetRate) {
		var targetTime = currentTime / targetRate;
		playbackRate = targetRate;
		if (target == "video") {
			if (html5Video[fileType][targetRate]) {
				src = html5Video[fileType][targetRate];
				videoElement.src = src;
				videoElement.load();
				addEvent(videoElement, "canplay", canplayEvent);

				function canplayEvent() {
					setTimeout(function () {
						seek(targetTime);
						videoElement.removeEventListener("canplay", canplayEvent, false);
						videoElement.addEventListener("seeked", seekedListener, false)
					}, 1E3)
				}

				function seekedListener() {
					videoElement.play();
					videoElement.removeEventListener("seeked", seekedListener, false)
				}
			}
		} else {
			if (target == "swf") {
				if (flashVideo[fileType][targetRate]) {
					src = flashVideo[fileType][targetRate];
					if (swf.changeVideoAndSeekSWF) {
						swf.changeVideoAndSeekSWF(src, targetTime)
					}
				}
			}
		}
	}

	function addEvent(eventTarget, eventType, eventHandler) {
		if (arguments.length < 3) {
			throw new Error("VideoController.addEvent():\u5f15\u6570\u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059");
			return false
		}
		if (eventTarget === undefined) {
			throw new Error("VideoController.addEvent():\u30a4\u30d9\u30f3\u30c8\u30bf\u30fc\u30b2\u30c3\u30c8\u304cundefined\u3067\u3059");
			return false
		}
		if (eventTarget === null) {
			throw new Error("VideoController.addEvent():\u30a4\u30d9\u30f3\u30c8\u30bf\u30fc\u30b2\u30c3\u30c8\u304cnull\u3067\u3059");
			return false
		}
		if (typeof eventTarget === "string") {
			throw new Error("VideoController.addEvent():\u30a4\u30d9\u30f3\u30c8\u30bf\u30fc\u30b2\u30c3\u30c8\u304cstring\u3067\u3059");
			return false
		}
		if (eventTarget.addEventListener) {
			eventTarget.addEventListener(eventType, eventHandler, false)
		} else {
			if (eventTarget.attachEvent) {
				var onEvent = "on" + eventType;
				eventTarget.attachEvent(onEvent, eventHandler)
			}
		}
	}

	function debug() {
		var events = ["canplay", "canplaythrough", "loadstart", "loadedmetadata", "loadeddata", "waiting", "timeupdate", "play", "playing", "pause", "ended", "durationchange", "ratechange", "volumechange", "progress", "suspend", "abort", "error", "stalled", "seeking", "seeked"];
		for (var i = 0, len = events.length; i < len; i++) {
			addEvent(videoElement, events[i], function (e) {
				console.log(e.type + ": readyState:" + this.readyState + ": networkState:" + this.networkState);
				if (this.error !== null) {
					console.log(this.error.code)
				}
			})
		}
	}
	this.onStart = function (callback) {
		startFunction = callback
	};
	this.onTimeUpdate = function (callback) {
		timeUpdateFunction = callback
	};
	this.onComplete = function (callback) {
		completeFunction = callback
	};
	this.playListener = function () {
		playListener()
	};
	this.pauseListener = function () {
		pauseListener()
	};
	this.timeupdateListener = function (time) {
		timeupdateListener(time)
	};
	this.play = function () {
		clickPlay()
	};
	this.pause = function () {
		clickPause()
	};
	this.seek = function (time) {
		seek(time)
	};
	this.getCurrentTime = function () {
		return getCurrentTime()
	};
	this.getDuration = function () {
		return getDuration()
	};
	this.getBuffered = function () {
		return getBuffered()
	};
	this.setVolume = function (volume) {
		setVolume(volume)
	};
	this.getVolume = function () {
		return getVolume()
	};
	this.setLoop = function (bool) {
		loop = bool;
		if (target == "video") {
			videoElement.loop = loop
		}
	};
	this.getLoop = function () {
		return loop
	};
	this.toggleLoop = function () {
		loop = !loop;
		if (target == "video") {
			videoElement.loop = loop;
			return loop
		}
	};
	this.toggleFullScreen = function (element) {
		toggleFullScreen(element)
	};
	this.changePlaybackRate = function (targetRate) {
		changePlaybackRate(targetRate)
	};
	this.swfInitialize = function (_duration) {
		duration = _duration * playbackRate;
		swfInitialized = true
	};
	this.debug = function () {
		debug()
	}
};
$PS.VideoController.prototype = {
	hasTouchEvent: function () {
		if (window.ontouchstart === undefined) {
			return false
		} else {
			return true
		}
	},
	checkCanPlayType: function (videoElement, mimeType) {
		if (!videoElement.canPlayType) {
			return false
		}
		var canPlay = videoElement.canPlayType(mimeType);
		if (canPlay == "probably" || canPlay == "maybe") {
			return true
		} else {
			return false
		}
	},
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
				throw new Error("VideoController.checkFileType():\u3053\u306e\u62e1\u5f35\u5b50\u306fHTML5Video\u306b\u5bfe\u5fdc\u3057\u3066\u3044\u307e\u305b\u3093");
		}
		return mimeType
	},
	secToMMSS: function (sec) {
		if (sec === Infinity || sec == NaN) {
			sec = 0
		}
		var seconds = Math.floor(sec % 60);
		var minutes = Math.floor(sec / 60);
		if (seconds < 10) {
			seconds = "0" + seconds
		}
		if (minutes < 10) {
			minutes = "0" + minutes
		}
		return minutes + ":" + seconds
	},
	isiOS: function (ua) {
		var _ua = ua || navigator.userAgent;
		var device = ["iPhone", "iPad"];
		var pattern = new RegExp(device.join("|"), "i");
		return pattern.test(_ua)
	},
	getBrowser: function (ua) {
		var _ua = ua || navigator.userAgent;
		var browser = ["Opera", "MSIE", "Firefox", "Chrome", "Safari"];
		var name = "";
		var version = 0;
		var _array = [];
		for (i in browser) {
			var pattern = new RegExp(browser[i], "i");
			if (pattern.test(_ua)) {
				name = browser[i];
				break
			}
		}
		switch (name) {
			case "Opera":
				version = RegExp.rightContext.match(/[0-9]{1,2}.[0-9]{1,2}$/);
				break;
			case "MSIE":
				version = RegExp.rightContext.match(/[0-9]{1,2}.[0-9]{1,2}/);
				break;
			case "Firefox":
				version = RegExp.rightContext.match(/[0-9]{1,2}.[0-9]{1,2}/);
				break;
			case "Chrome":
				version = RegExp.rightContext.match(/[0-9]{1,2}.[0-9]{1,2}/);
				break;
			case "Safari":
				var temp = String(RegExp.leftContext.match(/Version\/[0-9.]{1,3}/));
				version = temp.substr(8, 3);
				break;
			default:
				name = "etc";
				version = 0
		}
		_array[0] = name;
		_array[1] = Number(version);
		return _array
	}
};