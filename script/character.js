
/**
 * 座標を管理するためのクラス
 */
class Position {
    /**
     * @constructor
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     */
    constructor(x, y){
        /**
         * X 座標
         * @type {number}
         */
        this.x = x;
        /**
         * Y 座標
         * @type {number}
         */
        this.y = y;
    }

    /**
     * 値を設定する
     * @param {number} [x] - 設定する X 座標
     * @param {number} [y] - 設定する Y 座標
     */
    set(x, y){
        if(x != null){this.x = x;}
        if(y != null){this.y = y;}
    }
}

/**
 * キャラクター管理のための基幹クラス
 */
class Character {
    /**
     * @constructor
     * @param {CanvasRenderingContext2D} ctx - 描画などに利用する 2D コンテキスト
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {number} w - 幅
     * @param {number} h - 高さ  
     * @param {number} life - キャラクターのライフ（生存フラグを兼ねる）
     * @param {Image} image - キャラクターの画像
     */
    constructor(ctx, x, y,　w, h, life, imagePath){
        /**
         * @type {CanvasRenderingContext2D}
         */
        this.ctx = ctx;
        /**
         * @type {Position}
         */
        this.position = new Position(x, y);
        /**
         * @type {number}
         */
        this.width = w;
        /**
         * @type {number}
         */
        this.height = h;
        /**
         * @type {number}
         */
        this.angle = 270 * Math.PI / 180;
        /**
         * @type {number}
         */
        this.life = life;
        this.vector = new Position(0.0, -1.0);
        /**
         *  @type {boolean}
         */
        this.ready = false;
        /**
         * @type {Image}
         */
        this.image = new Image();
        this.image.addEventListener('load', () => {
            // 画像のロードが完了したら準備完了フラグを立てる
            this.ready = true;
        }, false);
        this.image.src = imagePath;
    }

    setVector(x, y){
        // 自身の vector プロパティに設定する
        this.vector.set(x, y);
    }

    /**
     * 進行方向を角度を元に設定する
     * @param {number} angle - 回転量（ラジアン）
     */
    setVectorFromAngle(angle){
        // 自身の回転量を設定する
        this.angle = angle;
        // ラジアンからサインとコサインを求める
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        // 自身のvectorプロパティに設定する
        this.vector.set(cos, sin);
    }

    /**
     * キャラクターを描画する
     */
    draw(){
        // キャラクターの幅を考慮してオフセットする量
        let offsetX = this.width / 2;
        let offsetY = this.height / 2;

        // キャラクターの幅やオフセットする量を加味して描画する
        this.ctx.drawImage(
            this.image,
            this.position.x - offsetX,
            this.position.y - offsetY,
            this.width,
            this.height
        );
    }

    /**
     * 自身の回転量を元に座標系を回転させる
     */
    rotationDraw(){
        // 座標系を回転する前の状態を保存する
        this.ctx.save();
        // 自身の位置が座標系の中心と重なるように平行移動する
        this.ctx.translate(this.position.x, this.position.y);
        // 座標系を回転させる（270度の位置を基準にするためMath.PI * 1.5を引いている）
        this.ctx.rotate(this.angle - Math.PI * 1.5);

        // キャラクターの幅を考慮してオフセットする量
        let offsetX = this.width / 2;
        let offsetY = this.height / 2;
        // キャラクターの幅やオフセットする量を加味して描画する
        this.ctx.drawImage(
            this.image,
            -offsetX,　// 先にtranslateで平行移動しているのでオフセットのみ行う
            -offsetY,　// 先にtranslateで平行移動しているのでオフセットのみ行う
            this.width,
            this.height
        );
        this.ctx.restore(); // 座標系を回転する前の状態に戻す
    }
}

/**
 * viper クラス
 */
