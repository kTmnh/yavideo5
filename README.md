# [yavideo5](https://github.com/kTmnh/yavideo5/)
#### Yet Another HTML5 Video Player

What is good?
-------------

* Easy to make your own designed HTML5 player. Functions are ready for your HTML.
* Support Flash fallback for non-HTML5 browsers. You can control your video player with same methods whether HTML5 Video or Flash.
* Accurate buffered bar support.

Usage
-----

1. Write your own HTML/CSS for video player, and load the script on the HTML. (See sample/index.html)
2. Make config object and set elements & video sources as you have.
3. new the yavideo5 instance with config object.
4. Done!

#### Typical sample:
``` html
<html>
<body>
<video id="video_player">
	<object data="player.swf" id="external_player" type="application/x-shockwave-flash">
		<param name="movie" value="player.swf">
		<param name="allowfullscreen" value="true">
		<param name="allowscriptaccess" value="always">
		<param name="wmode" value="transparent">
	</object>
</video>
<div id="controller_set">
	<div class="button" id="rewind_button"></div>
	<div class="button" id="play_button"></div>
	<div class="button" id="pause_button"></div>
	<div class="button" id="forward_button"></div>
	<div id="time">00:00 / 00:00</div>
	<div id="seekbar">
		<div id="seek_background"></div>
		<div class="buffered_bar" id="buffered_bar"></div>
		<div id="progress_bar"></div>
		<div id="seek_handle"></div>
		<div id="time_tips">00:00</div>
	</div>
</div>
<script src="yavideo5.js"></script>
<script>
var config = {
	//Video & Object (Flash) elements
	videoElement: document.getElementById("video_player"),
	objectElement: document.getElementById("external_player"),
	//Elements for controller (Not all elements are necessary if you don't need.)
	playButton: document.getElementById("play_button"),
	pauseButton: document.getElementById("pause_button"),
	forwardButton: document.getElementById("forward_button"),
	rewindButton: document.getElementById("rewind_button"),
	seekbar: document.getElementById("seekbar"),
	seekHandle: document.getElementById("seek_handle"),
	progressBar: document.getElementById("progress_bar"),
	bufferedBar: document.getElementById("buffered_bar"),
	timeDisplay: document.getElementById("time"),
	//Video sources with types for HTML5 video you have (One of them will be played if available && playable).
	html5Video:{
		mp4: "video.mp4",
		webm: "video.webm",
		ogv: "video.ogg"
	},
	//Video source for Flash fallback
	flashVideo:"video.mp4",
	//Instance name (Reference from global scope) of video player (to be used for flash fallback)
	insName: "videoPlayer"
}
var videoPlayer = new yavideo5(config);
</script>
</body>
</html>
```
Method Reference
----------------

|Methods|Return|Description|
|:---------------------------|:------------|:-----------|
|.getCurrentTime()|Current video time (in sec.)|Return current time in seconds.|
|.getDuration()|Video's duration (in sec.)|Return video duration.|
|.onStart( *__function__* )|-|Execute *__function__* on start.|
|.onTimeUpdate( *__function__* )|-|Execute *__function__* while playing.|
|.onComplete( *__function__* )|-|Execute *__function__* when video ends.|
|.when( *__time__*, *__function__* , *__remove__* )|-|Execute *__function__* at the *__time__* on video playing. if *__remove__* is true, the function will be removed after fired (option).|
|.setVolume( *__volume__* )|-|Set video *__volume__* (value mast be from 0 to 1).|
|.getVolume()|Volume (0 to 1)|Return volume of the video.|

Acknowledgements
----------------
Copyright © 2013 Katsumasa Tamanaha (kTmnh). Released under the MIT License.
