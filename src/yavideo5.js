var YAVideo5 = YAVideo5 || = (function () {
	function YAVideo5() {
		alert("test");
	}
	var p = this.prototype = {
		
	}
	return YAVideo5;
})();




/*
 * (HTML5/SWF) Video Controller
 * kTamanaha @ Pro*Seeds 2012.10
 * HTML5のビデオプレーヤーをコントロールするクラス
 * 依存ファイル：jQuery(1.7.x UP), jQuery Transit
 * @author Katsumasa Tamanaha @ Pro*Seeds
 */
var $PS = $PS || {};
$PS.VideoController = $PS.VideoController || function (conf) {
	//エラー制御
	if (typeof conf === "undefined") {
		throw new Error("VideoController():引数がありません");
		return false;
	} else if (typeof conf !== "object") {
		throw new Error("VideoController():引数の型がオブジェクトではありません");
		return false;
	}
	//prototypeのショートカット
	var _proto = $PS.VideoController.prototype;
	//iOSかどうか
	var isiOS = _proto.isiOS();
	//タッチイベントが有効か
	var hasTouchEvent = _proto.hasTouchEvent();
	//CSS Transitionが使えるか
	var useTransition = $.support.transition;
	//Video要素とSWFのどちらで再生するか（Video:"video"; SWF:"swf"）
	var target = "swf";
	//読み込み時に自動再生するか
	var autoplay = conf.autoplay || false;
	//ループ再生するか
	var loop = conf.loop || false;
	//音量をミュートするか
	var muted = conf.muted || false;
	//再生前・再生できない場合に表示する画像
	var poster = conf.poster || "";
	//ビデオの総時間（秒）
	//変速機能がONで、別の再生速度の動画が入っている場合も、そのファイルの総時間ではなく、元再生速度の総時間が入る
	var duration = 0;
	//ビデオの現在時間（秒）
	//変速機能がONで、別の再生速度の動画が入っている場合も、そのファイルの現在時間ではなく、元再生速度の現在時間が入る
	var currentTime = 0;
	//再生中かどうか
	var isPlaying = false;
	//シーク中かどうか
	var isSeeking = false;
	//フルスクリーンかどうか
	var isFullScreen = false;
	//初期化済みかどうか（Flashのみ）
	var swfInitialized = false;
	//HTML5のVideoElementで対応している拡張子の一覧
	//Booleanの値は、表示しているUAで再生できるか（setup内で更新）
	var html5VideoFileTypeList = {
		"m3u8": false,
		"mp4": false,
		"webm": false,
		"ogv": false
	}
	/* HTML5用のビデオファイルのパスが拡張子ごとに入るオブジェクト
	 * 複数の再生速度用のファイルがある場合は、カンマで連ねて書く
	 * 例： 拡張子:{再生速度（通常は1,倍速なら2）:ファイルのパス, 左同形式, ...}
	 * {
	 * 		m3u8:{1:example.f4v.m3u8, 2:example_x2.f4v.m3u8},
	 * 		mp4:{1:example.mp4, 2:example_x2.mp4},
	 * 		webm:{1:example.webm, 2:example_x2.webm},
	 * 		ogv:{1:example.ogv, 2:example_x2.ogv}
	 * }
	 * デバイスが複数の形式に対応している場合は上から優先的に使用する
	 */
	var html5Video = conf.html5Video || null;
	/* Flash（SWF）用の動画ファイルが入るオブジェクト
	 * 上記html5Videと違い、複数の形式を用意しない（Flashでは複数形式を用意する必要がないため）
	 * 複数の再生速度用のファイルがある場合は、カンマで連ねて書く
	 * 例： {再生速度（通常は1,倍速なら2）:ファイルのパス, 左同形式, ...}
	 * {1:example.f4v.f4m, 2:example_x2.f4v.f4m}
	 */
	var flashVideo = conf.flashVideo || null;
	//現在再生しているビデオのパス
	var src = "";
	//現在再生しているビデオの再生速度
	var playbackRate = 1;
	//現在再生しているビデオのファイル形式（HTML5 Videoのみ）
	var fileType = "";
	//Video要素
	var videoElement = conf.videoElement || null;
	//Object要素
	var swf = conf.objectElement || null;
	//再生ボタン
	var playButton = conf.playButton || null;
	//一時停止ボタン
	var pauseButton = conf.pauseButton || null;
	//動画部分全体の再生ボタン
	var framePlayButton = conf.framePlayButton || null;
	//動画全体の一時停止ボタン
	var framePauseButton = conf.framePauseButton || null;
	//追加の再生ボタン
	var altPlayButton = conf.altPlayButton || null;
	//追加の一時停止ボタン
	var altPauseButton = conf.altPauseButton || null;
	//シークバー
	var seekbar = conf.seekbar || null;
	//シークバーのツマミ
	var seekbarHandle = conf.seekbarHandle || null;
	//早送りボタン
	var forwardButton = conf.forwardButton || null;
	//巻き戻しボタン
	var rewindButton = conf.rewindButton || null;
	//追加の早送りボタン
	var altForwardButton = conf.altForwardButton || null;
	//追加の巻き戻しボタン
	var altRewindButton = conf.altRewindButton || null;
	//時間表示
	var timeBackground = conf.timeBackground || null;
	//フルスクリーンボタン
	var fullScreenButton = conf.fullScreenButton || null;
	//フルスクリーンにする対象
	var fullScreenTarget = conf.fullScreenTarget || null;
	//フルスクリーン表示の時にブラウザのコントローラーを表示させるか（HTML5 Videoで使用。フルスクリーンにする対象にコントローラーを含めない場合に使う）
	var fullScreenControls = conf.fullScreenControls || false;
	//シークバーの幅
	var seekbarWidth = 0;
	//ツマミの幅
	var handleWidth = 0;
	//シークバー内のシーク出来る範囲
	var seekWidth = 0;
	//シーク出来る範囲を決めるためのギャップ（ツマミ幅の半分）
	var seekGap = 0;
	//シークバーとシーク出来る範囲に対する比率
	var seekScale = seekWidth / seekbarWidth;
	//ビデオを初めて再生した時に実行するFunction
	function startFunction() {};
	//ビデオの時間が更新される度に実行するFunction
	function timeUpdateFunction() {};
	//ビデオを最後まで見た時に実行するFunction
	function completeFunction() {};
	/* 初期化
	 * @param {Object} conf 設定オブジェクト
	 */
	setup(conf);

	function setup(conf) {
		//HTML5のVideoが設定されていない場合は自動的にFlashを使うようにする
		if (html5Video === null) {
			src = flashVideo[1];
		} else if (html5Video !== null) {
			//UAで再生できるHTML5Videoの動画形式をチェックして、リストを更新する
			for (var key in html5VideoFileTypeList) {
				//拡張子からMIME Typeを取得
				var mimeType = _proto.extensionToMimeType(key);
				//MIME Typeを元にcanPlayをチェック
				html5VideoFileTypeList[key] = _proto.checkCanPlayType(videoElement, mimeType);
			}
			for (var key in html5VideoFileTypeList) {
				//UAで再生でき、且つ、ビデオのパスがある場合
				if (html5VideoFileTypeList[key] && html5Video[key]) {
					//HTML5Videが使えるのでターゲットをvideoに設定しループを抜ける（最初にマッチした形式で再生する）
					target = "video";
					//再生するURLを決定して代入する
					src = html5Video[key][1];
					//再生する動画形式
					fileType = key;
					break;
				}
			}
		}
		//シークバーの初期設定を行う
		setSeekbar(seekbar, seekbarHandle);
		//HTML5 Videoが使える場合はHTML5 Videoの初期化をする
		if (target == "video") {
			initHTML5();
			//使えない場合は、Flashの初期化を行う
		} else if (target == "swf") {
			src = flashVideo[1];
			initFlash();
		} else {
			throw new Error("VideoController.setup:checkCanPlayTypeに失敗しているようです");
			return false;
		}
		setButtons();
	}

	function setButtons() {
		var clickEvent = (hasTouchEvent) ? "touchend" : "click";
		var mousedownEvent = (hasTouchEvent) ? "touchstart" : "mousedown";
		//ボタン関係のイベントを登録
		if (playButton) {
			addEvent(playButton, clickEvent, clickPlay);
		}
		if (altPlayButton) {
			addEvent(altPlayButton, clickEvent, clickPlay);
		}
		if (pauseButton) {
			addEvent(pauseButton, clickEvent, clickPause);
		}
		if (altPauseButton) {
			addEvent(altPauseButton, clickEvent, clickPause);
		}
		if (framePlayButton) {
			addEvent(framePlayButton, clickEvent, clickFrame);
		}
		if (framePauseButton) {
			addEvent(framePauseButton, clickEvent, clickFrame);
		}
		if (forwardButton) {
			addEvent(forwardButton, clickEvent, clickForward);
		}
		if (rewindButton) {
			addEvent(rewindButton, clickEvent, clickRewind);
		}
		if (altForwardButton) {
			addEvent(altForwardButton, clickEvent, clickForward);
		}
		if (altRewindButton) {
			addEvent(altRewindButton, clickEvent, clickRewind);
		}
		if (seekbar) {
			addEvent(seekbar, mousedownEvent, mousedownSeekbar);
		}
		if (fullScreenButton) {
			addEvent(fullScreenButton, clickEvent, function () {
				toggleFullScreen(fullScreenTarget)
			});
		}
	}

	function initHTML5() {
		if (swf.parentNode) {
			swf.parentNode.removeChild(swf);
		}
		videoElement.src = src;
		//iOSの場合は仕様上自動再生しないので常にfalseを入れる
		videoElement.muted = muted;
		videoElement.autoplay = (isiOS) ? false : autoplay;
		videoElement.poster = poster;
		if (videoElement.autoplay && framePlayButton) {
			framePlayButton.style.opacity = 0;
		}
		videoElement.loop = loop;
		videoElement.load();
		//ビデオ関係のイベントを登録
		addEvent(videoElement, "canplay", canplayListener);
		addEvent(videoElement, "durationchange", durationchangeListener);
		addEvent(videoElement, "play", playListener);
		addEvent(videoElement, "pause", pauseListener);
		addEvent(videoElement, "timeupdate", timeupdateListener);
		addEvent(videoElement, "ended", endedListener);
		addEvent(videoElement, "error", errorListener);
	}

	function initFlash() {
		//SWFでExternalInterfaceで登録されているinit FunctionにURLを渡し、SWFの初期化を行う
		var si = setInterval(function () {
			if (swf.initSWF) {
				//SWFでExternalInterfaceで登録されているinit FunctionにURLを渡し、SWFの初期化を行う
				swf.initSWF(src);
				clearInterval(si);
			}
		}, 10);
	}
	/* シークバーとツマミの初期設定
	 * シークバーとツマミの幅を取得し、シーク出来る範囲と、シークバーのギャップを設定する
	 * @param {DOM Element} seekbar シークバー
	 * @param {DOM Element} seekbarHandle シークバーのツマミ
	 */
	function setSeekbar(seekbar, seekbarHandle) {
		seekbarWidth = seekbar.offsetWidth;
		handleWidth = seekbarHandle.offsetWidth;
		seekWidth = seekbarWidth - handleWidth;
		seekGap = handleWidth / 2;
		seekScale = seekWidth / seekbarWidth;
	}
	//再生できるようになった時
	function canplayListener() {
		//ビデオの総時間を取得
		duration = this.duration　 * playbackRate;
		currentTime = this.currentTime * playbackRate;
		//時間表示が無い場合は、以下の処理は不要なのでここで止める
		if (!timeBackground) return false;
		//形式を変換
		var currentMMSS = _proto.secToMMSS(currentTime);
		var durationMMSS = _proto.secToMMSS(duration);
		//時間表示を設定
		timeBackground.innerHTML = currentMMSS + "/" + durationMMSS;
	}
	//総時間が変更された時
	function durationchangeListener() {
		duration = this.duration * playbackRate;
	}
	//ビデオが再生された時
	function playListener() {
		//ビデオの総時間がcanplayイベント時に正しく取得出来ていなかった場合、再度取得する
		if (duration === Infinity || duration === NaN) {
			duration = this.duration　 * playbackRate;
		}
		pauseButton.style.display = "block";
		playButton.style.display = "none";
		if (altPauseButton) {
			altPauseButton.style.display = "block";
		}
		if (altPlayButton) {
			altPlayButton.style.display = "none";
		}
		isPlaying = true;
	}
	//ビデオが一時停止された時
	function pauseListener() {
		pauseButton.style.display = "none";
		playButton.style.display = "block";
		if (altPauseButton) {
			altPauseButton.style.display = "none";
		}
		if (altPlayButton) {
			altPlayButton.style.display = "block";
		}
		isPlaying = false;
	}
	//現在の再生時間が更新された時
	function timeupdateListener(time) {
		//再生を開始した時（1度のみ）実行する
		if (startFunction != null) {
			startFunction();
			//functionをnullにする
			startFunction = null;
		}
		//再生時間更新時に実行するFunctionを実行
		timeUpdateFunction();
		//現在時間を更新
		if (target == "video") {
			getCurrentTime();
		} else if (target == "swf") {
			currentTime = time * playbackRate;
		}
		//シーク中（シークバーをmousedownしている時）以外は、シークバーのツマミの位置を時間に合わせて更新する（cssのleftプロパティに、%値を設定する）
		if (!isSeeking) {
			seekbarHandle.style.left = getSeekbarHandleLeft() + "px";
		}
		//時間表示が無い場合は、以下の処理は不要なのでここで止める
		if (!timeBackground) return false;
		//現在時間をMM:SS形式に変換
		var currentMMSS = _proto.secToMMSS(currentTime);
		//総時間をMM:SS形式に変換
		var durationMMSS = _proto.secToMMSS(duration);
		//現在時間が0秒未満だった場合（読込中や、シーク時などで負の値が入る場合があるため）は、0秒として処理する
		if (this.currentTime < 0) {
			currentMMSS = _proto.secToMMSS(0);
		}
		//時間表示に現在時間と総時間を表示する
		timeBackground.innerHTML = currentMMSS + "/" + durationMMSS;
	}
	//ビデオを最後まで見た時
	function endedListener() {
		//最後まで見た時（1度のみ）実行する
		if (completeFunction != null) {
			completeFunction();
			completeFunction = null;
		}
		//ビデオを一時停止させる
		pauseListener();
	}
	//エラーがあった時の処理
	function errorListener(e) {
		throw new Error("VideoController.errorListener():" + e.target.error.code);
	}

	function clickPlay() {
		framePauseButton.style.opacity = "0";
		framePlayButton.style.opacity = "0";
		play();
	}
	//一時停止ボタンをクリックした時の動作
	function clickPause() {
		framePauseButton.style.opacity = "0";
		framePlayButton.style.opacity = "0";
		pause();
	}
	//画面フレームをクリックした時の動作
	function clickFrame() {
		if (isPlaying) {
			if (useTransition) {
				$(framePauseButton)
					.css({
					'opacity': 1,
					'scale': 1
				})
					.transition({
					'opacity': 0,
					'scale': 1.6
				}, 750);
			} else {
				$(framePauseButton)
					.css('opacity', 1)
					.animate({
					'opacity': 0
				}, 750);
			}
			pause();
		} else {
			if (useTransition) {
				$(framePlayButton)
					.css({
					'opacity': 1,
					'scale': 1
				})
					.transition({
					'opacity': 0,
					'scale': 1.6
				}, 750);
			} else {
				$(framePlayButton)
					.css('opacity', 1)
					.animate({
					'opacity': 0
				}, 750);
			}
			play();
		}
	}
	//＞＞ボタンの動作（30秒早送りする）
	function clickForward() {
		//表示上の30秒後に早送りするため、現在の時間を再生速度で割った値（実際のビデオファイルの時間）を取得する
		var targetTime = (currentTime + 30) / playbackRate;
		if (targetTime > duration) {
			targetTime = duration - 1;
		}
		//対象の時間に移動する
		seek(targetTime);
	}
	//＜＜ボタン（30秒巻き戻しする）
	function clickRewind() {
		var targetTime = (currentTime - 30) / playbackRate;
		if (targetTime <= 0) {
			targetTime = 0;
		}
		seek(targetTime);
	}
	/*
	 * シークバーの位置を取得する
	 * @return {String} シークバーのcssのleft位置（px）
	 */
	function getSeekbarHandleLeft() {
		return (currentTime / duration) * seekScale * seekbarWidth;
	}
	/*
	 * シークバーをクリックした時に、ツマミの位置を調整する（左右からはみ出ないようにするため）
	 * @return {Number} シークバーのツマミのleft位置（px）
	 */
	function getSeekbarHandlePosition(seekbarX) {
		//座標の調整（mousedownした位置に、ツマミの中央が来るようにするため）
		//マウスの座標が、ギャップより小さい場合（左端～ツマミの幅の半分まで）
		if (seekbarX <= seekGap) {
			seekbarX = 0;
			//マウスの座標が、シークバーの右端からツマミの幅分まで左にある場合
		} else if (seekbarX >= (seekbarWidth - seekGap)) {
			seekbarX = seekbarWidth - handleWidth;
		} else {
			seekbarX -= seekGap;
		}
		return seekbarX;
	}
	/*
	 * シークバーをmousedownした時
	 */
	function mousedownSeekbar(e) {
		//再生中でない場合は再生する
		if (!isPlaying) {
			clickPlay();
		}
		//シーク状態をシーク中に設定する
		isSeeking = true;
		//シークバーの座標情報を取得
		var bounds = seekbar.getBoundingClientRect();
		//タッチイベントとマウスイベントで動作を振り分け
		if (hasTouchEvent) {
			var tempSeekbarX = e.touches[0].pageX - bounds.left;
		} else {
			var tempSeekbarX = e.pageX - bounds.left;
		}
		var seekbarX = getSeekbarHandlePosition(tempSeekbarX);
		seekbarHandle.style.left = seekbarX + "px";
		if (hasTouchEvent) {
			window.ontouchmove = function (e) {
				mousemoveWindow(e);
			}
			window.ontouchend = function (e) {
				mouseleaveWindow(e);
			}
		} else {
			window.onmousemove = function (e) {
				mousemoveWindow(e);
			}
			window.onmouseleave = function (e) {
				mouseleaveWindow(e);
			}
			window.onmouseup = function (e) {
				mouseleaveWindow(e);
			}
		}
	}
	/*
	 * windowのmousemove/mouseleaveイベントに登録するFunction
	 * シークバーのツマミの位置をmousemoveしている位置に更新する
	 */
	function mousemoveWindow(e) {
		var bounds = seekbar.getBoundingClientRect();
		if (hasTouchEvent) {
			var seekbarX = e.touches[0].pageX - bounds.left;
		} else {
			var seekbarX = e.pageX - bounds.left;
		}
		var returnSeekbarX = getSeekbarHandlePosition(seekbarX);
		seekbarHandle.style.left = returnSeekbarX + "px";
	}
	/*
	 * windowのmouseleaveイベントに登録するFunction
	 * シークバーの位置を更新する
	 */
	function mouseleaveWindow(e) {
		var bounds = seekbar.getBoundingClientRect();
		if (hasTouchEvent) {
			var seekbarX = e.changedTouches[0].pageX - bounds.left;
		} else {
			var seekbarX = e.pageX - bounds.left;
		}
		var returnSeekbarX = getSeekbarHandlePosition(seekbarX);
		isSeeking = false;
		mouseupSeekbar(returnSeekbarX);
		if (hasTouchEvent) {
			window.ontouchmove = undefined;
			window.ontouchend = undefined;
		} else {
			window.onmousemove = undefined;
			window.onmouseleave = undefined;
			window.onmouseup = undefined;
		}
	}
	/* シークバーのmouseupイベントに登録するFunction
	 */
	function mouseupSeekbar(seekbarX) {
		var percent = seekbarX / seekWidth;
		var targetTime = (duration * percent) / playbackRate;
		seek(targetTime);
	}
	/* ビデオを再生する
	 * HTML5VideoとSWFで完全に処理を分けられるので、自己定義関数を使用して2回目以降はいずれかの処理しかしないようにする
	 */
	function play() {
		if (target == "video") {
			videoElement.play();
			play = function () {
				videoElement.play();
			}
			return false;
		} else if (target == "swf") {
			swf.playSWF();
			play = function () {
				swf.playSWF();
			}
			return false;
		}
	}
	/* ビデオを一時停止する
	 * 上記同様、自己定義関数を使用
	 */
	function pause() {
		if (target == "video") {
			videoElement.pause();
			pause = function () {
				videoElement.pause();
			}
			return false;
		} else if (target == "swf") {
			swf.pauseSWF();
			pause = function () {
				swf.pauseSWF();
			}
			return false;
		}
	}
	/* ビデオをシークする
	 * @param {Number} targetTime シーク先の時間
	 */
	function seek(targetTime) {
		if (target == "video") {
			videoElement.currentTime = targetTime;
			seek = function (targetTime) {
				videoElement.currentTime = targetTime;
			}
			return false;
		} else if (target == "swf") {
			swf.seekSWF(targetTime);
			seek = function (targetTime) {
				swf.seekSWF(targetTime);
			}
			return false;
		}
	}
	/* ビデオの長さを取得する
	 * @return {Number} ビデオの長さ（秒）
	 */
	function getDuration() {
		return duration;
	}
	/* ビデオの現在の時間を取得する
	 * @return {Number} 現在の時間（秒）
	 */
	function getCurrentTime() {
		if (target == "video") {
			currentTime = videoElement.currentTime * playbackRate;
			getCurrentTime = function () {
				currentTime = videoElement.currentTime * playbackRate;
				return currentTime;
			}
			return currentTime;
		} else if (target == "swf") {
			currentTime = swf.getCurrentTimeSWF() * playbackRate;
			getCurrentTime = function () {
				currentTime = swf.getCurrentTimeSWF() * playbackRate;
				return currentTime;
			}
			return currentTime;
		}
	}

	function getBuffered() {
		if (target == "video") {
			return videoElement.buffered.end(0);
		}
	}
	/* フルスクリーンを切り替える
	 * @param {Element} target フルスクリーンに設定する対象 
	 */
	function toggleFullScreen(element) {
		//フルスクリーン表示時にはfullscreenElementに値がセットされているので、これをチェックしてフルスクリーン状態かどうかを調べる
		var fullscreenElement;
		if (document.fullscreenElement !== undefined) {
			fullscreenElement = document.fullscreenElement;
		} else if (document.webkitFullscreenElement !== undefined) {
			fullscreenElement = document.webkitFullscreenElement;
		} else if (document.mozFullScreenElement !== undefined) {
			fullscreenElement = document.mozFullScreenElement;
		}
		//fullscreenElementがnullの場合（＝フルスクリーン表示でない場合、もしくはfullscreenElementがサポートされていない場合（iOSなど））
		if (fullscreenElement === null || fullscreenElement === undefined) {
			requestFullScreen(element);
		} else {
			cancelFullScreen();
		}
	}
	/* フルスクリーンに設定する
	 * @param {Element} target フルスクリーンにする対象のHTML要素
	 */
	function requestFullScreen(element) {
		if (arguments.length == 0) {
			element = fullScreenTarget;
		}
		if (element === null) {
			throw new Error("VideoController.requestFullScreen():フルスクリーンにする対象が設定されていません");
			return false;
		}
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.webkitRequestFullScreen) {
			element.webkitRequestFullScreen();
		} else if (element.webkitEnterFullScreen) {
			element.webkitEnterFullScreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		}
		var fullscreenElement;
		if (document.fullscreenElement !== undefined) {
			fullscreenElement = document.fullscreenElement;
		} else if (document.webkitFullscreenElement !== undefined) {
			fullscreenElement = document.webkitFullscreenElement;
		} else if (document.mozFullScreenElement !== undefined) {
			fullscreenElement = document.mozFullScreenElement;
		}
		//フルスクリーンにする対象がVideoの場合
		if (target == "video") {
			//フルスクリーンに切り替えた時のイベントにリスナーを登録
			document.addEventListener("fullscreenchange", fullscreenchangeListener, false);
			document.addEventListener("webkitfullscreenchange", fullscreenchangeListener, false);
			document.addEventListener("mozfullscreenchange", fullscreenchangeListener, false);
			//iOSはフルスクリーンAPIには対応していない＆動画部分はフルスクリーン時には自動的にプレーヤー表示になるのでcontrolsは触らない
			if (!isiOS) {
				//コントローラーを設定
				videoElement.controls = fullScreenControls;
			}
		}

		function fullscreenchangeListener() {
			//フルスクリーンの場合（フルスクリーンを解除しようとしてイベントが発生した場合）
			if (fullscreenElement !== null) {
				//コントローラーを使わないようにする
				videoElement.controls = false;
				document.removeEventListener("fullscreenchange", fullscreenchangeListener);
				document.removeEventListener("webkitfullscreenchange", fullscreenchangeListener);
				document.removeEventListener("mozfullscreenchange", fullscreenchangeListener);
				//フルスクリーンでなかった場合
			} else {
				//コントローラーを設定
				videoElement.controls = fullScreenControls;
			}
		}
	}
	/* フルスクリーンを解除する
	 */
	function cancelFullScreen() {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		}
		if (target == "video") {
			if (!isiOS) {
				videoElement.controls = false;
			}
			document.removeEventListener("fullscreenchange", fullscreenchangeListener);
			document.removeEventListener("webkitfullscreenchange", fullscreenchangeListener);
			document.removeEventListener("mozfullscreenchange", fullscreenchangeListener);
		}
	}
	/* 音量を設定する
	 * @param {Number} volume セットする音量（0～1）
	 */
	function setVolume(volume) {
		videoElement.volume = volume;
	}
	/* 音量を取得する
	 * @return {Number} 音量（0～1）
	 */
	function getVolume() {
		return videoElement.volume;
	}
	/*
	 * ビデオの再生速度を切り替える
	 * @param {Number} targetRate 変更したい再生速度
	 */
	function changePlaybackRate(targetRate) {
		//現在の再生時間と同じ時間から再生するために、切り替えてから再生する時間を再生速度から割り出して取得
		var targetTime = currentTime / targetRate;
		//現在の再生速度を更新
		playbackRate = targetRate;
		if (target == "video") {
			//ターゲットの速度の動画がhtml5Videoオブジェクトに存在するか確認する
			if (html5Video[fileType][targetRate]) {
				//現在のビデオのパスを更新
				src = html5Video[fileType][targetRate];
				//Video要素に動画を読み込み
				videoElement.src = src;
				//ビデオをロード
				videoElement.load();
				//差し替えたビデオが再生可能になったら処理を行う
				addEvent(videoElement, "canplay", canplayEvent);

				function canplayEvent() {
					//canplayイベント発火直後では、再生/シークが上手くいかない（iPad）ため、時間を開けてからシークを実行する
					setTimeout(function () {
						//元の動画と同じ時間から再生するように、シークする
						seek(targetTime);
						//リスナーを削除
						videoElement.removeEventListener("canplay", canplayEvent, false);
						//シークが完了したら処理を行う
						videoElement.addEventListener("seeked", seekedListener, false);
					}, 1000);
				}

				function seekedListener() {
					//シークし終えたらビデオを再生
					videoElement.play();
					//リスナーを削除
					videoElement.removeEventListener("seeked", seekedListener, false);
				}
			}
		} else if (target == "swf") {
			if (flashVideo[fileType][targetRate]) {
				src = flashVideo[fileType][targetRate];
				if (swf.changeVideoAndSeekSWF) {
					swf.changeVideoAndSeekSWF(src, targetTime);
				}
			}
		}
	}
	/* addEventListener, attachEventを書き分けないようにするためのfunction
	 * @param {DOM Element} eventTarget イベントを貼る対象
	 * @param {String} eventType イベント名（onは付けないこと）
	 * @param {Function} eventHandler イベントハンドラー
	 */
	function addEvent(eventTarget, eventType, eventHandler) {
		if (arguments.length < 3) {
			throw new Error("VideoController.addEvent():引数が不足しています");
			return false;
		}
		if (eventTarget === undefined) {
			throw new Error("VideoController.addEvent():イベントターゲットがundefinedです");
			return false;
		}
		if (eventTarget === null) {
			throw new Error("VideoController.addEvent():イベントターゲットがnullです");
			return false;
		}
		if (typeof eventTarget === "string") {
			throw new Error("VideoController.addEvent():イベントターゲットがstringです");
			return false;
		}
		if (eventTarget.addEventListener) {
			eventTarget.addEventListener(eventType, eventHandler, false);
		} else if (eventTarget.attachEvent) {
			var onEvent = "on" + eventType;
			eventTarget.attachEvent(onEvent, eventHandler);
		}
	}

	function debug() {
		var events = [
			"canplay", "canplaythrough", "loadstart", "loadedmetadata", "loadeddata",
			"waiting", "timeupdate", "play", "playing", "pause", "ended",
			"durationchange", "ratechange", "volumechange",
			"progress", "suspend", "abort", "error", "stalled", "seeking", "seeked"];
		for (var i = 0, len = events.length; i < len; i++) {
			addEvent(videoElement, events[i], function (e) {
				console.log(e.type + ": readyState:" + this.readyState + ": networkState:" + this.networkState);
				if (this.error !== null) {
					console.log(this.error.code);
				}
			})
		}
	}
	/**** パブリックメソッド ****/
	/* ビデオを初めて再生した時に実行するFunctionを登録する
	 * @param {Function} callback 実行したいFunction
	 */
	this.onStart = function (callback) {
		startFunction = callback;
	}
	/* ビデオの時間が更新される度に実行するFunctionを登録
	 * @param {Function} callback 実行したいFunction
	 */
	this.onTimeUpdate = function (callback) {
		timeUpdateFunction = callback;
	}
	/* ビデオを最後まで見た時に実行するFunctionを登録
	 * @param {Function} callback 実行したいFunction
	 */
	this.onComplete = function (callback) {
		completeFunction = callback;
	}
	/* SWFからの呼び出し用
	 */
	this.playListener = function () {
		playListener();
	}
	/* SWFからの呼び出し用
	 */
	this.pauseListener = function () {
		pauseListener();
	}
	/* SWFからの呼び出し用
	 */
	this.timeupdateListener = function (time) {
		timeupdateListener(time);
	}
	this.play = function () {
		clickPlay();
	}
	this.pause = function () {
		clickPause();
	}
	this.seek = function (time) {
		seek(time);
	}
	this.getCurrentTime = function () {
		return getCurrentTime();
	}
	this.getDuration = function () {
		return getDuration();
	}
	this.getBuffered = function () {
		return getBuffered();
	}
	this.setVolume = function (volume) {
		setVolume(volume);
	}
	this.getVolume = function () {
		return getVolume();
	}
	/* ループ再生を変更する
	 * @param {Boolean} bool
	 */
	this.setLoop = function (bool) {
		loop = bool;
		if (target == "video") {
			videoElement.loop = loop;
		}
	}
	/* ループを取得する
	 * @return {Boolean} ループの状態
	 */
	this.getLoop = function () {
		return loop;
	}
	/* ループを切り替える（現在の状態と反転させる）
	 * @return {Boolean} 現在のループの状態
	 */
	this.toggleLoop = function () {
		loop = !loop;
		if (target == "video") {
			videoElement.loop = loop;
			return loop;
		}
	}
	this.toggleFullScreen = function (element) {
		toggleFullScreen(element);
	}
	this.changePlaybackRate = function (targetRate) {
		//_proto.hasNativePlaybackRateSupport();
		changePlaybackRate(targetRate);
	}
	this.swfInitialize = function (_duration) {
		duration = _duration * playbackRate;
		swfInitialized = true;
	}
	this.debug = function () {
		debug();
	}
}
$PS.VideoController.prototype = {
	/* TouchEventが使えるか判定する
	 * @return {Boolean} 使える場合はtrue
	 */
	hasTouchEvent: function () {
		if (window.ontouchstart === undefined) {
			return false;
		} else {
			return true;
		}
	},
	/* MIME Typeをもとに、HTML5Videoで再生できるか調べる
	 * @param {String} mimeType MIME Type
	 * @return {Boolean} 再生できる場合はtrue
	 */
	checkCanPlayType: function (videoElement, mimeType) {
		//HTML5 Videoに対応していないブラウザ（IE8以下もしくはWindowsSafariでQuickTimeがインストールされていない場合他）では、
		//canPlayTypeを呼び出した段階でストップするので、続行させないようにする
		if (!videoElement.canPlayType) {
			return false;
		}
		var canPlay = videoElement.canPlayType(mimeType);
		//基本的にmaybeであれば再生できる。
		if (canPlay == "probably" || canPlay == "maybe") {
			return true;
		} else {
			return false;
		}
	},
	/* ファイルのURLの拡張子⇒MIME Typeを変換する
	 * @param {String} extension ファイルの拡張子
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
				throw new Error("VideoController.checkFileType():この拡張子はHTML5Videoに対応していません");
		}
		return mimeType;
	},
	/* 秒（Number）を"MM:SS"に変換する
	 * @param {Number} 秒
	 * @return {String} "MM:SS"
	 */
	secToMMSS: function (sec) {
		if (sec === Infinity || sec == NaN) {
			sec = 0;
		}
		var seconds = Math.floor(sec % 60);
		var minutes = Math.floor(sec / 60);
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		return minutes + ":" + seconds;
	},
	/* iOSデバイスかどうかを判別する
	 * @param {String} navigator.userAgent　OPTION
	 * @return {Boolean} リストに一致したらtrue
	 */
	isiOS: function (ua) {
		var _ua = ua || navigator.userAgent;
		//新しいデバイスが増えた場合は、下記に追加する
		var device = [
			"iPhone",
			"iPad"];
		//正規表現で、上のリストにマッチするか判別する
		var pattern = new RegExp(device.join("|"), "i");
		//testメソッドで、Booleanを返す
		return pattern.test(_ua);
	},
	/* ブラウザの名前とバージョンを取得する
	 * @param {String} navigator.userAgent OPTION
	 * @return {Array} [0] {String} ブラウザ名
	 * @return {Array} [1] {Number} ブラウザのバージョン
	 */
	getBrowser: function (ua) {
		var _ua = ua || navigator.userAgent;
		//ブラウザ名の一覧＝戻り値のブラウザ名
		var browser = [
		//OperaにはUAを偽装するモードがあるので、Opera判定をするには必ず先頭に書く
		//例：Opera/9.80 (Windows NT 6.1; U; ja) Presto/2.10.229 Version/11.61
		"Opera",
		//例：Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0)
		"MSIE",
		//例：Mozilla/5.0 (Windows NT 6.1; WOW64; rv:9.0.1) Gecko/20100101 Firefox/9.0.1
		"Firefox",
		//ChromeのUAには「Safari」の文字列も含まれるので、必ずSafariより上にChromeを書くこと
		//例：Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.75 Safari/535.7
		"Chrome",
		//例：Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7
		"Safari"];
		//ブラウザ名
		var name = "";
		//バージョン
		var version = 0;
		//戻り値のArray
		var _array = [];
		for (i in browser) {
			var pattern = new RegExp(browser[i], "i");
			//一致したブラウザ名を入れる
			if (pattern.test(_ua)) {
				name = browser[i];
				break;
			}
		}
		//ブラウザ名に応じて、バージョン情報を正規表現で取ってくる
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
				//5.1.2⇒5.1として格納
				var temp = String(RegExp.leftContext.match(/Version\/[0-9.]{1,3}/));
				version = temp.substr(8, 3);
				break;
			default:
				name = "etc";
				version = 0;
		}
		_array[0] = name;
		_array[1] = Number(version);
		return _array;
	}
}