class Viper extends Character {
    /**
     * @constructor
     * @param {CanvasRenderingContext2D} ctx - 描画などに利用する 2D コンテキスト
     * @param {number} x - X 座標
     * @param {number} y - Y 座標
     * @param {number} w - 幅
     * @param {number} h - 高さ
     * @param {Image} image - キャラクターの画像
     */
    constructor(ctx, x, y, w, h, imagePath){
        // Character クラスを継承しているので、まずは継承元となる
        // Character クラスのコンストラクタを呼び出すことで初期化する
        // （super が継承元のコンストラクタの呼び出しに相当する）
        super(ctx, x, y, w, h, 0, imagePath);

        /**	
        * 自身の移動スピード（update 一回あたりの移動量）	
        * @type {number}	
        */	
        this.speed = 3;

        /**
         * viper が登場中かどうかを表すフラグ
         * @type {boolean}
         */
        this.isComing = false;
        /**
         * 登場演出を開始した際のタイムスタンプ
         * @type {number}
         */
        this.comingStart = null;
        /**
        * 登場演出を完了とする座標	* 登場演出を開始する座標
        * @type {Position}
        */
        this.comingStartPosition = null;
        /**
         * 登場演出を完了とする座標
         * @type {Position}
         */
        this.comingEndPosition = null;
        /**
         * 自身が持つショットインスタンスの配列
         * @type {Array<shot>}
         */
        this.shotArray = null;
        /**
         * 自身が持つショットインスタンスの配列
         * @type {Array<shot>}
         */
        this.singleShotArray = null;
        /**
         * ショットを撃った後のチェック用カウンター
         * @type {number}
         */
        this.shotCheckCounter = 0;
        /**
         * ショットを打つことができる間隔（フレーム数＿
         * @type {number}
         */
        this.shotInterval = 10;
    }

    /**
     * 登場演出に関する設定を行う
     * @param {number} startX - 登場開始時の X 座標
     * @param {number} startY - 登場開始時の Y 座標
     * @param {number} endX - 登場終了とする X 座標
     * @param {number} endY - 登場終了とする Y 座標
     */
    setComing(startX, startY, endX, endY){
        // 登場中のフラグを立てる
        this.isComing = true;
        // 登場開始時のタイムスタンプを取得する
        this.comingStart = Date.now();
        // 登場開始位置に自機を移動させる
        this.position.set(startX, startY);
        // 登場開始位置を設定する
        this.comingStartPosition = new Position(startX, startY);
        // 登場終了とする座標を設定する
        this.comingEndPosition = new Position(endX, endY);
    }
    
    /**
     * ショットを設定する
     * @param {Array<shot>} shotArray - 自身に設定するショットの配列
     */
    setShotArray(shotArray, singleShotArray){
        // 自身のプロパティに設定する
        this.shotArray = shotArray;
        this.singleShotArray = singleShotArray;
    }

