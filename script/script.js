
(() => {
    /**
     * キーの押下状態を調べるためのオブジェクト
     * このオブジェクトはプロジェクトのどこからでも参照できるように
     * windowオブジェクトのカスタムプロパティとして設定する
     * @global
     * @type {object}
     */
    window.isKeyDown = {};
     
    /**
     * canvas の幅
     * @type {number}
     */
    const CANVAS_WIDTH = 640;
    /**
     * canvas の高さ
     * @type {number}
     */
    const CANVAS_HEIGHT = 480;
    /**
     * ショットの最大個数
     * @type {number}
     */
    const SHOT_MAX_COUNT = 10;
    /**
     * 敵キャラのインスタンス数
     * @type {number}
     */
    const ENEMY_MAX_COUNT = 10;

    /**
     * Canvas2D API をラップしたユーティリティクラス
     * @type {Canvas2DUtility}
     */
    let util = null;
    /**
     * 描画対象となる Canvas Element
     * @type {HTMLCanvasElement}
     */
    let canvas = null;
    /**
     * Canvas2D API のコンテキスト
     * @type {CanvasRenderingContext2D}
     */
    let ctx = null;

    /**
     * 実行開始時のタイプスタンプ
     * @type {number}
     */
    let startTime = null;
    /**
     * 自機キャラクターのインスタンス
     * @type {Viper}
     */
    let viper = null;
    /**
     * ショットのインスタンスを格納する配列
     * @type {Array<shot>}
     */
    let shotArray = [];
    /**
     * シングルショットのインスタンスを格納する配列
     * @type {Array<shot>}
     */
    let singleShotArray = [];
    /**
     * 敵キャラのインスタンスを格納する配列
     * @type {Array<Enemy>}
     */
    let enemyArray = [];

    /**
     * ページのロードが完了したときに発火する load イベント
     */
    window.addEventListener('load', () => {
        // ユーティリティクラスを初期化
        util = new Canvas2DUtility(document.body.querySelector('#main_canvas'));
        // ユーティリティクラスから canvas を取得
        canvas = util.canvas;
        // ユーティリティクラスから 2d コンテキストを取得
        ctx = util.context;

            initialize();
            loadcheck();
    }, false);

    /**
     * canvas やコンテキストを初期化する
     */
    function initialize(){
        let i;
        // canvas の大きさを設定
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // 自機キャラクターを初期化する
        viper = new Viper(ctx, 0, 0, 65, 65, './image/viper.png');
        viper.setComing(
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT + 50,
            CANVAS_WIDTH / 2,
            CANVAS_HEIGHT - 100
        );

        // ショットを初期化する
        for(i = 0; i < SHOT_MAX_COUNT; ++i){
            shotArray[i] = new Shot(ctx, 0, 0, 32, 32, './image/viper_shot.png');
            singleShotArray[i * 2] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
            singleShotArray[i * 2 + 1] = new Shot(ctx, 0, 0, 32, 32, './image/viper_single_shot.png');
        }

        // 敵キャラを初期化
        for(i = 0; i < ENEMY_MAX_COUNT; ++i){
            enemyArray[i] = new Enemy(ctx, 0, 0, 48, 48, './image/enemy_small.pmg');
        }
        viper.setShotArray(shotArray, singleShotArray); // ショットを自機キャラクターに設定する
    }

    function loadcheck(){
        // 準備完了を意味する真偽値
        let ready = true;
        // AND演算で準備完了しているかチェックする
        ready = ready && viper.ready;
        // 同様にショットの準備状況も確認する
        shotArray.map((v) => {
            ready = ready && v.ready;
        });
        // 同様にシングルショットの準備状況も確認する
        singleShotArray.map((v) => {
            ready = ready && v.ready;
        });

        // 同様に的キャラクターの準備状況も確認する
        enemyArray.map((v) => {
            ready = ready && v.ready;
        })

        // すべての準備が完了したら次の処理に進む
        if(ready === true){
            // イベントを設定する
            eventSetting();
            // 実行開始時のタイムスタンプを所得する
            startTime = Date.now();
            // 描画処理を開始する
            render();
        }else{
            // 準備が完了していない場合は0.1秒ごとに再帰呼び出しする
            setTimeout(loadcheck, 100);
        }
    }

    /**
     * イベントを設定する
    */
    function eventSetting(){
        //キーの押下時に呼び出されるイベントリスナーを設定する
        window.addEventListener('keydown', (event) => {
            // キーの押下状態を管理するオブジェクトに押下されたことを設定する
            isKeyDown[`key_${event.key}`] = true; 
        }, false);
        // キーが離されたときにに呼び出されるイベントリスナーを設定する
        window.addEventListener('keyup', (event) => {
            isKeyDown[`key_${event.key}`] = false;
        }, false);
    }

    /**
     * 描画処理を行う
     */

    function render(){
        // グローバルなアルファを必ず1.0で描画処理を開始する
        ctx.globalAlpha = 1.0;
        // 描画前に画面全体を不透明な明るいグレーで塗りつぶす
        util.drawRect(0, 0, canvas.width, canvas.height, '#eeeeee');
        // 現在までの経過時間を所得する（ミリを病に変換するために１０００で除算）
        let nowTime = (Date.now() - startTime) / 1000;

        // 自機キャラクターの状態を更新する
        viper.update();

        // ショットの状態を更新する
        shotArray.map((v) => {
            v.update();
        });
        singleShotArray.map((v) => {
            v.update();
        });
        
        // 敵キャラクターの状態を更新する
        enemyArray.map((v) => {
            v.update();
        });

        
        // 恒常ループのために描画処理を再帰呼出しする
        requestAnimationFrame(render);
    }

    /**
     * 特定の範囲におけるランダムな整数の値を生成する
     * @param {number} range - 乱数を生成する範囲（0 以上 ～ range 未満）
     */
    function generateRandomInt(range){
        let random = Math.random();
        return Math.floor(random * range);
    }
})();