    update(){
        // 現時点のタイムスタンプを取得する
        let justTime = Date.now();

        
        // 登場シーンかどうかに応じて処理を振り分ける
        if(this.isComing === true){
            // 登場シーンが始まってからの経過時間
            let comingTime = (justTime - this.comingStart) / 1000;
            // 登場中は時間が立つほど上に向かって進む
            let y = this.comingStartPosition.y - comingTime * 50;
            // 一定の位置まで移動したら登場シーンを終了する
            if(y <= this.comingEndPosition.y){
                this.isComing = false;
                y = this.comingEndPosition.y;
            }
            // 求めたY座標を自機に設定する
            this.position.set(this.position.x, y);

            if(justTime % 100 < 50){
                this.ctx.globalAlpha = 0.5;
            }
        }else{
            // キーの押下状態を調べて挙動を変える
            if(window.isKeyDown.key_ArrowLeft === true){
                this.position.x -= this.speed; // アローキーの左
            }
            if(window.isKeyDown.key_ArrowRight === true){
                this.position.x += this.speed; // アローキーの右
            }
            if(window.isKeyDown.key_ArrowUp === true){
                this.position.y -= this.speed; // アローキーの左
            }
            if(window.isKeyDown.key_ArrowDown === true){
                this.position.y += this.speed; // アローキーの右
            }
            
            // 移動後の位置が画面外へ出ていないか確認して修正する
            let canvasWidth = this.ctx.canvas.width;
            let canvasHeight = this.ctx.canvas.height;
            let tx = Math.min(Math.max(this.position.x, 0), canvasWidth);
            let ty = Math.min(Math.max(this.position.y, 0), canvasHeight);
            this.position.set(tx, ty);

            // キーの押下状態を調べてショットを生成する
            if(window.isKeyDown.key_z === true){
                // ショットが打てる状態なのかを確認する
                // ショットチェック用カウンターが０異常ならショットを生成できる
                if(this.shotCheckCounter >= 0){
                    let i;
                    // ショットの生存を確認し非生存のものがあれば生成する
                    for(i = 0; i < this.shotArray.length; ++i){
                    // 非生存かどうかを確認する
                        if(this.shotArray[i].life <= 0){
                        // 自機キャラクターの座標にショットを生成する
                        this.shotArray[i].set(this.position.x, this.position.y);
                        // ショットを生成したのでインターバルを設定する
                        this.shotCheckCounter = -this.shotInterval;
                        // 1つ生成したらループを抜ける
                        break;
                        }
                    }
                    // シングルショットの生存を確認し非生存のものがあれば生成する。
                    // このとき、2個をワンセットで生成し左右に進行方向を振り分ける。
                    for(i = 0; i < this.singleShotArray.length; i += 2){
                        // 非生存可動化を確認する
                        if(this.singleShotArray[i].life <= 0 && this.singleShotArray[i + 1].life <= 0){
                            // 真上の方向（270度）から左右に10度傾いたラジアン
                            let radCW = 280 * Math.PI / 180;
                            let radCCW = 260 * Math.PI / 180;
                            // 自機キャラクターの座標にショットを生成する
                            this.singleShotArray[i].set(this.position.x, this.position.y);
                            this.singleShotArray[i].setVectorFromAngle(radCW); // やや右に向かう
                            this.singleShotArray[i + 1].set(this.position.x, this.position.y);
                            this.singleShotArray[i + 1].setVectorFromAngle(radCCW); // やや左に向かう
                            this.shotCheckCounter = -this.shotInterval;
                            // 一つ生成したらループを抜ける
                            break;
                        }
                    }
                }
            }
            
            // ショットチェック用のカウンターをインクリメントする
            ++this.shotCheckCounter;
        }

        //  自機キャラクターを描画する
        this.draw();

        // 念の為グローバルなアルファの状態をもとに戻す
        this.ctx.globalAlpha = 1.0;
    }

    }   
/**
 * shot クラス
 */
class Shot extends Character {
    /**
     * @constructor
     * @param {CanvasRenderingContext2D} ctx - 描画などに利用する２Dコンテキスト
     * @param {number} x - x座標
     * @param {number} y - y座標
     * @param {number} w - width
     * @param {number} h- height
     * @param {image} image - キャラクター画像のパス
     */
    
    constructor(ctx, x, y, w, h, imagePath){

        // 継承元の初期化
        super(ctx, x, y, w, h, 0, imagePath);
        /**
         * 自身の移動スピード（update1回あたりの移動量）
         * @type {number}
         */
        this.speed = 7;
    }

        /**
         * ショットを配置する
         * @param {number} x - 配置するx座標
         * @param {number} y - 配置するy座標
         */

        set(x,y){

            // 登場開始位置にショットを移動させる
            this.position.set(x, y);
            // ショットのライフを０より大きい値（生存の状態）に設定する
            this.life = 1;
        }
    
        update(){
            
            // もしショットのライフが０以下の場合は何もしない
            if(this.life <= 0){return;}

            // もしショットが画面街へ移動していたらライフを０（非生存の状態）に設定する
            if(this.position.y + this.height < 0){
                this.life = 0;
            }

            // ショットを上に向かって移動させる
            this.position.x += this.vector.x * this.speed;
            this.position.y += this.vector.y * this.speed;

            // ショットを描画する
            this.rotationDraw();
            
        }
}

/**
 * enemy クラス
 */
class Enemy extends Character {
    constructor(ctx, x, y, w, h, imagePath){
        super(ctx, x, y, w, h, 0, imagePath);
        this.speed = 3;
    }

    set(x, y, life = 1){
        this.position.set(x, y);
        this.life = life;
    }

    update(){
        if(this.lide <= 0){return;}
        //  キャラクタが画面外（画面下端）に移動していたら非生存にする
        if(this.position.y - this.height > this.ctx.canvas.height){
            this.life = 0;
        }

        // 上に進む
        this.position.x += this.vector.x * this.speed;
        this.position.y += this.vector.y * this.speed;

        this.draw();
    }
}

